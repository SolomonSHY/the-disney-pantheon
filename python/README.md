# The Disney Princess Pantheon — Python port

An editorial mapping of thirteen Disney princesses onto the Olympian pantheon.
This is a port of the Next.js 15 app in the repo root to Python: FastAPI +
Jinja2 on the server, vanilla JS in place of the React client components.

## Run it

```bash
uv sync
uv run uvicorn app.main:app --reload     # or: uv run python run.py
```

Then open http://127.0.0.1:8000.

```bash
uv run pytest                            # 17 tests over the data layer and every route
```

`SITE_URL` sets the absolute base used in `<link rel=canonical>`, the OG tags,
`robots.txt` and `sitemap.xml` (default `https://disney-pantheon.com`), the same
job `NEXT_PUBLIC_SITE_URL` did.

## How the original maps onto this

| Next.js                          | here                                  |
| -------------------------------- | ------------------------------------- |
| `app/**/page.tsx`                | routes in `app/main.py`               |
| `app/layout.tsx`                 | `app/templates/layout.html`           |
| `lib/data.ts`, `lib/types.ts`    | `app/data.py`, `app/types.py`         |
| `components/*.tsx` (server)      | Jinja macros in `_macros.html`, `_chapter_view.html` |
| `components/*.tsx` (client)      | `app/static/js/*.js`                  |
| `lib/revealStore.ts`, `artPref.ts` | `app/static/js/store.js`            |
| `components/GodIcon`, `PrincessIcon`, `TempleCrest` | `app/icons.py` |
| `@next/mdx` + remark-gfm         | `app/content.py` (markdown-it-py)     |
| `app/robots.ts`, `app/sitemap.ts` | `/robots.txt`, `/sitemap.xml` routes |
| `app/not-found.tsx`              | the 404 exception handler             |
| `tailwind.config.ts`             | `app/static/js/tailwind.config.js`    |
| `app/globals.css`                | `app/static/css/globals.css`          |

`data/` and `content/` are copied verbatim from the original — the same five JSON
files and the same essays. The scores, rankings, orderings, colour ramps and the
four manual overrides are all recomputed by `app/data.py` exactly as `lib/data.ts`
computed them.

## Things worth knowing

**The essays are plain Markdown.** None of the `.mdx` files used JSX, so they are
rendered with markdown-it-py plus the footnote plugin. The footnote render rules
are overridden to emit the `data-footnote-ref` / `data-footnote-backref` hooks
remark-gfm produced, so `globals.css` styles them unchanged. The files keep their
`.mdx` extension so they stay diffable against the original.

**Interactive state lives in the browser, as before.** `store.js` is a direct port
of `revealStore.ts` and `artPref.ts` — the same `pantheon:revealed`,
`pantheon:guesses`, `pantheon:pending` keys in `sessionStorage`, and the same
one-way `pantheon:revealArt` opt-in in `localStorage`. React re-rendered from
`useSyncExternalStore`; here a `render()` function subscribes to the store and
switches between states already in the DOM.

Because of that, one structural difference: React simply didn't render the masked
half of a row, whereas the templates render every state and toggle the `hidden`
attribute. Both halves are therefore in the HTML source. The Next.js version also
shipped the answers to the client (they were props of a client component,
serialised into the RSC payload), so this is the same spoiler surface, not a
wider one. `globals.css` starts with `[hidden] { display: none !important }` —
without it a Tailwind display utility on a hidden element outranks the UA
stylesheet and leaks the answer.

The AI pairing portraits are still opt-in and still can't spoil: the file path is
parked in `data-src` and only promoted to `src` once a reader both unmasks the
pairing and opts in, so the image isn't even requested before then.

**Tailwind runs in the browser.** `layout.html` loads the Tailwind CDN runtime and
`tailwind.config.js` re-declares the theme from `tailwind.config.ts`, which lets
every utility class carry over from the TSX verbatim. The runtime prints a
"don't use this in production" warning; for a real deploy, run the Tailwind CLI
over `app/templates/` and `app/static/js/` and serve the built stylesheet instead.

`globals.css` is hand-expanded plain CSS rather than a Tailwind source file,
because the browser runtime only compiles inline `<style type="text/tailwindcss">`
blocks — `@apply` and `theme()` in a linked file would not be processed. The
expansions come straight from `tailwind.config.ts`. Note that `--font-serif` must
be declared on `:root`: `--font-serif-stack` substitutes it at that level, and a
definition further down the tree resolves as invalid and takes the whole font
stack with it.

**Not ported.** `@vercel/analytics` (host-specific) and `next/font` self-hosting —
Newsreader comes from Google Fonts with the same fallback stack. The original's
`generateStaticParams` / `dynamicParams = false` become a 404 for any god slug
outside the thirteen, which is the same behaviour.
