#!/bin/zsh
# 낱말탑 실행: 더블클릭하면 개발 서버를 켜고 브라우저를 연다. 끄려면 이 창에서 Ctrl+C.
cd "$(dirname "$0")" || exit 1

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js가 없습니다. https://nodejs.org 에서 설치한 뒤 다시 실행하세요."
  read -k1 "?아무 키나 누르면 닫힙니다."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "처음 실행: 패키지를 설치합니다…"
  npm install --ignore-scripts || { read -k1 "?설치 실패. 아무 키나 누르면 닫힙니다."; exit 1; }
fi

npm run dev -- --open
