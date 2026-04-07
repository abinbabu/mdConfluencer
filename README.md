# Markdown to Confluence Web Converter

Convert Markdown into Confluence-friendly rich content for copy/paste into Confluence Cloud.

This project uses `md2cf` rendering on the backend and provides a simple web UI for paste/upload, convert, preview, and copy.

## Features

- Paste Markdown or upload a `.md` file
- Convert using `md2cf` renderer
- Preview formatted output before pasting
- Copy rich HTML output for Confluence editor
- Optional flags:
  - Strip first top-level heading
  - Remove single line breaks inside text paragraphs

## Quick Start

### Option 1: One terminal command (no script warning)

```bash
cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python app.py
```

Open [http://localhost:8000](http://localhost:8000).

### Option 2: Docker (easiest for sharing)

```bash
docker compose up --build
```

Open [http://localhost:8000](http://localhost:8000).

To stop:

```bash
docker compose down
```

### Option 3: One-click run (macOS)

Double-click `run.command` in Finder.

Or run:

```bash
cd /Users/abinbabu/Desktop/mdconverter
./run.command
```

### Option 4: Manual run

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open [http://localhost:8000](http://localhost:8000).

## How to Use

1. Paste Markdown or upload a file
2. Click `Convert`
3. Check the `Preview`
4. Click `Copy output`
5. Paste into Confluence Cloud editor (`Cmd+V`)

## Run Tests

```bash
cd backend
source .venv/bin/activate
pytest
```

## Project Structure

- `backend/app.py` - Flask API + static frontend serving
- `backend/requirements.txt` - Python dependencies
- `backend/tests/` - API and conversion parity tests
- `frontend/index.html` - UI markup
- `frontend/src/main.js` - UI logic and API calls
- `frontend/styles.css` - UI styles
- `run.command` - macOS one-click launcher
- `Dockerfile` - container image for backend + frontend
- `docker-compose.yml` - one-command local run

## Scope and Limitations

- v1 supports conversion and copy/paste workflow only (no direct publish to Confluence API)
- Output fidelity depends on `md2cf` behavior and Confluence Cloud paste handling
- Large Markdown files may require request-size and deployment tuning
