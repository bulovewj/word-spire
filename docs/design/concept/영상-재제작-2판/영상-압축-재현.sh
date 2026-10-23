#!/usr/bin/env bash
# 이미 설치된 Higgsfield sandbox ffmpeg에서 실행. 로컬 설치 없음. 입력은 보관한 압축전-게임루프.mp4.
set -euo pipefail
ffmpeg -v error -i "${1:?압축 전 영상}" -vf 'scale=1280:720:flags=neighbor' -an -c:v libx264 -preset slow -qp 24 -bf 0 -g 144 -force_key_frames 'expr:eq(n,143)' -pix_fmt yuv420p -movflags +faststart -y "${2:?출력.mp4}"
