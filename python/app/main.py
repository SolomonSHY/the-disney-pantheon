"""The FastAPI app — one route per `app/**/page.tsx` in the Next.js original.

Route map:
    /                    app/page.tsx
    /chapters            app/chapters/page.tsx
    /chapters/{slug}     app/chapters/[slug]/page.tsx   (slug is the GOD slug)
    /matrix              app/matrix/page.tsx
    /overrides           app/overrides/page.tsx
    /bonus               app/bonus/page.tsx
    /robots.txt          app/robots.ts
    /sitemap.xml         app/sitemap.ts
    (anything else)      app/not-found.tsx
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from markupsafe import Markup
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import content, data, icons

BASE_DIR = Path(__file__).resolve().parent
SITE_URL = os.environ.get("SITE_URL", "https://disney-pantheon.com").rstrip("/")

SITE_NAME = "The Disney Princess Pantheon"
SITE_DESCRIPTION = (
    "Thirteen Olympian gods, each disguised as a Disney princess — a scored, "
    "adversarially-reviewed mapping across five facets of character."
)
SOCIAL_DESCRIPTION = (
    "The Olympian gods, starved of worship, have each disguised themselves as a "
    "Disney princess."
)

app = FastAPI(title=SITE_NAME, docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

templates = Jinja2Templates(directory=BASE_DIR / "templates")

# Everything the templates reach for that the TSX imported from '@/lib/data'.
templates.env.globals.update(
    god_icon=icons.god_icon,
    princess_icon=icons.princess_icon,
    temple_crest=icons.temple_crest,
    FACET_ORDER=data.FACET_ORDER,
    DISPLAY_CAP=data.DISPLAY_CAP,
    facet_name=data.facet_name,
    facet_gloss=data.facet_gloss,
    facet_color=data.facet_color,
    score_color=data.score_color,
    score_ink=data.score_ink,
    god_accent=data.god_accent,
    ordered_pairings=data.ordered_pairings,
    princesses=data.princesses,
    get_pairing=data.get_pairing,
    get_algorithmic_pairing=data.get_algorithmic_pairing,
    site_name=SITE_NAME,
    site_url=SITE_URL,
)


def _seq(n: int) -> str:
    """The 01..13 sequence label, as String(n).padStart(2, '0') did."""
    return f"{n:02d}"


def _score(value: float) -> str:
    """toFixed(1)."""
    return f"{value:.1f}"


def _tojson(value: Any) -> Markup:
    """JSON for a data-* attribute or an inline <script type="application/json">."""
    dumped = json.dumps(data.as_dict(value), ensure_ascii=False)
    # Keep the payload safe inside both an HTML attribute and a <script> body.
    dumped = (
        dumped.replace("&", "\\u0026")
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("'", "\\u0027")
        .replace('"', "&quot;")
    )
    return Markup(dumped)


templates.env.filters.update(seq=_seq, score=_score, attrjson=_tojson)

ORDINALS = [
    "",
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th",
    "13th",
]


def ordinal(n: int) -> str:
    return ORDINALS[n] if 0 <= n < len(ORDINALS) else f"{n}th"


def _page(
    request: Request,
    template: str,
    *,
    title: str | None = None,
    absolute_title: str | None = None,
    description: str = SITE_DESCRIPTION,
    og_image: str | None = None,
    og_alt: str | None = None,
    social_description: str | None = None,
    status_code: int = 200,
    **ctx: Any,
) -> HTMLResponse:
    """Render a page, filling in the metadata `layout.tsx` + each page's
    `export const metadata` used to produce."""
    if absolute_title:
        full_title = absolute_title
    elif title:
        full_title = f"{title} · {SITE_NAME}"
    else:
        full_title = SITE_NAME
    return templates.TemplateResponse(
        request,
        template,
        {
            "page_title": full_title,
            "description": description,
            "social_description": social_description or description,
            "og_image": og_image or "/static/opengraph-image.png",
            "og_alt": og_alt,
            "canonical": f"{SITE_URL}{request.url.path}",
            **ctx,
        },
        status_code=status_code,
    )


# --- app/page.tsx -----------------------------------------------------------


@app.get("/", response_class=HTMLResponse)
def landing(request: Request) -> HTMLResponse:
    items = [
        {
            "seq": i + 1,
            "god": p.god,
            "godSlug": p.god_slug,
            "princess": p.princess,
            "princessSlug": p.princess_slug,
            "score": p.score,
            "facets": p.facets,
            "hints": data.god_domain_hints(p.god),
            "distractors": data.get_near_miss_princesses(p.god_slug, p.princess_slug, 3),
            "isFirstChoice": p.is_first_choice,
            "isOverride": data.is_override(p.princess_slug),
            "accent": data.god_accent(p.god_slug),
        }
        for i, p in enumerate(data.ordered_pairings)
    ]

    bonus = {
        "god": "Hades",
        "princess": "Elsa",
        "score": data.appendix.score,
        "facets": data.appendix.facets,
        "hints": ["the dead", "underworld", "riches"],
        "href": "/bonus",
    }

    return _page(
        request,
        "index.html",
        description=SITE_DESCRIPTION,
        social_description=SOCIAL_DESCRIPTION,
        items=items,
        bonus=bonus,
    )


# --- app/chapters/page.tsx --------------------------------------------------


@app.get("/chapters", response_class=HTMLResponse)
def chapters_index(request: Request) -> HTMLResponse:
    rows = [
        {"seq": i + 1, "pairing": p, "princess": data.get_princess(p.princess_slug)}
        for i, p in enumerate(data.ordered_pairings)
    ]
    return _page(
        request,
        "chapters_index.html",
        title="Chapters",
        description="The thirteen chapters, in reveal order — god by god.",
        rows=rows,
    )


# --- app/chapters/[slug]/page.tsx -------------------------------------------


@app.get("/chapters/{slug}", response_class=HTMLResponse)
def chapter(request: Request, slug: str) -> HTMLResponse:
    pairing = data.get_pairing_by_god(slug)
    if not pairing:
        raise HTTPException(status_code=404)
    princess = data.get_princess(pairing.princess_slug)
    if not princess:
        raise HTTPException(status_code=404)

    # God-centric override note: if the human reassigned this god, name the
    # princess the algorithm had originally paired it with.
    alg = data.get_algorithmic_pairing_by_god(slug) if data.is_override_god(slug) else None
    neighbors = data.chapter_neighbors(slug)
    accent = data.god_accent(slug)
    rank = data.god_rank_of_princess(slug, pairing.princess_slug)

    return _page(
        request,
        "chapter.html",
        # Absolute title (no site suffix): the god, and an X for the hidden princess.
        absolute_title=f"{pairing.god} — X",
        description=(
            f"{pairing.god} in disguise: the human reveal and an AI editorial "
            "reading of the pairing."
        ),
        social_description=f"Which Disney princess is {pairing.god} in disguise?",
        og_image=f"/static/og/{slug}.png",
        og_alt=f"{pairing.god} — which Disney princess is in disguise?",
        god_slug=slug,
        accent=accent,
        pairing=pairing,
        princess=princess,
        label=f"Hymn {_seq(neighbors['index'] + 1)}",
        rank_label=("first choice" if rank == 1 else f"{ordinal(rank)}-closest princess"),
        override=(
            {"algPrincess": alg.princess, "algScore": alg.score} if alg else None
        ),
        prev=neighbors["prev"],
        next=neighbors["next"],
        human_essay=Markup(content.human_essay(pairing.princess_slug)),
        ai_essay=Markup(content.ai_essay(pairing.princess_slug)),
        exact_matches=data.get_exact_matches(pairing.princess, pairing.god),
        facets=pairing.facets,
        hideable=True,
    )


# --- app/matrix/page.tsx ----------------------------------------------------


@app.get("/matrix", response_class=HTMLResponse)
def matrix(request: Request) -> HTMLResponse:
    canonical_keys = [
        f"{p.princess_slug}::{p.god_slug}" for p in data.canonical_pairings
    ]
    # One flat lookup the heatmap template and its hover card both read.
    grid = {f"{c.princess_slug}::{c.god_slug}": c for c in data.cells}
    return _page(
        request,
        "matrix.html",
        title="The Concordance",
        description=(
            "The full 13 × 13 grid of princesses against gods, every cell "
            "scored across five facets. Hover a cell for its breakdown."
        ),
        matrix_princesses=data.ordered_princesses,
        matrix_gods=data.ordered_gods,
        grid=grid,
        canonical_keys=canonical_keys,
        facet_definitions=data.facet_definitions,
        scale_note=data.scale_note,
    )


# --- app/overrides/page.tsx -------------------------------------------------


@app.get("/overrides", response_class=HTMLResponse)
def overrides(request: Request) -> HTMLResponse:
    # God-first view of the four corrections: for each affected god, the princess
    # the algorithm assigned it (struck) vs. the princess it ended up with.
    emendations = []
    for canonical in data.ordered_pairings:
        if not data.is_override_god(canonical.god_slug):
            continue
        alg = data.get_algorithmic_pairing_by_god(canonical.god_slug)
        emendations.append(
            {
                "god": canonical.god,
                "godSlug": canonical.god_slug,
                "fromPrincess": alg.princess if alg else "",
                "fromScore": alg.score if alg else 0.0,
                "toPrincess": canonical.princess,
                "toScore": canonical.score,
            }
        )
    return _page(
        request,
        "overrides.html",
        title="Emendations",
        description=(
            "The four places where a human overruled the machine — with the "
            "reasons why."
        ),
        emendations=emendations,
        essay=Markup(content.overrides_essay()),
    )


# --- app/bonus/page.tsx -----------------------------------------------------


@app.get("/bonus", response_class=HTMLResponse)
def bonus(request: Request) -> HTMLResponse:
    accent = data.god_accent("hades")
    return _page(
        request,
        "bonus.html",
        absolute_title="Hades — X",
        description=(
            "The off-matrix fourteenth pairing: the most famous god who is not an "
            "Olympian against the most famous heroine who is not a princess."
        ),
        social_description="Which Disney heroine is Hades in disguise?",
        og_image="/static/og/hades.png",
        og_alt="Hades — which Disney heroine is in disguise?",
        accent=accent,
        appendix=data.appendix,
        human_essay=Markup(content.human_essay("elsa")),
        ai_essay=Markup(content.ai_essay("elsa")),
        exact_matches=data.appendix.exact_matches,
    )


# --- app/robots.ts / app/sitemap.ts ----------------------------------------


@app.get("/robots.txt", response_class=PlainTextResponse)
def robots() -> PlainTextResponse:
    body = f"User-Agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n"
    return PlainTextResponse(body)


@app.get("/sitemap.xml")
def sitemap() -> Response:
    now = datetime.now(timezone.utc).date().isoformat()
    static_routes = ["", "/matrix", "/overrides", "/bonus", "/chapters"]
    paths = static_routes + [f"/chapters/{slug}" for slug in data.chapter_slugs]
    entries = "".join(
        "<url>"
        f"<loc>{SITE_URL}{path}</loc>"
        f"<lastmod>{now}</lastmod>"
        "<changefreq>monthly</changefreq>"
        f"<priority>{'1' if path == '' else '0.7'}</priority>"
        "</url>"
        for path in paths
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f"{entries}</urlset>"
    )
    return Response(content=xml, media_type="application/xml")


# --- app/not-found.tsx ------------------------------------------------------


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> Response:
    if exc.status_code != 404:
        return PlainTextResponse(str(exc.detail), status_code=exc.status_code)
    return _page(
        request,
        "not_found.html",
        absolute_title=f"No cell here · {SITE_NAME}",
        description="This pairing was never scored.",
        status_code=404,
    )
