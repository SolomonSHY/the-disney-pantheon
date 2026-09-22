"""Port of components/GodIcon.tsx, PrincessIcon.tsx and TempleCrest.tsx.

The JSX children become raw SVG-fragment strings; `god_icon()` / `princess_icon()`
wrap them in the same <svg> shell the React components did. Markup is identical
path-for-path.
"""

from __future__ import annotations

from markupsafe import Markup

# Stylized line-art attributes of each god, on a 24x24 grid. Deliberately
# minimal — they read as identifying marks beside the god's name, not as detailed
# illustration. All stroke-based for one consistent engraved look.
GOD_ICONS: dict[str, str] = {
    # Zeus — thunderbolt
    "zeus": '<path d="M13 2 L6 13 H10 L8 22 L18 9 H12 Z" />',
    # Hera — diadem
    "hera": (
        '<path d="M4 18 H20 L18.5 9 L14.5 13 L12 6 L9.5 13 L5.5 9 Z" />'
        '<circle cx="5.5" cy="9" r="0.9" />'
        '<circle cx="12" cy="6" r="0.9" />'
        '<circle cx="18.5" cy="9" r="0.9" />'
    ),
    # Poseidon — trident
    "poseidon": (
        '<path d="M12 22 V7" />'
        '<path d="M7.5 8 H16.5" />'
        '<path d="M8 8 V4 M12 8 V3 M16 8 V4" />'
        '<path d="M6.7 5.4 L8 4 L9.3 5.4 M10.7 4.4 L12 3 L13.3 4.4 '
        'M14.7 5.4 L16 4 L17.3 5.4" />'
    ),
    # Demeter — wheat
    "demeter": (
        '<path d="M12 22 V8" />'
        '<path d="M12 8.5 C9.6 8 8.4 6.2 8.4 4 C10.7 4 12 6 12 8.2" />'
        '<path d="M12 8.5 C14.4 8 15.6 6.2 15.6 4 C13.3 4 12 6 12 8.2" />'
        '<path d="M12 13 C10 12.5 9 11 9 9 C11 9 12 10.6 12 12.6" />'
        '<path d="M12 13 C14 12.5 15 11 15 9 C13 9 12 10.6 12 12.6" />'
    ),
    # Athena — owl
    "athena": (
        '<circle cx="12" cy="12.5" r="7.5" />'
        '<circle cx="9" cy="11" r="2" />'
        '<circle cx="15" cy="11" r="2" />'
        '<path d="M12 13.5 L11 15.5 H13 Z" />'
        '<path d="M6.2 6.5 L8.6 8.9 M17.8 6.5 L15.4 8.9" />'
    ),
    # Apollo — sun
    "apollo": (
        '<circle cx="12" cy="12" r="4" />'
        '<path d="M12 3 V5.4 M12 18.6 V21 M3 12 H5.4 M18.6 12 H21 '
        'M5.5 5.5 L7.2 7.2 M16.8 16.8 L18.5 18.5 M18.5 5.5 L16.8 7.2 '
        'M7.2 16.8 L5.5 18.5" />'
    ),
    # Artemis — crescent moon
    "artemis": '<path d="M16 3.5 A8.6 8.6 0 1 0 16 20.5 A6.6 6.6 0 0 1 16 3.5 Z" />',
    # Ares — crested helmet
    "ares": (
        '<path d="M7 20 V13 a5 5 0 0 1 10 0 V20 H14 V16 L12.5 17.5 H11.5 '
        'L10 16 V20 Z" />'
        '<path d="M8.5 8 Q12 3 15.5 8" />'
    ),
    # Aphrodite — hand mirror (Venus)
    "aphrodite": (
        '<circle cx="12" cy="9" r="5" />' '<path d="M12 14 V21 M9 18 H15" />'
    ),
    # Hephaestus — blacksmith's hammer
    "hephaestus": ('<path d="M5 5 H15 V9 H5 Z" />' '<path d="M10 9 V20" />'),
    # Hermes — caduceus
    "hermes": (
        '<path d="M12 22 V6" />'
        '<circle cx="12" cy="4.3" r="1.2" />'
        '<path d="M12 6.5 Q8 4.5 6 6.5 Q9 7.2 12 8.5 M12 6.5 Q16 4.5 18 6.5 '
        'Q15 7.2 12 8.5" />'
        '<path d="M9 9.5 Q12 12 15 9.5 M9 13 Q12 15.5 15 13" />'
    ),
    # Hestia — hearth flame
    "hestia": (
        '<path d="M12 3 C14.5 6.5 16 8.5 16 11.5 a4 4 0 0 1 -8 0 c0-2 .8-3.4 '
        '2-4.5 0 2 .8 3 2 3.2 C11.5 9.5 11 6.5 12 3 Z" />'
    ),
    # Dionysus — grapes
    "dionysus": (
        '<path d="M12 10 V7 M12 7 C14 5 16.5 5.8 16.5 5.8 C16.5 8 14 8.8 12 7 Z" />'
        '<circle cx="10" cy="12" r="1.7" />'
        '<circle cx="14" cy="12" r="1.7" />'
        '<circle cx="12" cy="15" r="1.7" />'
        '<circle cx="8.6" cy="15" r="1.7" />'
        '<circle cx="15.4" cy="15" r="1.7" />'
        '<circle cx="10.4" cy="18" r="1.7" />'
        '<circle cx="13.6" cy="18" r="1.7" />'
    ),
    # Hades — bident
    "hades": (
        '<path d="M12 22 V8" />'
        '<path d="M8 8 H16" />'
        '<path d="M8 8 V4 M16 8 V4" />'
        '<path d="M6.7 5.4 L8 4 L9.3 5.4 M14.7 5.4 L16 4 L17.3 5.4" />'
    ),
}

# A stylized emblem per princess, matched to the god icons' engraved line style.
# Minimal marks meant to sit beside a name, not detailed illustration.
PRINCESS_ICONS: dict[str, str] = {
    # Snow White — apple
    "snow-white": (
        '<path d="M12 8.6c-1.6-1.8-6-1.3-6 3 0 4 2.8 8.4 6 8.4s6-4.4 6-8.4c0-4.3'
        '-4.4-4.8-6-3z" />'
        '<path d="M12 8.6V5" />'
        '<path d="M12 6.6c1-2 3.4-2 3.4-2s.2 2.6-3.4 2z" />'
    ),
    # Cinderella — broom
    "cinderella": (
        '<path d="M12 2 V12" />'
        '<path d="M8 12 L6.5 21 L17.5 21 L16 12 Z" />'
        '<path d="M8.5 12 H15.5" />'
        '<path d="M10 13 L9 21 M12 13 L12 21 M14 13 L15 21" />'
    ),
    # Aurora — rose
    "aurora": (
        '<path d="M12 4a3.4 3.4 0 1 0 3 5 A2.3 2.3 0 1 0 12 6.4 a1.2 1.2 0 1 0 '
        '1 1.8" />'
        '<path d="M12 11v8" />'
        '<path d="M12 14c1.8-1 3.8-.2 3.8-.2s-.9 2.3-3.8 1" />'
    ),
    # Ariel — scallop shell (fan of ribs from a hinge, scalloped top)
    "ariel": (
        '<path d="M12 19 C7 17 4.6 12 6 8.5" />'
        '<path d="M12 19 C17 17 19.4 12 18 8.5" />'
        '<path d="M6 8.5 Q7.5 6.8 9 8 Q10.5 6.4 12 7.6 Q13.5 6.4 15 8 '
        'Q16.5 6.8 18 8.5" />'
        '<path d="M12 19 L12 7.6 M12 19 L9 8 M12 19 L15 8" />'
    ),
    # Belle — open book
    "belle": (
        '<path d="M12 6.6 C9.5 5.2 5.6 5.2 3.6 6.2 V17.6 C5.6 16.6 9.5 16.6 12 18 '
        'C14.5 16.6 18.4 16.6 20.4 17.6 V6.2 C18.4 5.2 14.5 5.2 12 6.6 Z" />'
        '<path d="M12 6.6 V18" />'
    ),
    # Jasmine — magic lamp
    "jasmine": (
        '<path d="M4.5 15.5 C4.5 12.6 8 11.6 12 11.6 C15.5 11.6 18.5 12.4 18.5 15 '
        'L4.5 15.5 Z" />'
        '<path d="M18 13 L21.5 11" />'
        '<path d="M10.5 11.7 V9.9 A1.3 1.3 0 0 1 13 9.9" />'
        '<path d="M21.5 11 Q21.6 9.7 22.2 9.1" />'
    ),
    # Pocahontas — feather
    "pocahontas": (
        '<path d="M6.5 18.5 C10 12 14.5 7.5 18.5 5.5 C18.5 10 14.5 15.5 8.5 17.5" />'
        '<path d="M6.5 18.5 L18 6" />'
        '<path d="M9.6 14.4 L12.5 15 M12.6 11 L15.2 11.6 M8 16.6 L10.3 17" />'
    ),
    # Mulan — sword (broad blade, crossguard, pommel)
    "mulan": (
        '<path d="M12 3 L13 7 V13.5 H11 V7 Z" />'
        '<path d="M8.3 14 H15.7" />'
        '<path d="M12 14 V18" />'
        '<path d="M10.6 18.4 H13.4" />'
    ),
    # Tiana — lily pad (leaf with the slit on the narrow side, pac-man style)
    "tiana": '<path d="M12 12 L18.95 9.75 A7.5 6 0 1 0 18.95 14.25 Z" />',
    # Rapunzel — long braid
    "rapunzel": (
        '<path d="M9.5 4 Q12 3.2 14.5 4" />'
        '<path d="M9.5 4 Q13 6 9.5 8 Q13 10 9.5 12 Q12.5 14 10.5 16" />'
        '<path d="M14.5 4 Q11 6 14.5 8 Q11 10 14.5 12 Q11.5 14 13.5 16" />'
        '<path d="M10.5 16 Q12 18.5 12 21 Q12 18.5 13.5 16" />'
    ),
    # Merida — bow and arrow
    "merida": (
        '<path d="M7 4 C15 9 15 15 7 20" />'
        '<path d="M7 4 V20" />'
        '<path d="M5.5 12 H20" />'
        '<path d="M17 9 L20 12 L17 15" />'
    ),
    # Moana — a sail on a mast over the canoe hull
    "moana": (
        '<path d="M8 3 V18" />'
        '<path d="M8 5 C13 6.2 16.2 9.5 17 14 L8 14 Z" />'
        '<path d="M4 18 Q12 21.2 20 18" />'
    ),
    # Raya — the Salakot (wide-brimmed conical hat with finial)
    "raya": (
        '<ellipse cx="12" cy="16.4" rx="9.6" ry="1.8" />'
        '<path d="M6 16 Q6.6 9.2 12 6 Q17.4 9.2 18 16" />'
        '<path d="M12 6 V4.4" />'
        '<circle cx="12" cy="3.8" r="0.8" />'
    ),
    # Elsa — snowflake (the off-matrix bonus)
    "elsa": (
        '<path d="M12 2 V22 M3.34 7 L20.66 17 M3.34 17 L20.66 7" />'
        '<path d="M12 5.5 L10 7.3 M12 5.5 L14 7.3 M12 18.5 L10 16.7 '
        'M12 18.5 L14 16.7" />'
        '<path d="M6 8.6 L6.4 11.1 M6 8.6 L8.4 8.5 M18 15.4 L17.6 12.9 '
        'M18 15.4 L15.6 15.5" />'
        '<path d="M6 15.4 L8.4 15.5 M6 15.4 L6.4 12.9 M18 8.6 L15.6 8.5 '
        'M18 8.6 L17.6 11.1" />'
    ),
}


def _svg(
    glyph: str,
    *,
    class_: str,
    size: int | None,
    stroke_width: float,
    style: str,
) -> Markup:
    dims = f' width="{size}" height="{size}"' if size is not None else ""
    style_attr = f' style="{style}"' if style else ""
    return Markup(
        f'<svg viewBox="0 0 24 24"{dims} fill="none" stroke="currentColor" '
        f'stroke-width="{stroke_width}" stroke-linecap="round" '
        f'stroke-linejoin="round" class="{class_}"{style_attr} aria-hidden="true">'
        f"{glyph}</svg>"
    )


def god_icon(
    slug: str,
    class_: str = "",
    size: int | None = 24,
    stroke_width: float = 1.4,
    style: str = "",
) -> Markup:
    glyph = GOD_ICONS.get(slug)
    if not glyph:
        return Markup("")
    return _svg(
        glyph, class_=class_, size=size, stroke_width=stroke_width, style=style
    )


def princess_icon(
    slug: str, class_: str = "", size: int | None = 24, style: str = ""
) -> Markup:
    glyph = PRINCESS_ICONS.get(slug)
    if not glyph:
        return Markup("")
    return _svg(glyph, class_=class_, size=size, stroke_width=1.4, style=style)


# A Greek temple facade — pediment, fluted colonnade, stylobate — drawn in the
# same engraved line style as the god/princess icons. Used as a frontispiece
# crest on the landing masthead. Purely decorative.
_TEMPLE_CREST = (
    # pediment
    '<path d="M18 52 L119 12 L220 52" />'
    '<path d="M34 49 L119 20 L204 49" />'
    # akroteria
    '<path d="M119 12 V7 M18 52 V49 M220 52 V49" />'
    # entablature
    '<path d="M16 52 H222" />'
    '<path d="M20 57 H218" />'
    '<path d="M23 62 H215" />'
    # six fluted columns
    '<path d="M29 62 H39 M31.5 63 V101 M36.5 63 V101 M29 102 H39" />'
    '<path d="M63 62 H73 M65.5 63 V101 M70.5 63 V101 M63 102 H73" />'
    '<path d="M97 62 H107 M99.5 63 V101 M104.5 63 V101 M97 102 H107" />'
    '<path d="M131 62 H141 M133.5 63 V101 M138.5 63 V101 M131 102 H141" />'
    '<path d="M165 62 H175 M167.5 63 V101 M172.5 63 V101 M165 102 H175" />'
    '<path d="M199 62 H209 M201.5 63 V101 M206.5 63 V101 M199 102 H209" />'
    # stylobate
    '<path d="M23 103 H215" />'
    '<path d="M18 109 H220" />'
    '<path d="M13 116 H225" />'
)


def temple_crest(class_: str = "") -> Markup:
    return Markup(
        f'<svg viewBox="0 0 240 132" fill="none" stroke="currentColor" '
        f'stroke-width="1" stroke-linecap="round" stroke-linejoin="round" '
        f'class="{class_}" aria-hidden="true">{_TEMPLE_CREST}</svg>'
    )
