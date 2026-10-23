#!/usr/bin/env bash
# Higgsfield sandbox의 FFmpeg로 생성 원본을 6초 대기 루프로 재현한다.
set -euo pipefail
TASK_SOURCE="${1:?사용법: title-loop.sh 원본.mp4 출력폴더}"
TASK_OUTPUT="${2:-.}"
mkdir -p "$TASK_OUTPUT"
ffmpeg -v error -i "$TASK_SOURCE" \
  -filter_complex '[0:v]trim=start_frame=0:end_frame=72,setpts=PTS-STARTPTS,crop=1920:1080:0:4,split[f][r];[r]reverse,setpts=PTS-STARTPTS[b];[f][b]concat=n=2:v=1:a=0,format=yuv420p[v]' \
  -map '[v]' -an -r 24 -c:v libx264 -preset medium -qp 18 -bf 0 -g 144 \
  -force_key_frames 'expr:eq(n,143)' -movflags +faststart \
  -y "$TASK_OUTPUT/title-idle-korean-v1.mp4"
ffmpeg -v error -i "$TASK_OUTPUT/title-idle-korean-v1.mp4" \
  -frames:v 1 -y "$TASK_OUTPUT/title-korean-v1.png"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,codec_type,width,height,avg_frame_rate,nb_frames \
  -of json "$TASK_OUTPUT/title-idle-korean-v1.mp4" > "$TASK_OUTPUT/title-video-probe.json"
ffmpeg -v error -i "$TASK_OUTPUT/title-idle-korean-v1.mp4" \
  -f framemd5 -y "$TASK_OUTPUT/title-frame-hashes.txt"
