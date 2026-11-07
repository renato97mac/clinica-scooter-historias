"""Genera la locución y los tiempos palabra por palabra de un guion.

Uso:
  python voz.py <carpeta-del-video> <ruta-modelo-kokoro.onnx> <ruta-voices.bin>

Lee <carpeta>/guion.json y escribe:
  <carpeta>/build/voz.wav      locución completa (mono, 24 kHz)
  <carpeta>/build/tiempos.json frases, páginas de subtítulo y tiempos de cada palabra

Sintaxis del texto del guion:
  |              corte de página de subtítulo
  *palabra*      palabra clave (recuadro naranja); puede abarcar varias palabras
  palabra{lect}  la voz lee "lect" en lugar de "palabra" (números, siglas, anglicismos)
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

VOCALES = re.compile(r"[aeiouáéíóúü]+", re.I)
PUNTUACION_PAUSA = (",", ":", ";", ".", "?", "!")
TOKEN = re.compile(r"\S*?\{[^}]*\}\S*|\S+")


def parsear(texto):
    """Devuelve la lista de palabras: texto visible, lectura, página, grupo clave."""
    palabras = []
    pagina = 0
    grupo = None
    contador_grupos = 0
    for crudo in TOKEN.findall(texto):
        if crudo == "|":
            pagina += 1
            continue
        abre = crudo.startswith("*")
        if abre:
            crudo = crudo[1:]
            contador_grupos += 1
            grupo = contador_grupos
        cierra = crudo.endswith("*")
        if cierra:
            crudo = crudo[:-1]
        m = re.match(r"^(.*?)\{([^}]*)\}(.*)$", crudo)
        if m:
            visible = m.group(1) + m.group(3)
            lectura = m.group(2) + m.group(3)
        else:
            visible = lectura = crudo
        palabras.append({"texto": visible, "lectura": lectura, "pagina": pagina, "clave": grupo})
        if cierra:
            grupo = None
    return palabras


def silabas(lectura):
    return max(1, sum(1 for _ in VOCALES.finditer(lectura)))


def silencios(audio, sr, umbral_db=-38.0, minimo=0.08):
    """Tramos de silencio (inicio, fin) en segundos, dentro del audio."""
    ventana = int(sr * 0.01)
    n = len(audio) // ventana
    rms = np.sqrt(np.mean(audio[: n * ventana].reshape(n, ventana) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms / (np.max(rms) + 1e-12))
    callado = db < umbral_db
    tramos, inicio = [], None
    for i, c in enumerate(callado):
        if c and inicio is None:
            inicio = i
        elif not c and inicio is not None:
            tramos.append((inicio, i))
            inicio = None
    if inicio is not None:
        tramos.append((inicio, n))
    return [(a * 0.01, b * 0.01) for a, b in tramos if (b - a) * 0.01 >= minimo], db


def recortar(audio, sr):
    """Quita silencio al inicio y al final, dejando 30 ms de colchón."""
    _, db = silencios(audio, sr)
    voz = np.where(db >= -38.0)[0]
    if len(voz) == 0:
        return audio
    a = max(0, int((voz[0] * 0.01 - 0.03) * sr))
    b = min(len(audio), int(((voz[-1] + 1) * 0.01 + 0.03) * sr))
    return audio[a:b]


def tiempos_palabras(palabras, audio, sr):
    """Reparte el tiempo de la frase entre sus palabras.

    Las pausas reales del audio se anclan a la puntuación (comas, dos puntos...);
    entre anclas, el tiempo se reparte según el número de sílabas."""
    dur = len(audio) / sr
    cortes = [i for i, p in enumerate(palabras[:-1]) if p["lectura"].endswith(PUNTUACION_PAUSA)]
    internos = [(a, b) for a, b in silencios(audio, sr)[0] if a > 0.05 and b < dur - 0.05]
    anclas = []
    if cortes and len(internos) >= len(cortes):
        mejores = sorted(sorted(internos, key=lambda t: t[1] - t[0], reverse=True)[: len(cortes)])
        anclas = list(zip(cortes, mejores))
    # Segmentos de habla: [inicio, fin, índice primera palabra, índice última palabra]
    segmentos = []
    t0, w0 = 0.03, 0
    for idx, (a, b) in anclas:
        segmentos.append((t0, a, w0, idx))
        t0, w0 = b, idx + 1
    segmentos.append((t0, dur - 0.03, w0, len(palabras) - 1))
    # Validación: cada tramo debe tener un ritmo posible (entre 0,07 y 0,45 s por sílaba).
    # Si una pausa se ancló en el lugar equivocado, se descartan las anclas.
    def ritmo_ok(ini, fin, a, b):
        sil = sum(silabas(palabras[i]["lectura"]) for i in range(a, b + 1))
        return 0.07 <= (fin - ini) / sil <= 0.45
    if anclas and not all(ritmo_ok(*s) for s in segmentos):
        anclas = []
        segmentos = [(0.03, dur - 0.03, 0, len(palabras) - 1)]
    for ini, fin, a, b in segmentos:
        # Sin anclas, la puntuación suma un peso de pausa
        pesos = [silabas(palabras[i]["lectura"]) + 0.6 + (1.4 if not anclas and i < b and palabras[i]["lectura"].endswith(PUNTUACION_PAUSA) else 0)
                 for i in range(a, b + 1)]
        total = sum(pesos)
        t = ini
        for i, peso in zip(range(a, b + 1), pesos):
            d = (fin - ini) * peso / total
            palabras[i]["inicio"] = round(t, 3)
            palabras[i]["fin"] = round(t + d, 3)
            t += d
    return bool(anclas) and len(anclas) == len(cortes)


def main():
    carpeta = Path(sys.argv[1])
    guion = json.loads((carpeta / "guion.json").read_text(encoding="utf-8"))
    kokoro = Kokoro(sys.argv[2], sys.argv[3])
    sr = 24000
    pausa = float(guion.get("pausa_entre_frases", 0.25))
    pistas = [np.zeros(int(0.12 * sr), dtype=np.float32)]
    t = 0.12
    frases = []
    pagina_global = 0
    for frase in guion["frases"]:
        palabras = parsear(frase["texto"])
        lectura = " ".join(p["lectura"] for p in palabras)
        audio, sr_k = kokoro.create(lectura, voice=guion.get("voz", "em_alex"),
                                    speed=float(guion.get("velocidad", 1.0)), lang="es")
        assert sr_k == sr
        audio = recortar(np.asarray(audio, dtype=np.float32), sr)
        anclado = tiempos_palabras(palabras, audio, sr)
        base = pagina_global
        for p in palabras:
            p["inicio"] = round(p["inicio"] + t, 3)
            p["fin"] = round(p["fin"] + t, 3)
            p["pagina"] += base
            pagina_global = max(pagina_global, p["pagina"])
        pagina_global += 1
        dur = len(audio) / sr
        frases.append({"id": frase["id"], "inicio": round(t, 3), "fin": round(t + dur, 3), "palabras": palabras})
        print(f"{frase['id']:10s} {t:6.2f}s +{dur:4.2f}s  anclas={'sí' if anclado else 'no'}  {lectura}")
        pistas.append(audio)
        pistas.append(np.zeros(int(pausa * sr), dtype=np.float32))
        t += dur + pausa
    salida = carpeta / "build"
    salida.mkdir(exist_ok=True)
    voz = np.concatenate(pistas)
    voz = voz / (np.max(np.abs(voz)) + 1e-9) * 0.89
    sf.write(salida / "voz.wav", voz, sr)
    duracion = round(t + float(guion.get("cierre_segundos", 3.0)), 3)
    (salida / "tiempos.json").write_text(json.dumps(
        {"duracion": duracion, "fin_voz": round(t, 3), "frases": frases}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Voz: {t:.2f}s  ·  Video total: {duracion:.2f}s")


if __name__ == "__main__":
    main()
