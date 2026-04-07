#!/bin/zsh
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

cd "$BACKEND_DIR"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -r requirements.txt

# Open browser to the app URL.
open "http://localhost:8000"

python app.py
