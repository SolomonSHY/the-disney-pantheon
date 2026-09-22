"""Port of lib/data.ts — the whole data layer, computed once at import.

Everything here is derived from the five JSON files in `data/`, exactly as the
TypeScript did: scores are recomputed from the facet subscores, pairings are
re-scored off the recomputed cells, and the orderings (reveal order, matrix
order) are the same hand-written permutations.
"""

from __future__ import annotations

import dataclasses
import json
from dataclasses import replace
from pathlib import Path
from typing import Any

from .types import (
    Appendix,
    Cell,
    FacetDefinition,
    FacetScores,
    God,
    Override,
    OverrideScore,
    Pairing,
    PairingSet,
    Princess,
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load(name: str) -> Any:
    with (DATA_DIR / f"{name}.json").open(encoding="utf-8") as fh:
        return json.load(fh)


_matrix = _load("matrix")
_pairings_raw = _load("pairings")
_method = _load("method")
_appendix_raw = _load("appendix")
_profiles = _load("profiles")

FACET_ORDER: list[str] = list(_matrix["facets"])

# Scores are the five facet subscores (0–10 each) added up, out of a possible
# 50 — a perfect ten on all five. A small contra-penalty trims the ~11% of
# cells where the pairing inverts the god's role; for every other cell the
# total is exactly the sum of the visible facet bars.
DISPLAY_CAP = 50
_LAMBDA: float = _matrix["lambdaContra"]


def facet_sum(facets: FacetScores) -> float:
    return sum(facets.get(code, 0.0) for code in FACET_ORDER)


def compute_score(facets: FacetScores, contra: float = 0.0) -> float:
    penalised = facet_sum(facets) * max(0.0, 1 - (_LAMBDA * contra) / 10)
    return round(penalised * 10) / 10


princesses: list[Princess] = [Princess.from_json(p) for p in _matrix["princesses"]]
gods: list[God] = [God.from_json(g) for g in _matrix["gods"]]
cells: list[Cell] = [
    replace(c, score=compute_score(c.facets, c.contra))
    for c in (Cell.from_json(raw) for raw in _matrix["cells"])
]

_new_score_by_cell: dict[str, float] = {
    f"{c.princess_slug}::{c.god_slug}": c.score for c in cells
}

facet_definitions: list[FacetDefinition] = [
    FacetDefinition.from_json(d) for d in _method["facetDefinitions"]
]
limitations: list[str] = list(_method["limitations"])

scale_note = (
    "Each pairing is scored 0–10 on five facets; the total is simply their "
    "sum, out of a possible 50 — a perfect ten on all five. Nothing comes "
    "close: the strongest pairings land in the low forties. A small "
    "contra-penalty trims the handful of cells where a pairing inverts the "
    "god’s role."
)

_facet_def_by_code = {d.code: d for d in facet_definitions}


def facet_name(code: str) -> str:
    d = _facet_def_by_code.get(code)
    return d.name if d else code


def facet_gloss(code: str) -> dict[str, str]:
    d = _facet_def_by_code.get(code)
    return {"god": d.god if d else "", "princess": d.princess if d else ""}


# Top domain tags for a god, pulled straight from the profile vectors. Used as
# spoiler-free hints on the reveal ledger — the god's sphere of power, minus the
# princess's name.
def god_domain_hints(god_name: str, n: int = 3) -> list[str]:
    dom: dict[str, float] = (_profiles.get("gods", {}).get(god_name, {}) or {}).get(
        "DOM", {}
    )
    ranked = sorted(dom.items(), key=lambda kv: kv[1], reverse=True)[:n]
    return [tag.replace("-", " ") for tag, _ in ranked]


# Tags that appear in BOTH the princess's and the god's profile for a facet —
# the exact overlaps that drove the cell, per facet. Same shape the appendix
# uses for the bonus.
def get_exact_matches(princess_name: str, god_name: str) -> dict[str, list[str]]:
    pr = _profiles.get("princesses", {}).get(princess_name, {}) or {}
    gd = _profiles.get("gods", {}).get(god_name, {}) or {}
    out: dict[str, list[str]] = {}
    for code in FACET_ORDER:
        p_tags = set((pr.get(code) or {}).keys())
        out[code] = [t for t in (gd.get(code) or {}).keys() if t in p_tags]
    return out


def _re_score(p: Pairing) -> Pairing:
    """Re-score a pairing from the recomputed cell it points at.

    Ranks are unchanged — the new score is monotonic in the old — so
    is_first_choice / rank_in_row stay valid.
    """
    key = f"{p.princess_slug}::{p.god_slug}"
    return replace(p, score=_new_score_by_cell.get(key, p.score))


def _re_score_set(raw: dict[str, Any]) -> PairingSet:
    ps = PairingSet.from_json(raw)
    return replace(ps, pairs=[_re_score(p) for p in ps.pairs])


# The authorial set is the canonical reading — the editor's thirteen. The
# algorithmic set is kept for the two places we want to show the seam.
authorial: PairingSet = _re_score_set(_pairings_raw["authorial"])
algorithmic: PairingSet = _re_score_set(_pairings_raw["algorithmic"])

canonical_pairings: list[Pairing] = sorted(
    authorial.pairs, key=lambda p: p.score, reverse=True
)

_cell_index = {f"{c.princess_slug}::{c.god_slug}": c for c in cells}


def get_cell(princess_slug: str, god_slug: str) -> Cell | None:
    return _cell_index.get(f"{princess_slug}::{god_slug}")


_pairing_by_princess = {p.princess_slug: p for p in canonical_pairings}


def get_pairing(princess_slug: str) -> Pairing | None:
    return _pairing_by_princess.get(princess_slug)


# The algorithmic (Fable) assignment for a princess — the god the machine chose
# before the human overrode it. Differs from the canonical pick in the four
# override rows.
_alg_by_princess = {p.princess_slug: p for p in algorithmic.pairs}


def get_algorithmic_pairing(princess_slug: str) -> Pairing | None:
    return _alg_by_princess.get(princess_slug)


# The four manual overrides, as documented in the source. `from_` is Fable's
# original assignment; `to` is the human's final call. Scores are read live from
# the recomputed cells so they track the current scale.
_god_slug_by_name = {g.name: g.slug for g in gods}


def _override_score(princess_slug: str, god_name: str) -> float:
    gs = _god_slug_by_name.get(god_name)
    if not gs:
        return 0.0
    return _new_score_by_cell.get(f"{princess_slug}::{gs}", 0.0)


_OVERRIDE_DEFS = [
    ("Moana", "moana", "Demeter", "Poseidon", 2),
    ("Jasmine", "jasmine", "Zeus", "Hera", 1),
    ("Aurora", "aurora", "Hera", "Demeter", 4),
    ("Snow White", "snow-white", "Poseidon", "Zeus", 9),
]

overrides: list[Override] = [
    Override(
        princess=name,
        princess_slug=slug,
        from_=OverrideScore(god=from_god, score=_override_score(slug, from_god)),
        to=OverrideScore(god=to_god, score=_override_score(slug, to_god)),
        rank_in_row=rank,
    )
    for name, slug, from_god, to_god, rank in _OVERRIDE_DEFS
]

_override_slugs = {o.princess_slug for o in overrides}


def is_override(princess_slug: str) -> bool:
    return princess_slug in _override_slugs


def get_override(princess_slug: str) -> Override | None:
    return next((o for o in overrides if o.princess_slug == princess_slug), None)


# The bonus, off-matrix pairing: Elsa x Hades. appendix.json is effectively the
# model's own read of a cell that was never in the scored set.
appendix: Appendix = replace(
    Appendix.from_json(_appendix_raw),
    score=compute_score(_appendix_raw["facets"], 0.0),
)

_princess_by_slug = {p.slug: p for p in princesses}


def get_princess(slug: str) -> Princess | None:
    return _princess_by_slug.get(slug)


# Where a princess ranks among all thirteen for a given god (1 = the god's
# highest-scoring princess). The god's-eye view of a pairing.
def god_rank_of_princess(god_slug: str, princess_slug: str) -> int:
    column = sorted(
        (c for c in cells if c.god_slug == god_slug),
        key=lambda c: c.score,
        reverse=True,
    )
    for i, c in enumerate(column):
        if c.princess_slug == princess_slug:
            return i + 1
    return 0


# The princesses who scored NEXT-highest in a god's column — the plausible
# near-misses that make the landing guess a real challenge, rather than three
# random names you can dismiss on sight.
def get_near_miss_princesses(
    god_slug: str, except_princess_slug: str, n: int = 3
) -> list[str]:
    column = sorted(
        (
            c
            for c in cells
            if c.god_slug == god_slug and c.princess_slug != except_princess_slug
        ),
        key=lambda c: c.score,
        reverse=True,
    )[:n]
    out = []
    for c in column:
        pr = _princess_by_slug.get(c.princess_slug)
        out.append(pr.name if pr else c.princess_slug)
    return out


# A whisper-quiet accent hue per god, grouped by domain (sovereignty, hearth/
# craft, earth/sea/wild, war, arts/love, liminal). Deliberately muted mid-tones
# so they only tint a background wash and the god's own mark — never compete
# with the one-gold palette. Hades (bonus) gets an underworld violet.
GOD_ACCENTS: dict[str, str] = {
    "zeus": "#c9a24a",  # sky-gold
    "hera": "#4f8a86",  # peacock teal
    "hestia": "#c07b43",  # hearth amber
    "hephaestus": "#b3702f",  # forge ember
    "demeter": "#8a9150",  # grain olive
    "poseidon": "#3f7d94",  # sea
    "artemis": "#6f8f7d",  # moonlit sage
    "ares": "#9a4b4b",  # blood wine
    "athena": "#7f8659",  # owl / bronze-olive
    "apollo": "#c9993c",  # sun
    "aphrodite": "#b06a78",  # rose
    "hermes": "#7f8a9a",  # quicksilver
    "dionysus": "#7a5a9a",  # vine violet
    "hades": "#6f5f95",  # underworld
}


def god_accent(slug: str) -> str:
    return GOD_ACCENTS.get(slug, "#c8a25a")


# Presentation order for the god-first ledger, chapters and numbering. Now that
# players guess the whole board at once, a "gentle first" ordering no longer
# matters — so this follows the natural/canonical Olympian order instead.
reveal_order: list[str] = [
    "zeus",
    "hera",
    "poseidon",
    "demeter",
    "athena",
    "apollo",
    "artemis",
    "ares",
    "aphrodite",
    "hephaestus",
    "hermes",
    "hestia",
    "dionysus",
]

_pairing_by_god = {p.god_slug: p for p in authorial.pairs}

ordered_pairings: list[Pairing] = [
    p for p in (_pairing_by_god.get(g) for g in reveal_order) if p is not None
]


# Chapters are addressed by GOD slug — the god leads. This maps a god slug to
# its canonical pairing (and thence the princess and Markdown content).
def get_pairing_by_god(god_slug: str) -> Pairing | None:
    return _pairing_by_god.get(god_slug)


# The algorithmic (Fable) assignment keyed by god — the princess the Hungarian
# optimum gave this god before any human override.
_alg_by_god = {p.god_slug: p for p in algorithmic.pairs}


def get_algorithmic_pairing_by_god(god_slug: str) -> Pairing | None:
    return _alg_by_god.get(god_slug)


# A god is an override target when the human reassigned it — i.e. the algorithm
# gave it a different princess than the canonical mapping does.
def is_override_god(god_slug: str) -> bool:
    alg = _alg_by_god.get(god_slug)
    canon = _pairing_by_god.get(god_slug)
    return bool(alg and canon and alg.princess_slug != canon.princess_slug)


# Matrix axis order — DISTINCT from the reveal order. Gods are grouped by domain
# so kindred deities sit together (sovereignty → hearth/craft → earth/sea/wild →
# war → arts/love → liminal). Because both axes share this one permutation, the
# canonical pairings still fall on the diagonal; and since a princess's
# near-miss god is usually a kindred one, the hot off-diagonal cells now cluster
# right beside the diagonal — a block-diagonal, "clustery" heatmap.
matrix_order: list[str] = [
    "zeus",  # sovereignty
    "hera",
    "hestia",  # hearth / craft (Hestia beside Hephaestus)
    "hephaestus",
    "demeter",  # earth / sea / wild
    "poseidon",
    "artemis",
    "ares",  # war
    "athena",
    "apollo",  # arts / love
    "aphrodite",
    "hermes",  # liminal (Hermes beside Dionysus)
    "dionysus",
]

_god_by_slug = {g.slug: g for g in gods}

ordered_gods: list[God] = [
    g for g in (_god_by_slug.get(s) for s in matrix_order) if g is not None
]

# Rows follow the same order via each god's canonical princess, keeping the
# canonical cells on the diagonal.
ordered_princesses: list[Princess] = [
    pr
    for pr in (
        _princess_by_slug.get(p.princess_slug)
        for p in (_pairing_by_god.get(s) for s in matrix_order)
        if p is not None
    )
    if pr is not None
]

# Chapter order and prev/next follow the reveal order above, keyed by god slug.
chapter_slugs: list[str] = [p.god_slug for p in ordered_pairings]


def chapter_neighbors(god_slug: str) -> dict[str, Any]:
    try:
        i = chapter_slugs.index(god_slug)
    except ValueError:
        return {"index": -1, "prev": None, "next": None}
    return {
        "index": i,
        "prev": ordered_pairings[i - 1] if i > 0 else None,
        "next": ordered_pairings[i + 1] if i < len(ordered_pairings) - 1 else None,
    }


# --- Scales -----------------------------------------------------------------
# A single warm ramp: cold ash at zero, gold at the cap. Used by both the
# heatmap cells and the facet bars so the whole site reads on one temperature.

_ASH = (26, 24, 30)  # near the ground colour
_EMBER = (122, 60, 54)  # wine/ember midpoint
_GOLD = (200, 162, 90)  # brand gold


def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def _mix(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> str:
    r = round(_lerp(c1[0], c2[0], t))
    g = round(_lerp(c1[1], c2[1], t))
    b = round(_lerp(c1[2], c2[2], t))
    return f"rgb({r} {g} {b})"


def score_color(score: float) -> str:
    """score 0..DISPLAY_CAP -> colour.

    Two-stop ramp through ember so mid scores read as heat rather than mud.
    """
    t = max(0.0, min(1.0, score / DISPLAY_CAP))
    eased = t**0.85  # matches the matrix compression exponent
    if eased < 0.5:
        return _mix(_ASH, _EMBER, eased / 0.5)
    return _mix(_EMBER, _GOLD, (eased - 0.5) / 0.5)


def score_ink(score: float) -> str:
    """A readable ink colour to sit on top of a given score cell."""
    return "#1a1206" if score / DISPLAY_CAP > 0.62 else "#e9e3d6"


def facet_color(value: float) -> str:
    """facet 0..10 -> colour on the same ramp.

    Facets top out well below the cap, so we stretch them across the full ramp
    for legibility.
    """
    t = max(0.0, min(1.0, value / 10))
    if t < 0.5:
        return _mix(_ASH, _EMBER, t / 0.5)
    return _mix(_EMBER, _GOLD, (t - 0.5) / 0.5)


# --- Serialisation for the client ------------------------------------------
# The reveal ledger and the heatmap are interactive, so the rows they need get
# handed to the browser as JSON (the React version closed over the same props).


def as_dict(obj: Any) -> Any:
    if dataclasses.is_dataclass(obj) and not isinstance(obj, type):
        return {k: as_dict(v) for k, v in dataclasses.asdict(obj).items()}
    if isinstance(obj, list):
        return [as_dict(v) for v in obj]
    if isinstance(obj, dict):
        return {k: as_dict(v) for k, v in obj.items()}
    return obj
