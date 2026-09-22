"""Port of lib/types.ts — the shapes the JSON data comes in.

Dataclasses rather than TypedDicts so templates can use attribute access
(`cell.score`) the way the TSX did, and so `from_json` can carry the
camelCase → snake_case rename in one place.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

FacetCode = Literal["DOM", "ROL", "ARC", "ICO", "TMP"]

# Facet code -> subscore, 0–10.
FacetScores = dict[str, float]


@dataclass(frozen=True)
class Princess:
    name: str
    slug: str
    film: str
    year: int
    info: float

    @staticmethod
    def from_json(d: dict[str, Any]) -> "Princess":
        return Princess(
            name=d["name"],
            slug=d["slug"],
            film=d["film"],
            year=d["year"],
            info=d.get("info", 0.0),
        )


@dataclass(frozen=True)
class God:
    name: str
    slug: str

    @staticmethod
    def from_json(d: dict[str, Any]) -> "God":
        return God(name=d["name"], slug=d["slug"])


@dataclass(frozen=True)
class Cell:
    princess: str
    princess_slug: str
    god: str
    god_slug: str
    score: float
    rank_in_row: int
    rank_in_column: int
    facets: FacetScores
    contra: float
    contra_note: str | None
    base: float

    @staticmethod
    def from_json(d: dict[str, Any]) -> "Cell":
        return Cell(
            princess=d["princess"],
            princess_slug=d["princessSlug"],
            god=d["god"],
            god_slug=d["godSlug"],
            score=d["score"],
            rank_in_row=d["rankInRow"],
            rank_in_column=d["rankInColumn"],
            facets=dict(d["facets"]),
            contra=d.get("contra", 0.0),
            contra_note=d.get("contraNote"),
            base=d.get("base", 0.0),
        )


@dataclass(frozen=True)
class Pairing:
    princess: str
    princess_slug: str
    god: str
    god_slug: str
    score: float
    rank_in_row: int
    facets: FacetScores
    is_first_choice: bool

    @staticmethod
    def from_json(d: dict[str, Any]) -> "Pairing":
        return Pairing(
            princess=d["princess"],
            princess_slug=d["princessSlug"],
            god=d["god"],
            god_slug=d["godSlug"],
            score=d["score"],
            rank_in_row=d["rankInRow"],
            facets=dict(d["facets"]),
            is_first_choice=d.get("isFirstChoice", False),
        )


@dataclass(frozen=True)
class PairingSet:
    total: float
    floor: float
    first_choices: int
    pairs: list[Pairing]
    overrides: list[str] = field(default_factory=list)
    note: str | None = None

    @staticmethod
    def from_json(d: dict[str, Any]) -> "PairingSet":
        return PairingSet(
            total=d["total"],
            floor=d["floor"],
            first_choices=d["firstChoices"],
            pairs=[Pairing.from_json(p) for p in d["pairs"]],
            overrides=list(d.get("overrides") or []),
            note=d.get("note"),
        )


@dataclass(frozen=True)
class FacetDefinition:
    code: str
    name: str
    god: str
    princess: str

    @staticmethod
    def from_json(d: dict[str, Any]) -> "FacetDefinition":
        return FacetDefinition(
            code=d["code"], name=d["name"], god=d["god"], princess=d["princess"]
        )


@dataclass(frozen=True)
class OverrideScore:
    god: str
    score: float


@dataclass(frozen=True)
class Override:
    """One of the four places a human overruled the machine."""

    princess: str
    princess_slug: str
    from_: OverrideScore
    to: OverrideScore
    rank_in_row: int


@dataclass(frozen=True)
class Appendix:
    """The bonus, off-matrix pairing: Elsa x Hades."""

    pairing: str
    facets: FacetScores
    base: float
    score: float
    note: str
    exact_matches: dict[str, list[str]]
    alternatives: list[dict[str, Any]]
    caveat: str

    @staticmethod
    def from_json(d: dict[str, Any]) -> "Appendix":
        return Appendix(
            pairing=d["pairing"],
            facets=dict(d["facets"]),
            base=d["base"],
            score=d["score"],
            note=d["note"],
            exact_matches={k: list(v) for k, v in d["exactMatches"].items()},
            alternatives=list(d["alternatives"]),
            caveat=d["caveat"],
        )
