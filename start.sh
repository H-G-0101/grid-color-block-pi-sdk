#!/usr/bin/env bash
# Sobe um servidor local e abre o jogo. Uso: ./start.sh
cd "$(dirname "$0")" || exit 1
PORT="${1:-8000}"
echo "Servindo em http://localhost:$PORT  (Ctrl+C para parar)"
python3 -m http.server "$PORT"
