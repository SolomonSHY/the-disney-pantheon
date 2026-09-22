"""The essays.

The Next.js version compiled the `.mdx` files through @next/mdx with remark-gfm.
None of the content actually uses JSX, so here they are plain GFM Markdown
rendered with markdown-it-py + the footnote plugin, then nudged to emit the same
`data-footnote-ref` / `data-footnote-backref` hooks remark-gfm produces — so
`globals.css` styles the footnotes unchanged.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

from markdown_it import MarkdownIt
from markdown_it.token import Token
from mdit_py_plugins.footnote import footnote_plugin

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"


def _footnote_ref(self: Any, tokens: list[Token], idx: int, options: Any, env: Any) -> str:
    """remark-gfm renders the in-text marker as a bare number, not "[1]".

    The `data-footnote-ref` attribute is what globals.css hangs the small gold
    superscript off.
    """
    token = tokens[idx]
    n = str(token.meta["id"] + 1)
    ref_id = n
    if token.meta.get("subId", 0) > 0:
        ref_id += f":{token.meta['subId']}"
    return (
        f'<sup class="footnote-ref">'
        f'<a href="#fn{n}" id="fnref{ref_id}" data-footnote-ref>{n}</a>'
        f"</sup>"
    )


def _footnote_anchor(
    self: Any, tokens: list[Token], idx: int, options: Any, env: Any
) -> str:
    """The back-link at the end of each note."""
    token = tokens[idx]
    ref_id = str(token.meta["id"] + 1)
    if token.meta.get("subId", 0) > 0:
        ref_id += f":{token.meta['subId']}"
    return (
        f' <a href="#fnref{ref_id}" class="footnote-backref" '
        f'data-footnote-backref aria-label="Back to content">↩</a>'
    )


def _footnote_block_open(
    self: Any, tokens: list[Token], idx: int, options: Any, env: Any
) -> str:
    """No separator rule — remark-gfm emits only the section.

    (An <hr> here would pick up the fleuron styling meant for section breaks.)
    """
    return '<section data-footnotes class="footnotes">\n<ol class="footnotes-list">\n'


def _footnote_block_close(
    self: Any, tokens: list[Token], idx: int, options: Any, env: Any
) -> str:
    return "</ol>\n</section>\n"


def _make_md() -> MarkdownIt:
    md = MarkdownIt("commonmark", {"html": False, "typographer": True})
    md.enable(["table", "strikethrough", "smartquotes", "replacements"])
    md.use(footnote_plugin)
    md.add_render_rule("footnote_ref", _footnote_ref)
    md.add_render_rule("footnote_anchor", _footnote_anchor)
    md.add_render_rule("footnote_block_open", _footnote_block_open)
    md.add_render_rule("footnote_block_close", _footnote_block_close)
    return md


_md = _make_md()


@lru_cache(maxsize=None)
def render(rel_path: str) -> str:
    """Render one content file to HTML. `rel_path` is relative to content/.

    Cached: the essays never change at runtime, exactly as the Next.js build
    compiled them once.
    """
    path = (CONTENT_DIR / rel_path).resolve()
    if not path.is_relative_to(CONTENT_DIR) or not path.is_file():
        raise FileNotFoundError(rel_path)
    return _md.render(path.read_text(encoding="utf-8"))


def human_essay(princess_slug: str) -> str:
    return render(f"human/{princess_slug}.mdx")


def ai_essay(princess_slug: str) -> str:
    """The AI reading. Elsa's lives at the top level (she was never on the matrix)."""
    if princess_slug == "elsa":
        return render("ai-elsa.mdx")
    return render(f"ai/{princess_slug}.mdx")


def overrides_essay() -> str:
    return render("overrides.mdx")
