#!/bin/bash
# Capturas de prueba de un video y hoja de contactos para revisarlas.
# Uso: motor/prueba.sh <carpeta-video> "1.5,4.0,12.3"
# Resultado: <carpeta-video>/build/hoja.png (4 columnas, 360x640 por cuadro)
set -e
VID="$1"; TIEMPOS="$2"
cd "$(dirname "$0")/.."
node motor/render.mjs "$VID" --cuadros "$TIEMPOS" > /dev/null
python3 -I - "$TIEMPOS" "$VID" <<'PY'
import sys
from PIL import Image
ts=[float(x) for x in sys.argv[1].split(',')]; v=sys.argv[2]
ims=[Image.open(f'{v}/build/pruebas/t{t:.2f}.png').resize((360,640)) for t in ts]
cols=min(4,len(ims)); rows=(len(ims)+cols-1)//cols
s=Image.new('RGB',(360*cols,640*rows))
for i,im in enumerate(ims): s.paste(im,((i%cols)*360,(i//cols)*640))
s.save(f'{v}/build/hoja.png'); print(f'{v}/build/hoja.png')
PY
