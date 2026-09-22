"""Checks that the port renders every route and agrees with the original's data.

The expected numbers here are read off the Next.js version: 13 pairings, a
13 x 13 grid of 169 scored cells, four emendations, and the off-matrix
fourteenth.
"""

from fastapi.testclient import TestClient

from app import content, data
from app.main import app

client = TestClient(app)


def test_shape_of_the_scored_set():
    assert len(data.princesses) == 13
    assert len(data.gods) == 13
    assert len(data.cells) == 169
    assert data.FACET_ORDER == ["DOM", "ROL", "ARC", "ICO", "TMP"]
    assert data.DISPLAY_CAP == 50


def test_scores_are_the_facet_sum_where_there_is_no_contra_penalty():
    for c in data.cells:
        if c.contra == 0:
            assert c.score == round(data.facet_sum(c.facets) * 10) / 10


def test_canonical_pairings_are_a_one_to_one_matching():
    assert len(data.ordered_pairings) == 13
    assert len({p.god_slug for p in data.ordered_pairings}) == 13
    assert len({p.princess_slug for p in data.ordered_pairings}) == 13


def test_the_four_emendations():
    override_gods = [
        p.god_slug for p in data.ordered_pairings if data.is_override_god(p.god_slug)
    ]
    assert sorted(override_gods) == ["demeter", "hera", "poseidon", "zeus"]
    assert sorted(o.princess_slug for o in data.overrides) == [
        "aurora",
        "jasmine",
        "moana",
        "snow-white",
    ]


def test_bonus_pairing_is_off_the_matrix():
    # Elsa x Hades: the strongest reading in the book, and never in the scored set.
    assert data.appendix.score == 41.5
    assert all(c.score < data.appendix.score for c in data.cells)
    assert "elsa" not in {p.slug for p in data.princesses}


def test_chapter_order_and_neighbours():
    assert data.chapter_slugs[0] == "zeus"
    assert data.chapter_slugs[-1] == "dionysus"
    first = data.chapter_neighbors("zeus")
    assert first["prev"] is None and first["next"].god_slug == "hera"
    last = data.chapter_neighbors("dionysus")
    assert last["next"] is None


def test_landing_page_hides_every_princess_name():
    r = client.get("/")
    assert r.status_code == 200
    body = r.text
    # Names are in the DOM (the reveal is client-side, as in the original) but
    # every row must ship masked: no revealed-name block is visible.
    assert body.count("data-revealed-name hidden") == 14  # thirteen + the bonus
    assert "Guess the thirteen" in body
    assert 'data-state="hints"' in body


def test_every_chapter_renders_with_both_essays():
    for slug in data.chapter_slugs:
        r = client.get(f"/chapters/{slug}")
        assert r.status_code == 200, slug
        pairing = data.get_pairing_by_god(slug)
        assert f"{pairing.god} — X" in r.text
        assert 'data-panel="human"' in r.text
        assert 'data-panel="ai"' in r.text
        # The AI portrait must not be fetchable before the reveal: the path is
        # parked in data-src and only promoted to src once the opt-in is given.
        assert f'data-src="/static/pairings/{slug}.jpg"' in r.text
        assert f' src="/static/pairings/{slug}.jpg"' not in r.text


def test_chapters_index_lists_all_thirteen():
    r = client.get("/chapters")
    assert r.status_code == 200
    for p in data.ordered_pairings:
        assert f"/chapters/{p.god_slug}" in r.text


def test_matrix_renders_the_full_grid_masked():
    r = client.get("/matrix")
    assert r.status_code == 200
    assert r.text.count("data-cell") == 169
    # The canonical thirteen are ringed.
    assert r.text.count('data-pick="1"') == 13
    # Column heads ship masked.
    assert "Unmask princesses" in r.text


def test_overrides_page():
    r = client.get("/overrides")
    assert r.status_code == 200
    for name in ("Poseidon", "Hera", "Demeter", "Zeus"):
        assert name in r.text
    assert "It can&#39;t factor in how good a god is at disguises" in r.text or (
        "It can’t factor in how good a god is at disguises" in r.text
    )


def test_bonus_page():
    r = client.get("/bonus")
    assert r.status_code == 200
    assert "Hades — X" in r.text
    assert "The fourteenth" in r.text


def test_footnotes_get_the_hooks_globals_css_styles():
    html = content.human_essay("belle")
    assert "data-footnote-ref" in html
    assert 'class="footnotes"' in html
    assert "data-footnote-backref" in html
    # No separator rule — it would pick up the section-break fleuron styling.
    assert "footnotes-sep" not in html


def test_essay_markdown_features_survive():
    html = content.human_essay("belle")
    assert "<em>" in html and "<hr" in html
    assert "<strong>" in html
    overrides = content.overrides_essay()
    assert "<h2>" in overrides


def test_unknown_chapter_is_the_not_found_page():
    r = client.get("/chapters/hades")  # the bonus lives at /bonus, not a chapter
    assert r.status_code == 404
    assert "No cell here" in r.text
    r = client.get("/nope")
    assert r.status_code == 404
    assert "Off the matrix" in r.text


def test_robots_and_sitemap():
    r = client.get("/robots.txt")
    assert r.status_code == 200
    assert "Sitemap:" in r.text
    r = client.get("/sitemap.xml")
    assert r.status_code == 200
    assert r.text.count("<url>") == 5 + 13


def test_static_assets_are_served():
    for path in ("/static/css/globals.css", "/static/js/store.js", "/static/og/zeus.png"):
        assert client.get(path).status_code == 200, path
