# Handoff · Videos 3D de La Clínica del Scooter

Para **Heily** y para la **sesión de Claude** que continúe este trabajo.
Repositorio `renato97mac/clinica-scooter-historias`, rama `claude/bold-gates-tycx6q`, carpeta `produccion/`.
Fecha del traspaso: 10 de noviembre de 2026.

---

## 1. Resumen en 30 segundos

- Hacemos videos verticales (1080×1920, 30 fps, de 40 a 60 s) de **animación 3D explicativa** para TikTok e Instagram del taller. El formato está copiado de un video de referencia de otro taller, pero sin su marca ni sus productos.
- Todo se genera con código desde un **guion**:
  - voz sintética con tiempos palabra por palabra
  - escena 3D (Three.js)
  - subtítulos karaoke
  - rótulos sobre las piezas
  - medidor en pantalla
  - esquemas 2D
  - cierre con logo
- **Heily** hace la edición final: le pone la **música** en TikTok o CapCut.
- **Regla de oro:** ningún dato técnico se publica sin que el taller lo confirme. Cada guion se valida con el taller antes de renderizar.

## 2. Estado de los videos

Los MP4 del repositorio están en `produccion/<carpeta>/<carpeta>.mp4`.

| # | Video | Carpeta | Duración | Scooter 3D | Cierre | Estado |
|---|---|---|---|---|---|---|
| 1 | Cómo inflar bien las llantas | `inflar-llantas` | 58 s | Clásico (8,5", con cámara) | Antiguo (placa de texto) | Entregado |
| 2 | Frena tarde: freno de **disco** | `ajustar-freno` | 56 s | Clásico (disco trasero, tipo Xiaomi M365) | Antiguo | Entregado |
| 3 | Frena tarde: freno de **tambor** | `freno-tambor` | 54 s | Max (10", tipo Ninebot Max) | Antiguo | Entregado. **Heily ya lo editó** (música + cierre con logo); de esa edición salió el estándar actual |
| 4 | Error 14 y 15 | `codigos-error` | 60 s | Max | **Logo (glitch)** | Entregado. Versión corregida por el taller; reemplaza a una primera versión de 44 s |
| 5 | Chirridos de la suspensión | `suspension` | 38 s | Max con suspensión de basculante | Logo | Entregado |
| 6 | Rectificar el disco doblado | `rectificar-disco` | 48 s | Clásico | Logo | Entregado |

**Falta en los videos 4, 5 y 6:** solo la música, que pone Heily.

**Archivos de alta calidad:** los MP4 de alta calidad para edición (CRF 12, de 17 a 22 MB) y los másters ProRes de los videos 1 y 2 se generaron en la sesión anterior y se le enviaron al gerente. **No están en el repositorio** (pesan demasiado). Si se necesitan otra vez, se re-renderizan (sección 7).

## 3. Estándar de edición (acordado con Heily)

| Elemento | Cómo queda |
|---|---|
| Ritmo | ~10 % más rápido que al inicio: `"velocidad": 1.1`, `"pausa_entre_frases": 0.25` |
| Música | **La pone Heily** en TikTok o CapCut. El motor no descarga ni mezcla música. |
| Avatar del perfil (cierre en el teléfono) | Logo del taller: `motor/marca/avatar.png` |
| Cierre | Transición *glitch* de 0,5 s (separación RGB, franjas, código binario, destello) hacia la placa roja con la mascota: `motor/marca/logo-cierre.png`. Es el valor por defecto (`"cierre": "logo"`). |
| Duración del cierre | `"cierre_segundos": 2.4` |
| Estilo visual | Fondo negro y luz de estudio con bordes cian y rojos. **Rojo = problema o error**, **cian = correcto o pieza**. Subtítulos karaoke arriba, con la palabra clave en un recuadro naranja. |

**Pendiente de marca:** el logo se extrajo del video que editó Heily, a 576×1024 escalado, así que está un poco blando. Si Heily tiene el **PNG original**, basta con reemplazar los dos archivos de `motor/marca/` y queda nítido en todo lo que se renderice después.

## 4. Reglas de contenido (aprendidas con el taller)

1. **Validar con el taller** todo procedimiento, código de error, medida o recomendación. Si no hay confirmación, no se renderiza.
2. **No inventar precios** ni promociones. Solo se mencionan los definidos por la empresa; si no hay, no se menciona ninguno.
3. **No usar marcas ajenas** (logos, nombres de otros talleres ni de fabricantes) en la imagen. En la voz se puede decir «tipo Ninebot» o «tipo Loctite» como referencia.
4. **Español peruano:** llanta, aro, vereda, grifo (estación de servicio), bocina, casquillo de bronce, maneta, puño.
5. **El scooter 3D tiene que corresponder a la falla:**
   - El **Ninebot Max** (el scooter del taller) tiene freno de **tambor** adelante, freno electrónico atrás, ruedas de 10" tubeless y **no tiene suspensión**.
   - El freno de **disco** con pinza mecánica corresponde al estilo clásico (Xiaomi M365 y similares).
6. **Cierre comercial permitido:** «Tráelo al taller» o «Taller en Lima».
7. La **voz** es sintética (Kokoro, voz `em_alex`). No suena peruana y nadie la ha escuchado completa. El gerente debe revisarla antes de publicar. A futuro, lo ideal es la voz real de alguien del taller.

### Lo que confirmó el taller, por video

- **Freno de tambor (3):** rueda delantera levantada y scooter apagado. Girar la tuerca del extremo del cable, en el brazo del tambor, en sentido horario, media vuelta a la vez. Criterio: la rueda gira libre y frena firme con la maneta a la mitad. Si ya no queda rosca o sigue frenando mal, las zapatas se cambian en el taller.
- **Error 14 y 15 (4):**
  - **14** = el acelerador no vuelve a cero o falla. **15** = el sensor de la maneta de freno no vuelve a cero o falla.
  - **En casa:** apagar, soltar y mover los mandos varias veces, revisar que nada los trabe (una bolsa colgada o el **puño corrido** que aprieta el acelerador) y volver a encender.
  - **Si sigue:** lo más probable es **cambiar el acelerador o la maneta**, porque se usan cientos de veces por semana y se gastan o se dañan con una caída. No se habla del controlador.
  - **Riesgo:** puede seguir acelerando aunque frenes, o frenarse de golpe cuando aceleras. En una avenida, una ciclovía o un cruce, eso termina en un accidente.
  - **Ojo con el modelo 3D:** la paleta del acelerador va en el **plano horizontal**.
- **Suspensión (5):**
  1. Revisar a la vista el desgaste de las **bocinas y los casquillos de bronce**.
  2. Desmontar para llegar a los pasadores, donde bascula.
  3. Abrir, limpiar y engrasar con grasa **espesa de alto rendimiento**.
  4. Al cerrar, una **arandela o espaciador** disimula el desgaste y deja la suspensión sin chirridos ni holguras.
  5. **Fijador tipo Loctite** en los pernos y apretar.
- **Rectificar disco (6):** el taller dio como ejemplo el video de referencia original, que es enderezar el disco doblado.
  1. Diagnóstico: si roza en un solo punto de la vuelta es el disco; si roza parejo, es la pinza.
  2. Límite: si está rajado o muy torcido, se cambia.
  3. Preparación: scooter apagado, disco frío y dedos sin grasa.
  4. Marcar el punto de roce, sacarlo fuera de la pinza y usar la enderezadora.
  5. Doblar muy poco, al lado contrario del roce, sin hacer fuerza; repetir.
  6. Criterio: el disco baila menos que el grosor de una tarjeta.

## 5. Pendientes e ideas

**Opcionales sobre lo ya hecho:**
- Videos 1 a 3: si se re-renderizan hoy, salen con el cierre nuevo (es el valor por defecto) pero con el ritmo antiguo. Para el estándar completo, poner `velocidad` 1.1 y `pausa_entre_frases` 0.25 en su `guion.json` y regenerar la voz.
- Video 3: dos rótulos rozan el subtítulo durante ~2 s («↻ Sentido horario» y «Gira libre»).

**Próximos temas propuestos (todos necesitan validación del taller):**
- ¿Por qué chirría tu freno? Pastillas cristalizadas o con grasa.
- Errores 10 y 21: comunicación entre el tablero, el controlador y la batería.
- Cómo cuidar la batería: cargas, frío y calor, guardarla.
- Juego en el poste: ajustar el plegado sin apretar de más.

## 6. Cómo trabajamos con el gerente (para la sesión de Claude)

- Habla **solo en español**, con trato cordial.
- Por cada video nuevo:
  1. Propón el guion y los puntos técnicos.
  2. **Pide confirmación** con preguntas concretas.
  3. Renderiza.
  4. **Revisa el video completo** con una hoja de contactos antes de enviarlo.
  5. Corrige por tramos lo que haga falta.
  6. Envía el MP4 de alta calidad.
- Avisa tiempos realistas: un render toma de 1 a 1,5 s por cuadro, es decir ~25 a 35 min por minuto de video.
- El gerente pide seguido «¿cuánto falta?»: da avance y hora estimada.
- Límites del entorno en la nube: no se puede enviar por WhatsApp ni por correo, el conector de Drive solo sirve para archivos de texto chicos, y `SendUserFile` acepta hasta 400 MB por archivo.

## 7. Guía técnica para producir un video

### Piezas

```
produccion/
├── motor/
│   ├── voz.py         guion.json → build/voz.wav + build/tiempos.json (Kokoro TTS local)
│   ├── pagina.html    lienzo 3D + capas (subtítulos, rótulos, fichas, medidor, esquemas, cierre)
│   ├── motor.js       cámara por planos, karaoke, rótulos anclados, medidor (HUD), cierre con glitch
│   ├── kit.js         materiales, luces, piso; crearScooter() (clásico) y crearScooterMax({ suspension })
│   ├── render.mjs     Chromium cuadro por cuadro → ffmpeg
│   ├── extras.py      .srt y voz WAV para edición
│   ├── prueba.sh      capturas de prueba + hoja de contactos
│   ├── empalmar.sh    re-renderiza un tramo y lo reemplaza en el MP4
│   └── marca/         avatar.png, logo-cierre.png
└── <video>/           guion.json, escena.js, <video>.mp4, build/ (no se versiona)
```

### Preparación del entorno (sesión en la nube)

```bash
cd produccion && npm install
python3 -m venv /tmp/venv && /tmp/venv/bin/pip install kokoro-onnx soundfile
mkdir -p /tmp/modelos && cd /tmp/modelos
curl -sSLo kokoro.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx
curl -sSLo voices.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

- **Playwright con Chromium** ya viene instalado en la nube (`render.mjs` lo carga con `require`). No ejecutes `playwright install`.
- La red solo deja salir a **GitHub, npm y PyPI**. Hugging Face, buscadores, Segway y los servicios de voz en la nube están bloqueados.
- En una computadora local hace falta Node 18+, ffmpeg y Playwright con Chromium.

### Flujo

```bash
# 1. Guion: copiar una carpeta parecida (suspension/ o codigos-error/ ya tienen el estándar)
#    Sintaxis: '|' corta la página de subtítulo · *palabra* clave · palabra{lectura} para la voz
#    (ej.: scooter{escúter}, 14{catorce}, PSI{pe ese i}, Loctite{lóctait})
/tmp/venv/bin/python -I motor/voz.py <video> /tmp/modelos/kokoro.onnx /tmp/modelos/voices.bin

# 2. Escena: en escena.js todos los tiempos se escriben como T('id_frase', 'palabra', desfase)

# 3. Probar cuadros sueltos y mirar la hoja
motor/prueba.sh <video> "1.5,8,15,22,30,40"

# 4. Render final (alta calidad para edición) + versión del repositorio
node motor/render.mjs <video> --png --crf 12 --salida entregas/NN-<video>_alta-calidad.mp4
ffmpeg -i entregas/NN-<video>_alta-calidad.mp4 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart <video>/<video>.mp4

# 5. Revisar el video completo (hoja de contactos cada 1,5 s)
ffmpeg -i entregas/NN-<video>_alta-calidad.mp4 -vf "fps=0.66,scale=216:-1,tile=6x5" -frames:v 1 <video>/build/rev/hoja.png

# 6. Corregir un error puntual sin repetir todo el render
motor/empalmar.sh <video> entregas/NN-<video>_alta-calidad.mp4 21 31.4
```

- Los renders largos se lanzan con `run_in_background` del Bash tool, nunca con `&`, para que avisen al terminar.
- Para hacer cola entre renders: `while pgrep -f "render.mjs X" ...; do sleep 15; done; node motor/render.mjs Y ...`
- Máster ProRes 422 HQ (si se pide la máxima calidad): `--master --salida x.mov`. Pesa ~1 GB por minuto; para enviarlo hay que cortarlo en partes de menos de 400 MB, sin pérdida, con `ffmpeg -c copy -f segment`.

### Errores que ya cometimos (y cómo evitarlos)

- **El cuadro vertical es muy angosto** (campo de visión horizontal de ~19°). En los primeros planos, aleja la cámara: con 0,2 m solo entran 7 cm de ancho.
- **Rótulos fuera de cuadro o encima del subtítulo o del medidor:**
  - el subtítulo ocupa más o menos y = 300–420 px
  - el medidor, y = 1180–1330 px
  - las fichas, x ≈ 96 px desde y = 1080 px

  Ajusta `caja: [dx, dy]` y revisa siempre la hoja de contactos.
- **Rótulos de pantalla de un esquema que se ven en el plano siguiente:** termina su `hasta` al menos 0,22 s antes de que acabe el esquema.
- **Cámara del lado -z** (lado izquierdo del conductor): hay que espejar las luces del kit (ver `freno-tambor/escena.js`).
- **Piezas que tapan otras:** la horquilla tapaba el tambor y el amortiguador tapaba el pasador. Mueve la pieza o la cámara.
- **Alineación de la voz:** `voz.py` ya descarta las pausas mal ancladas. Revisa en `tiempos.json` que ninguna palabra dure menos de 0,05 s.
- **Datos técnicos supuestos:** el taller corrigió varios (por ejemplo, el controlador en el error 14/15 y la arandela en la suspensión). Pregunta antes de renderizar.
