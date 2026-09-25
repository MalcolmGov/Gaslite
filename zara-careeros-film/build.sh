#!/usr/bin/env bash
# Full pipeline: music -> VO timing + mix -> 4K picture -> final mux.
# Usage: ./build.sh path/to/helena_vo.(wav|mp3)   [MUSIC=path/to/licensed.wav to skip the placeholder]
set -euo pipefail
cd "$(dirname "$0")"
VO="${1:?usage: ./build.sh VO_FILE}"
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
mkdir -p out
MUSIC="${MUSIC:-out/music.wav}"
[ -f "$MUSIC" ] || python3 music.py "$MUSIC"
python3 mix.py "$VO" "$MUSIC" out/mix.wav
python3 render.py
"$FF" -v error -y -i out/video_4k.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k \
  -shortest -movflags +faststart out/zara_careeros_30s_4k.mp4
echo out/zara_careeros_30s_4k.mp4
