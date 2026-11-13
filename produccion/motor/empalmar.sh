#!/bin/bash
# Corrige un tramo de un video ya renderizado sin volver a renderizarlo entero.
# Uso: motor/empalmar.sh <carpeta-video> <video.mp4> <desde_s> <hasta_s>
#   Vuelve a renderizar solo [desde, hasta) con el código actual y lo reemplaza en <video.mp4>
#   (mismo número de cuadros; el audio se conserva). Usar segundos con cuadros enteros a 30 fps.
set -e
VID="$1"; MP4="$2"; DESDE="$3"; HASTA="$4"
cd "$(dirname "$0")/.."
F0=$(python3 -c "print(round($DESDE*30))"); F1=$(python3 -c "print(round($HASTA*30))"); N=$((F1-F0))
node motor/render.mjs "$VID" --png --crf 6 --desde "$DESDE" --hasta "$HASTA" --salida "$VID/build/tramo.mp4" > /dev/null
cp "$MP4" "$VID/build/original.mp4"
ffmpeg -v error -y -i "$VID/build/original.mp4" -i "$VID/build/tramo.mp4" -filter_complex \
  "[0:v]trim=end_frame=$F0,setpts=PTS-STARTPTS[a];[1:v]trim=end_frame=$N,setpts=PTS-STARTPTS[b];[0:v]trim=start_frame=$F1,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]" \
  -map "[v]" -map 0:a -c:v libx264 -preset slow -crf 12 -pix_fmt yuv420p -profile:v high \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a copy -movflags +faststart "$MP4"
for f in "$VID/build/original.mp4" "$MP4"; do ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$f"; done
echo "Empalmado: $MP4 (los dos números de arriba deben ser iguales)"
