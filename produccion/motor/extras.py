"""Genera material de apoyo para edición a partir de <video>/build/tiempos.json:
subtítulos .srt (una línea por página de subtítulo) y la voz sola en WAV 48 kHz / 24 bits.

Uso: python motor/extras.py <carpeta-video> <prefijo-salida>
"""
import json
import subprocess
import sys
from pathlib import Path


def ts(s):
    ms = int(round(s * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    seg, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{seg:02d},{ms:03d}"


def main():
    carpeta, prefijo = Path(sys.argv[1]), sys.argv[2]
    datos = json.loads((carpeta / "build" / "tiempos.json").read_text(encoding="utf-8"))
    paginas = {}
    for f in datos["frases"]:
        for w in f["palabras"]:
            p = paginas.setdefault(w["pagina"], {"inicio": w["inicio"], "fin": w["fin"], "texto": []})
            p["fin"] = w["fin"]
            p["texto"].append(w["texto"])
    orden = sorted(paginas.values(), key=lambda p: p["inicio"])
    lineas = []
    for i, p in enumerate(orden):
        fin = min(p["fin"] + 0.25, orden[i + 1]["inicio"]) if i + 1 < len(orden) else p["fin"] + 0.5
        lineas += [str(i + 1), f"{ts(p['inicio'])} --> {ts(fin)}", " ".join(p["texto"]), ""]
    Path(f"{prefijo}_subtitulos.srt").write_text("\n".join(lineas), encoding="utf-8")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(carpeta / "build" / "voz.wav"),
                    "-af", "aresample=48000:resampler=soxr", "-c:a", "pcm_s24le", f"{prefijo}_voz.wav"], check=True)
    print(f"{prefijo}_subtitulos.srt  ({len(orden)} subtítulos)")


if __name__ == "__main__":
    main()
