#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# The base image is the 390px Figma hero (node 14378:14105). The moving
# center comes from the desktop scroll video. The soft mask joins the two
# before cropping to the exact mobile composition.
"${FFMPEG_BIN:-ffmpeg}" -hide_banner -loglevel warning \
  -loop 1 -framerate 24 -i source/mobile-hero-base.png \
  -i dist/assets/hero-video-scrub-720.mp4 \
  -filter_complex "[1:v]scale=768:432:flags=lanczos,format=rgba[fg];nullsrc=s=768x432,format=gray,geq=lum='255*min(1,min(X/90,(W-X)/90))*min(1,min(Y/70,(H-Y)/70))'[mask];[fg][mask]alphamerge[m];[0:v][m]overlay=46:75:shortest=1,crop=357:743:307:0,scale=390:812:flags=lanczos,setsar=1[out]" \
  -map '[out]' -an -frames:v 153 \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -g 1 -keyint_min 1 -sc_threshold 0 -bf 0 -movflags +faststart \
  -y dist/assets/hero-video-mobile-scrub.mp4
