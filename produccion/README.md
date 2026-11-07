# Videos explicativos 3D: desglose del formato y receta de producción

Este documento desarma el video de referencia (un explicativo 3D de un taller de patinetes de Valencia sobre «por qué tu patín hace ruido al rodar») y deja la receta para producir videos **del mismo formato** con la marca de La Clínica del Scooter. Al final explica cómo usar el motor de esta carpeta, que genera el video completo (voz, 3D, subtítulos y cierre) a partir de un guion.

> Copiamos el **formato**, no la marca. Nada de logos, nombres, dominios ni productos del otro taller. La marca de agua de TikTok la pone la plataforma al descargar: no se agrega en producción.

---

## 1. Ficha técnica del original

| Parámetro | Valor |
|---|---|
| Duración | 67,2 s: 62 s de contenido + ~5 s de cierre (logo y salida de TikTok) |
| Formato | Vertical 9:16. Llegó a 576×1024 por la compresión de TikTok; se produce en **1080×1920** |
| Cuadros por segundo | 30 fps |
| Audio | Solo voz en off, masculina (tono medio ~130 Hz), español de España. **Sin música de fondo**: entre frases el silencio baja a −75/−90 dB |
| Ritmo de la voz | ~175 palabras en 62 s ≈ **2,8 palabras por segundo** (rápido y sin relleno) |
| Pausas | 0,3–0,45 s entre frases. No hay silencios largos hasta el cierre |
| Cortes duros | Solo 7 (4,9 · 17,4 · 20,2 · 27,7 · 37,4 · 53,7 · 57,3 s). El resto son **movimientos continuos de cámara** dentro de un mismo «mundo» 3D |
| Etiqueta IA | `aigc_label_type: 0`: no fue marcado como contenido generado con IA |

## 2. Estructura narrativa (la fórmula)

| Tiempo | Bloque | Qué hace | Lo que se ve |
|---|---|---|---|
| 0–2 s | **Gancho-pregunta** | Nombra el síntoma que vive el cliente | Macro del freno + rótulo rojo «ROCE» |
| 2–5 s | **Causa en una frase** | «Es el freno, rozando aunque no frenes» | Cámara recorre la pieza: «PINZA», «DISCO», «SIN FRENAR» |
| 5–9 s | **Diagnóstico casero** | «Casi siempre es una de dos cosas. Levanta la rueda y gírala» | Plano general del patín con «1 PINZA / 2 DISCO»; rueda girando con flecha circular |
| 9–17 s | **Cómo distinguir** | Roce continuo = pinza; a golpes = disco | Onda de sonido en pantalla: continua vs. a pulsos |
| 17–20 s | **Explicación con esquema** | Por qué pasa | Vista 2D ortogonal (pastillas y disco) con la nota «exagerado para verlo» |
| 20–27 s | **Límite de seguridad** | Cuándo NO hacerlo en casa: «se cambia» | Grieta roja dibujada sobre el disco + «SE CAMBIA» |
| 27–37 s | **Preparación y pasos** | Checklist + marcar el punto | Fichas «✓ PATÍN APAGADO», «✓ DISCO FRÍO»; «AQUÍ ROZA» |
| 37–46 s | **Herramienta (y venta)** | Cómo se usa + producto propio con precio | La herramienta 3D con la marca grabada |
| 46–53 s | **Error común** | «El fallo es hacer fuerza» | «SIN FUERZA», «MUY POCO» con flecha |
| 53–57 s | **Criterio de éxito medible** | «Menos que el grosor de una tarjeta» | Esquema con «TARJETA» |
| 57–60 s | **Verificación final** | «Prueba el freno antes de salir» | Onda plana: «SILENCIO» |
| 60–62 s | **Llamado a la acción** | «Sigue la cuenta y aprende a arreglar tu patín» | El video se encoge dentro de un teléfono con la fila de perfil |
| 62–67 s | **Logo** | — | Logo + usuario. Luego TikTok añade su propia salida |

**Reglas que se repiten:** una idea por frase, siempre en segunda persona e imperativo («levanta», «gira», «marca»). Cada concepto tiene su imagen. Cada palabra clave se ve tres veces: en la voz, en el subtítulo con recuadro y en un rótulo sobre la pieza.

### Guion del original (reconstruido de los subtítulos)

Entre corchetes van las palabras que no llegan a verse en los subtítulos y se deducen por contexto.

> ¿Por qué tu patín [hace] ruido? Es el freno, rozando aunque no frenes. Y casi siempre es [una de] dos cosas. Levanta la rueda y gírala [con] la mano. Si roza siempre igual, [suele] ser la pinza, mal alineada. Si roza a golpes, en cada vuelta, suele [ser] disco doblado. Una parte torcida pega [en la] pastilla en cada vuelta. Se endereza en casa, [pero es] un fallo que te [lo puede] rajar. Si ya está agrietado o muy doblado, no se endereza: se cambia. Si no, patín apagado, disco frío y dedos sin grasa. Gira despacio y marca dónde roza. Saca esa marca de la pinza, porque dentro no cabe la herramienta. Encaja en el borde la ranura del enderezador, justo en la marca. Si no tienes uno, este es el nuestro, en [su web], por [su precio]. Y el fallo es hacer fuerza: dobla muy poco, hacia [el] contrario al roce. Gira y repite, siempre poquito. Cuando el disco baile menos que el grosor de una tarjeta, ya está. Si ya no suena, prueba el freno antes de salir. Sigue la cuenta y aprende a arreglar tu patín.

## 3. Lenguaje visual

### Estilo 3D
- **Render de estudio sobre negro** (look tipo Blender/Eevee): fondo casi negro `#050608` con niebla que funde el fondo, piso oscuro apenas reflectante.
- **Materiales:** plástico negro brillante con barniz, aluminio y acero cepillados, goma mate. Nada de texturas fotográficas: limpio y «de producto».
- **Iluminación teal & orange:** una luz principal blanca cálida, un **contraluz cian** (`#3fd3df`) que dibuja los bordes y un **contraluz rojo-naranja** (`#ff3a1a`). Los LED rojos del patín brillan con resplandor (bloom).
- **Código emocional de la luz:** cuando hay problema o error, la escena se tiñe de rojo; cuando todo está bien, predominan el cian y el blanco.
- **Cámara:** macros con lente larga (fov 30–35°), movimientos lentos y suaves (dolly y órbita) de 2–4 s por idea, y transiciones en vuelo de una pieza a otra en lugar de cortes. Planos generales del vehículo completo solo para contextualizar.
- **Esquemas 2D:** cuando algo no se ve en 3D (holguras, deformaciones), pasa a una vista técnica plana en grises, con línea roja de referencia y la nota «exagerado para verlo».

### Subtítulos (karaoke)
| Propiedad | Valor |
|---|---|
| Posición | Centrados, arriba: la primera línea a ~17–19 % de la altura (zona segura, lejos de la interfaz de TikTok) |
| Fuente | Sans geométrica redondeada (usamos **Poppins**): ~54 px en 1080 de ancho, máximo 2 líneas |
| Aparición | Palabra por palabra, al ritmo exacto de la voz. Página de 2 a 6 palabras, cortada en comas |
| Palabra actual | Blanca, negrita 700 |
| Palabras ya dichas | Gris translúcido (~58 %), peso 500 |
| Palabra clave | Recuadro naranja (`#ff6a1f`) con fondo naranja al 20 %, esquinas redondeadas y **dos «tiradores» circulares** (arriba-izquierda y abajo-derecha), como una selección en un programa de diseño. Una por frase |
| Legibilidad | Sombra suave negra, sin caja de fondo |

### Rótulos sobre las piezas
- Caja oscura translúcida, borde de 2–3 px redondeado, texto **MAYÚSCULAS negrita** blanco.
- **Color del borde = significado:** cian para el nombre de una pieza (PINZA, DISCO, VÁLVULA), rojo para un problema (ROCE, SIN FRENAR, TE PASAS), blanco para medidas o neutros (TARJETA, RECTO).
- Línea guía fina desde la caja hasta un **punto en la pieza**. El rótulo sigue a la pieza mientras la cámara se mueve.
- Entran con un «pop» de ~150 ms y salen al cambiar de idea.
- **Fichas de checklist** a la izquierda: «✓ PATÍN APAGADO», «✓ DISCO FRÍO». Aparecen una a una.
- **Indicador de datos** (en el original, una onda de sonido): un panel oscuro con un medidor que cambia según la narración. En nuestro video es un medidor de presión en PSI.

### Cierre
1. En la última frase, el video se **encoge dentro de un teléfono** con la fila del perfil (avatar, usuario y botón Seguir).
2. Fundido a una placa con el **logo**, una línea de color animada y el **@usuario**: unos 3,5 s, sin voz.

## 4. Receta para un video nuevo

1. **Elegir un síntoma** que el cliente reconozca («rinde menos», «hace ruido», «frena mal»). El título es la pregunta.
2. **Guion de 150 a 175 palabras** con esta plantilla:
   - Gancho: «¿Por qué tu scooter ___?»
   - Causa: «Es ___. Casi siempre es ___.»
   - Cómo comprobarlo en casa (una prueba simple).
   - Por qué pasa (para el esquema 2D, con «exagerado para verlo»).
   - Límite de seguridad: cuándo NO hacerlo uno mismo («eso se cambia» o «tráelo al taller»).
   - Preparación (2 o 3 fichas de checklist).
   - Pasos (verbos en imperativo, una acción por frase).
   - Error común: «Y el error es ___».
   - Criterio de éxito medible: «cuando ___, ya está».
   - Verificación final antes de salir.
   - Llamado a la acción: «Sigue a La Clínica del Scooter y aprende a ___».
3. **Marcar en el guion:** la palabra clave de cada frase (`*palabra*`), los cortes de subtítulo (`|`) y la lectura de números y siglas (`45{cuarenta y cinco}`).
4. **Lista de planos:** una idea, un plano. Macro → general → macro. Usar como máximo 6–8 cortes duros; el resto, movimientos de cámara.
5. **Rótulos:** una palabra clave por frase, con el color según su significado.
6. **Precios y promociones:** solo los definidos por la empresa. Si no hay, no se mencionan. Por eso el video nuevo no tiene bloque de venta.

## 5. El motor de esta carpeta

```
produccion/
├── motor/
│   ├── voz.py          locución (Kokoro TTS, local) + tiempos de cada palabra
│   ├── pagina.html     lienzo 3D + capas: subtítulos, rótulos, fichas, medidor, esquemas, cierre
│   ├── motor.js        cámara por planos, karaoke, rótulos anclados en 3D, medidor, efectos (bloom)
│   ├── kit.js          piezas reutilizables: materiales, luces, piso, ruedas y scooter completo
│   └── render.mjs      Chromium cuadro por cuadro → ffmpeg (H.264 1080×1920 30 fps + AAC)
├── inflar-llantas/     video 1: cómo inflar bien las llantas (58 s)
│   ├── guion.json      texto, voz, velocidad, marca
│   ├── escena.js       modelos 3D, planos, rótulos y animaciones (sincronizados con T('frase','palabra'))
│   └── inflar-llantas.mp4
└── ajustar-freno/      video 2: por qué tu scooter frena tarde, ajuste del freno de disco (56 s)
    ├── guion.json
    ├── escena.js       usa motor/kit.js + disco, pinza mecánica, maneta, regulador, llave Allen
    └── ajustar-freno.mp4
```

### Requisitos
- Node 18+, ffmpeg, Playwright con Chromium (`npm i -g playwright && npx playwright install chromium`).
- Python 3.10+ con `pip install kokoro-onnx soundfile`, más los archivos del modelo `kokoro-v1.0.int8.onnx` y `voices-v1.0.bin`, que están en las *releases* de GitHub de `thewh1teagle/kokoro-onnx`.

### Producir
```bash
cd produccion
npm install
python motor/voz.py inflar-llantas ruta/kokoro-v1.0.int8.onnx ruta/voices-v1.0.bin   # voz + tiempos
node motor/render.mjs inflar-llantas --cuadros 2,15,30          # capturas de prueba (PNG)
node motor/render.mjs inflar-llantas                             # video completo → inflar-llantas/build/video.mp4
```
El render toma unos 20–25 min por minuto de video en CPU, sin GPU. Con GPU es mucho más rápido.

### Hacer otro video
Copiar `ajustar-freno/` (es el que usa el kit) a una carpeta nueva, reescribir `guion.json`, generar la voz y adaptar `escena.js`. Los tiempos se escriben como `T('id_frase', 'palabra')`, así que si cambia la locución todo se vuelve a sincronizar solo.

- `kit.crearScooter()` devuelve el scooter completo con sus ruedas (`delantera`, `trasera`, cada una con `giro` para hacerla girar). `raiz.rotation.z` levanta la rueda trasera.
- `kit.luces.modo('error')` tiñe la escena de rojo; `kit.luces.modo('normal')` la devuelve al cian.
- El medidor se configura por entrada: `{ nombre, unidad, max, marcas, banda: [min, max], valor: (t) => número }`. En el video de llantas mide PSI; en el de frenos, el % de recorrido de la maneta.

### Mejoras recomendadas
- **Voz:** Kokoro es una voz sintética neutra. Para que suene peruana y natural, conviene grabar la voz real de alguien del taller (o usar una voz neural de pago) y pasar el audio por `voz.py` con un alineador (por ejemplo WhisperX) para obtener los tiempos de cada palabra.
- **3D:** los modelos están hechos con piezas simples. Si el taller tiene o encarga modelos `.glb` de un scooter real, se cargan en `escena.js` con `GLTFLoader` y el resto del motor no cambia.

## 6. Próximos videos sugeridos (misma fórmula)
1. ~~**«¿Por qué tu scooter frena tarde?»:** ajustar el cable del freno de disco~~ → hecho en `ajustar-freno/`.
2. **«¿Por qué chirría tu freno?»:** pastillas cristalizadas o disco con grasa (límite: pastilla con menos de 1,5 mm → se cambia).
3. **«¿Por qué tu scooter tiene juego en el poste?»:** apretar el mecanismo de plegado (error: apretar de más).
4. **«¿Cuánto dura tu batería?»:** cargas, frío y calor, guardarlo al 50–80 %.
