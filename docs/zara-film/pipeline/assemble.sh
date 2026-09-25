#!/bin/bash
# Zara film assembly — run inside the Higgsfield sandbox. Expects clips.env (S1..S7, VO1..VO9 URLs) beside it.
set -e; cd "$(dirname "$0")"; source ./clips.env
echo "== download clips =="; for i in 1 2 3 4 5 6 7; do v="S$i"; curl -sf -o s$i.mp4 "${!v}"; done
echo "== download VO =="; n=0; for k in vo1 vo2a vo2b vo3 vo4 vo5 vo6 vo7 vo8; do n=$((n+1)); v="VO$n"; curl -sf -o $k.mp3 "${!v}"; done
echo "== fonts =="; mkdir -p fonts; curl -sfL -o fonts/Montserrat-Medium.ttf https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Medium.ttf || curl -sfL -o fonts/Montserrat-Medium.ttf https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Medium.ttf || echo "no Montserrat-Medium; falling back"; ls -la fonts || true
echo "== endcard =="; python3 endcard.py
echo "== score =="; bash score.sh
echo "== graph =="; python3 build.py; TAIL=$(cat tail.txt)
echo "== render =="; time ffmpeg -hide_banner -y -i s1.mp4 -i s2.mp4 -i s3.mp4 -i s4.mp4 -i s5.mp4 -i s6.mp4 -i s7.mp4 \
 -loop 1 -framerate 24 -t 60 -i card_A.png -loop 1 -framerate 24 -t 60 -i card_B.png \
 -f lavfi -i "color=c=0x060B14:s=1920x1080:r=24:d=$TAIL" \
 -i vo1.mp3 -i vo2a.mp3 -i vo2b.mp3 -i vo3.mp3 -i vo4.mp3 -i vo5.mp3 -i vo6.mp3 -i vo7.mp3 -i vo8.mp3 -i bed.wav \
 -filter_complex_script fc.txt -map "[vout]" -map "[aout]" -c:v libx264 -preset slow -crf 15 -x264-params aq-mode=3 -pix_fmt yuv420p -r 24 -c:a aac -b:a 192k -movflags +faststart -t 60 zara_film_1080p.mp4 2> render.err || { tail -40 render.err; exit 1; }
tail -3 render.err
echo "== verify =="; ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,sample_rate,channels -of default=nw=1 zara_film_1080p.mp4
ffmpeg -hide_banner -i zara_film_1080p.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|LRA:|Peak:" | tail -3
echo "== cut sheet =="; i=0; for t in 1 5 9 13 17 21 25 29 33 37 41 45 49 53 55 58.5; do i=$((i+1)); ffmpeg -v error -y -ss $t -i zara_film_1080p.mp4 -frames:v 1 -q:v 3 c_$i.jpg; done
ffmpeg -v error -y $(for i in $(seq 1 16); do printf -- "-i c_%d.jpg " $i; done) -filter_complex "$(for i in $(seq 0 15); do printf "[%d]scale=640:360[p%d];" $i $i; done)[p0][p1][p2][p3]hstack=4[r0];[p4][p5][p6][p7]hstack=4[r1];[p8][p9][p10][p11]hstack=4[r2];[p12][p13][p14][p15]hstack=4[r3];[r0][r1][r2][r3]vstack=4" -q:v 3 cut_sheet.jpg
echo "== upload (waits for put_urls.sh) =="; [ -f skip_upload ] && { echo "upload skipped (dry run)"; echo "== DONE =="; exit 0; }; while [ ! -f put_urls.sh ]; do sleep 5; done; source ./put_urls.sh
curl -sf -o /dev/null -w "mp4 PUT http=%{http_code}\n" -X PUT -H "Content-Type: video/mp4" --data-binary @zara_film_1080p.mp4 "$PUT_MP4"
curl -sf -o /dev/null -w "sheet PUT http=%{http_code}\n" -X PUT -H "Content-Type: image/jpeg" --data-binary @cut_sheet.jpg "$PUT_SHEET"
echo "== DONE =="
