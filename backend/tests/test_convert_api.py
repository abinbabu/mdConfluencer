from pathlib import Path
import sys

import mistune
from md2cf.confluence_renderer import ConfluenceRenderer

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import app

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def render_with_md2cf(markdown_text: str) -> str:
    renderer = ConfluenceRenderer(use_xhtml=True)
    markdown = mistune.Markdown(renderer=renderer)
    return markdown(markdown_text)


def test_convert_matches_md2cf_renderer_for_basic_fixture():
    sample = (FIXTURES_DIR / "basic.md").read_text(encoding="utf-8")
    expected = render_with_md2cf(sample)

    client = app.test_client()
    response = client.post("/api/convert", json={"markdown": sample, "options": {}})

    assert response.status_code == 200
    assert response.get_json()["converted"] == expected


def test_strip_top_header_option_removes_first_h1():
    sample = "# Main title\n\n## Section\n\nBody"
    client = app.test_client()

    response = client.post(
        "/api/convert",
        json={"markdown": sample, "options": {"stripTopHeader": True}},
    )

    assert response.status_code == 200
    converted = response.get_json()["converted"]
    assert "Main title" not in converted
    assert "Section" in converted


def test_remove_text_newlines_option_collapses_single_line_breaks():
    sample = (FIXTURES_DIR / "newlines.md").read_text(encoding="utf-8")
    client = app.test_client()

    response = client.post(
        "/api/convert",
        json={"markdown": sample, "options": {"removeTextNewlines": True}},
    )

    assert response.status_code == 200
    converted = response.get_json()["converted"]
    assert "This paragraph has hard line breaks." in converted


def test_convert_rejects_empty_markdown():
    client = app.test_client()
    response = client.post("/api/convert", json={"markdown": "   "})
    assert response.status_code == 400
