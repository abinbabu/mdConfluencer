from __future__ import annotations

import re
from pathlib import Path

import mistune
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from md2cf.confluence_renderer import ConfluenceRenderer


FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
CORS(app)


def strip_first_top_header(markdown_text: str) -> str:
    lines = markdown_text.splitlines()
    for idx, line in enumerate(lines):
        if line.strip() == "":
            continue
        if line.startswith("# "):
            remaining = lines[idx + 1 :]
            while remaining and remaining[0].strip() == "":
                remaining = remaining[1:]
            return "\n".join(remaining)
        return markdown_text
    return markdown_text


def collapse_single_newlines(markdown_text: str) -> str:
    paragraphs = re.split(r"\n\s*\n", markdown_text)
    processed: list[str] = []
    for paragraph in paragraphs:
        if "\n" not in paragraph:
            processed.append(paragraph)
            continue
        if re.search(r"^\s{4,}|\t|^\s*[-*+]\s|^\s*\d+\.\s|^\s*#|```", paragraph, re.MULTILINE):
            processed.append(paragraph)
            continue
        processed.append(re.sub(r"\s*\n\s*", " ", paragraph).strip())
    return "\n\n".join(processed)


def convert_markdown(markdown_text: str, strip_top_header: bool, remove_text_newlines: bool) -> str:
    prepared = markdown_text
    if strip_top_header:
        prepared = strip_first_top_header(prepared)
    if remove_text_newlines:
        prepared = collapse_single_newlines(prepared)

    renderer = ConfluenceRenderer(use_xhtml=True)
    markdown = mistune.Markdown(renderer=renderer)
    return markdown(prepared)


@app.post("/api/convert")
def convert_endpoint():
    payload = request.get_json(silent=True) or {}
    markdown_text = payload.get("markdown", "")
    options = payload.get("options", {})

    if not isinstance(markdown_text, str) or not markdown_text.strip():
        return jsonify({"error": "Markdown content is required."}), 400

    strip_top_header = bool(options.get("stripTopHeader", False))
    remove_text_newlines = bool(options.get("removeTextNewlines", False))

    try:
        converted = convert_markdown(markdown_text, strip_top_header, remove_text_newlines)
    except Exception as exc:  # pragma: no cover
        return jsonify({"error": f"Conversion failed: {exc}"}), 500

    return jsonify({"converted": converted})


@app.get("/")
def root():
    return send_from_directory(app.static_folder, "index.html")


@app.get("/<path:filename>")
def frontend_assets(filename: str):
    return send_from_directory(app.static_folder, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
