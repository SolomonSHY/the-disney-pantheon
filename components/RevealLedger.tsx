'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import GodIcon from '@/components/GodIcon'
import PrincessIcon from '@/components/PrincessIcon'
import { godAccent, princesses } from '@/lib/data'
import {
  clearPending,
  hideGod,
  recordGuess,
  resetReveals,
  revealGod,
  revealMany,
  setPending,
  useGuesses,
  usePending,
  useRevealed,
} from '@/lib/revealStore'
import type { FacetScores } from '@/lib/types'

export type RevealItem = {
  seq: number
  god: string
  godSlug: string
  princess: string
  princessSlug: string
  score: number
  facets: FacetScores
  hints: string[]
  /** Plausible wrong answers for the guess — the god's next-best princesses. */
  distractors: string[]
  isFirstChoice: boolean
  isOverride: boolean
}

export type BonusItem = {
  god: string
  princess: string
  score: number
  facets: FacetScores
  hints: string[]
  href: string
}

// ── Shareable result card ───────────────────────────────────────────────
// Drawn client-side on a <canvas> so it only ever renders the player's own
// grid — never the answers or the pairing portraits — and needs no server
// route. The temple crest matches components/TempleCrest.tsx.
const CREST_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 132' fill='none' stroke='%23c8a25a' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'><path d='M18 52 L119 12 L220 52'/><path d='M34 49 L119 20 L204 49'/><path d='M119 12 V7 M18 52 V49 M220 52 V49'/><path d='M16 52 H222'/><path d='M20 57 H218'/><path d='M23 62 H215'/><path d='M29 62 H39 M31.5 63 V101 M36.5 63 V101 M29 102 H39'/><path d='M63 62 H73 M65.5 63 V101 M70.5 63 V101 M63 102 H73'/><path d='M97 62 H107 M99.5 63 V101 M104.5 63 V101 M97 102 H107'/><path d='M131 62 H141 M133.5 63 V101 M138.5 63 V101 M131 102 H141'/><path d='M165 62 H175 M167.5 63 V101 M172.5 63 V101 M165 102 H175'/><path d='M199 62 H209 M201.5 63 V101 M206.5 63 V101 M199 102 H209'/><path d='M23 103 H215'/><path d='M18 109 H220'/><path d='M13 116 H225'/></svg>"

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const c = ctx as unknown as { roundRect?: (x: number, y: number, w: number, h: number, r: number) => void }
  if (typeof c.roundRect === 'function') {
    ctx.beginPath()
    c.roundRect(x, y, w, h, r)
    return
  }
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

async function buildResultCard(
  results: Array<'correct' | 'wrong' | 'blank'>,
  correct: number,
  guessed: number,
): Promise<HTMLCanvasElement> {
  const W = 1080,
    H = 1080
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  const serifVar = getComputedStyle(document.documentElement).getPropertyValue('--font-serif').trim()
  const SERIF = `${serifVar || 'Georgia'}, Georgia, serif`
  const MONO = 'ui-monospace, Consolas, Menlo, monospace'
  try {
    await (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready
  } catch {
    /* fonts API unavailable — fall back to whatever's loaded */
  }
  const ls = (v: number) => {
    const c = ctx as unknown as { letterSpacing?: string }
    if ('letterSpacing' in c) c.letterSpacing = v + 'px'
  }

  // Ground + faint gold vignette
  ctx.fillStyle = '#0c0b0e'
  ctx.fillRect(0, 0, W, H)
  const g = ctx.createRadialGradient(W / 2, H * 0.4, 120, W / 2, H * 0.4, 780)
  g.addColorStop(0, 'rgba(200,162,90,0.06)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(200,162,90,0.30)'
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, W - 80, H - 80)
  ctx.strokeStyle = 'rgba(200,162,90,0.14)'
  ctx.lineWidth = 1
  ctx.strokeRect(52, 52, W - 104, H - 104)

  // Temple crest
  const crest = new Image()
  await new Promise<void>((res) => {
    crest.onload = () => res()
    crest.onerror = () => res()
    crest.src = 'data:image/svg+xml;utf8,' + CREST_SVG
  })
  const cw = 260,
    ch = (cw * 132) / 240
  ctx.drawImage(crest, (W - cw) / 2, 96, cw, ch)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#6b6559'
  ctx.font = `600 20px ${MONO}`
  ls(6)
  ctx.fillText('THIRTEEN GODS · THIRTEEN DISGUISES', W / 2, 332)
  ls(0)
  ctx.fillStyle = '#e9e3d6'
  ctx.font = `500 58px ${SERIF}`
  ctx.fillText('The Disney Princess', W / 2, 408)
  ctx.fillStyle = '#d9be86'
  ctx.font = `italic 500 76px ${SERIF}`
  ctx.fillText('Pantheon', W / 2, 494)

  // The result grid — one square per god, in play order
  const n = results.length,
    sq = 58,
    gap = 15,
    gw = n * sq + (n - 1) * gap,
    x0 = (W - gw) / 2,
    y0 = 596
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (sq + gap),
      o = results[i]
    if (o === 'correct') {
      ctx.fillStyle = '#c8a25a'
      roundRect(ctx, x, y0, sq, sq, 12)
      ctx.fill()
    } else if (o === 'wrong') {
      ctx.fillStyle = '#8f4b52'
      roundRect(ctx, x, y0, sq, sq, 12)
      ctx.fill()
    } else {
      ctx.strokeStyle = 'rgba(107,101,89,0.55)'
      ctx.lineWidth = 2
      roundRect(ctx, x, y0, sq, sq, 12)
      ctx.stroke()
    }
  }

  // Legend
  const hasBlank = results.some((o) => o === 'blank')
  const leg: Array<[string | null, string]> = [
    ['#c8a25a', 'Right'],
    ['#8f4b52', 'Wrong'],
  ]
  if (hasBlank) leg.push([null, 'Revealed'])
  ctx.font = `500 24px ${SERIF}`
  const swatch = 22,
    pad = 11,
    itemGap = 42
  const total =
    leg.reduce((a, [, l]) => a + swatch + pad + ctx.measureText(l).width, 0) +
    itemGap * (leg.length - 1)
  let lx = (W - total) / 2
  const ly = 712
  ctx.textAlign = 'left'
  leg.forEach(([c, l]) => {
    if (c) {
      ctx.fillStyle = c
      roundRect(ctx, lx, ly - 18, swatch, swatch, 6)
      ctx.fill()
    } else {
      ctx.strokeStyle = 'rgba(107,101,89,0.7)'
      ctx.lineWidth = 2
      roundRect(ctx, lx, ly - 18, swatch, swatch, 6)
      ctx.stroke()
    }
    lx += swatch + pad
    ctx.fillStyle = '#a49c8c'
    ctx.fillText(l, lx, ly)
    lx += ctx.measureText(l).width + itemGap
  })
  ctx.textAlign = 'center'

  // Score
  const sy = 822
  if (guessed > 0) {
    const a = 'You guessed ',
      b = String(correct),
      c = ` of ${guessed} right`
    ctx.font = `500 46px ${SERIF}`
    const wa = ctx.measureText(a).width,
      wc = ctx.measureText(c).width
    ctx.font = `600 46px ${SERIF}`
    const wb = ctx.measureText(b).width
    let sx = (W - (wa + wb + wc)) / 2
    ctx.textAlign = 'left'
    ctx.fillStyle = '#e9e3d6'
    ctx.font = `500 46px ${SERIF}`
    ctx.fillText(a, sx, sy)
    sx += wa
    ctx.fillStyle = '#d9be86'
    ctx.font = `600 46px ${SERIF}`
    ctx.fillText(b, sx, sy)
    sx += wb
    ctx.fillStyle = '#e9e3d6'
    ctx.font = `500 46px ${SERIF}`
    ctx.fillText(c, sx, sy)
    ctx.textAlign = 'center'
  } else {
    ctx.fillStyle = '#e9e3d6'
    ctx.font = `500 46px ${SERIF}`
    ctx.fillText('All thirteen unmasked', W / 2, sy)
  }

  ctx.fillStyle = '#6b6559'
  ctx.font = `600 22px ${MONO}`
  ls(3)
  ctx.fillText('THE-DISNEY-PANTHEON.VERCEL.APP', W / 2, 972)
  ls(0)
  return cv
}

export default function RevealLedger({
  items,
  bonus,
}: {
  items: RevealItem[]
  bonus?: BonusItem
}) {
  const revealed = useRevealed()
  const guesses = useGuesses()
  const pending = usePending()
  const bonusOpen = revealed.has('hades')
  const coreRevealed = items.filter((i) => revealed.has(i.godSlug)).length
  const complete = coreRevealed === items.length

  const pendingCount = items.filter((i) => !revealed.has(i.godSlug) && pending[i.godSlug]).length
  const guessedCount = items.filter((i) => guesses[i.godSlug]).length
  const correctCount = items.filter((i) => guesses[i.godSlug] === 'correct').length

  // Per-row multiple-choice options, generated on demand while the player picks.
  const [options, setOptions] = useState<Record<string, string[]>>({})
  // Slugs revealed *this interaction* — only these get the flashy animation
  // (rows already open from storage on load stay calm).
  const [flashed, setFlashed] = useState<Set<string>>(() => new Set())
  const [shared, setShared] = useState(false)
  const [imgState, setImgState] = useState<'idle' | 'working' | 'done'>('idle')

  const drop = (slug: string) =>
    setOptions((o) => {
      const { [slug]: _gone, ...rest } = o
      return rest
    })

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const startGuess = (it: RevealItem) => {
    // Princesses already spent on another god are off the table — each can only
    // be used once (it's a one-to-one matching).
    const usedElsewhere = new Set(
      items
        .filter((i) => i.godSlug !== it.godSlug && !revealed.has(i.godSlug) && pending[i.godSlug])
        .map((i) => pending[i.godSlug]),
    )
    const canUseCorrect = !usedElsewhere.has(it.princess)
    // The god's next-best princesses make the tempting wrong answers; fill with
    // other unused names if needed.
    const nearMiss = it.distractors.filter((n) => n !== it.princess && !usedElsewhere.has(n))
    const filler = shuffle(
      princesses
        .map((p) => p.name)
        .filter((n) => n !== it.princess && !usedElsewhere.has(n) && !nearMiss.includes(n)),
    )
    const pool = [...nearMiss, ...filler]
    const opts = canUseCorrect ? [it.princess, ...pool.slice(0, 3)] : pool.slice(0, 4)
    setOptions((o) => ({ ...o, [it.godSlug]: shuffle(opts) }))
  }

  // Lock in a pick WITHOUT revealing — the answer waits for the batch reveal.
  const pick = (it: RevealItem, name: string) => {
    setPending(it.godSlug, name)
    drop(it.godSlug)
  }

  // Unmask a single god whose guess is locked in (commit + score just that one).
  const unmaskOne = (it: RevealItem) => {
    const pickName = pending[it.godSlug]
    if (!pickName) return
    recordGuess(it.godSlug, pickName === it.princess)
    clearPending(it.godSlug)
    setFlashed((s) => new Set(s).add(it.godSlug))
  }

  // Unmask ONLY the gods with a pending guess — commit + score just those,
  // leaving the un-guessed gods still masked.
  const unmaskGuessed = () => {
    const freshly: string[] = []
    items.forEach((it) => {
      if (revealed.has(it.godSlug)) return
      const pickName = pending[it.godSlug]
      if (pickName) {
        recordGuess(it.godSlug, pickName === it.princess)
        clearPending(it.godSlug)
        freshly.push(it.godSlug)
      }
    })
    setFlashed((prev) => new Set([...prev, ...freshly]))
  }

  // Unmask everything still hidden (any pending guesses score; the rest just
  // reveal), plus the bonus.
  const unmaskAll = () => {
    const bonusFresh = bonus && !bonusOpen ? ['hades'] : []
    const freshly = items.filter((it) => !revealed.has(it.godSlug)).map((it) => it.godSlug)
    items.forEach((it) => {
      if (revealed.has(it.godSlug)) return
      const pickName = pending[it.godSlug]
      if (pickName) {
        recordGuess(it.godSlug, pickName === it.princess)
        clearPending(it.godSlug)
      }
    })
    revealMany([...items.map((i) => i.godSlug), ...bonusFresh])
    setFlashed((prev) => new Set([...prev, ...freshly, ...bonusFresh]))
  }

  // Bonus (Hades) stays an independent one-off reveal.
  const revealBonus = () => {
    setFlashed((s) => new Set(s).add('hades'))
    revealGod('hades')
  }

  const doShare = async () => {
    const squares = items
      .map((it) => {
        const o = guesses[it.godSlug]
        return o === 'correct' ? '🟩' : o === 'wrong' ? '🟥' : '⬛'
      })
      .join('')
    const site =
      typeof window !== 'undefined' ? window.location.origin : 'https://the-disney-pantheon.vercel.app'
    const scoreLine =
      guessedCount > 0 ? `Guessed ${correctCount}/${guessedCount} right` : 'All thirteen unmasked'
    const text = `The Disney Princess Pantheon 🏛️\n${squares}\n${scoreLine}\n${site}`
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text })
        return
      }
    } catch {
      /* fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(text)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {
      /* ignore */
    }
  }

  // Render the result as a PNG. On mobile, hand it to the native share sheet
  // (so it can go straight to a Story/chat); on desktop, download it.
  const saveImage = async () => {
    setImgState('working')
    try {
      const results = items.map((it) =>
        guesses[it.godSlug] === 'correct'
          ? 'correct'
          : guesses[it.godSlug] === 'wrong'
            ? 'wrong'
            : 'blank',
      ) as Array<'correct' | 'wrong' | 'blank'>
      const canvas = await buildResultCard(results, correctCount, guessedCount)
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), 'image/png'))
      if (!blob) throw new Error('render failed')
      const file = new File([blob], 'disney-princess-pantheon.png', { type: 'image/png' })
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean
        share?: (data?: ShareData) => Promise<void>
      }
      if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ files: [file] })
          setImgState('idle')
          return
        } catch (e) {
          // User cancelled the share sheet — don't also force a download.
          if (e instanceof Error && e.name === 'AbortError') {
            setImgState('idle')
            return
          }
        }
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setImgState('done')
      setTimeout(() => setImgState('idle'), 2000)
    } catch {
      setImgState('idle')
    }
  }

  // Which princess (by slug) has already been matched, and to whom.
  // Which princesses are "spent" — by a locked-in guess while playing, or by
  // the real pairing once revealed — mapped to the god that used them. Drives
  // both the candidate-set strike-through and the double-use guard.
  const usedByName = new Map<string, string>() // princess name → god label
  const usedByGodSlug = new Map<string, string>() // princess name → god slug that used her
  items.forEach((it) => {
    if (revealed.has(it.godSlug)) {
      usedByName.set(it.princess, it.god)
      usedByGodSlug.set(it.princess, it.godSlug)
    } else if (pending[it.godSlug]) {
      usedByName.set(pending[it.godSlug], it.god)
      usedByGodSlug.set(pending[it.godSlug], it.godSlug)
    }
  })

  // The options actually shown for an open picker: the generated set minus any a
  // different god has since claimed, then backfilled to four (correct answer,
  // near-misses, then any remaining unused) so a full slate shows when possible.
  const displayOptions = (it: RevealItem): string[] => {
    const usedByOther = (name: string) => {
      const g = usedByGodSlug.get(name)
      return !!g && g !== it.godSlug
    }
    const shown = (options[it.godSlug] ?? []).filter((n) => !usedByOther(n))
    for (const name of [it.princess, ...it.distractors, ...princesses.map((p) => p.name)]) {
      if (shown.length >= 4) break
      if (shown.includes(name) || usedByOther(name)) continue
      shown.push(name)
    }
    return shown
  }

  return (
    <div>
      {/* Completion — the payoff once the whole board is unmasked */}
      {complete && (
        <div className="mb-6 rounded-lg border border-gold/30 bg-gradient-to-br from-gold/[0.10] to-transparent px-5 py-6 text-center">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-gold/70">
            ✦ The pantheon stands unmasked ✦
          </p>
          <p className="mt-3 font-serif text-2xl text-ink sm:text-3xl">
            {guessedCount > 0 ? (
              <>
                You guessed <span className="text-goldsoft">{correctCount}</span> of {guessedCount}{' '}
                right
              </>
            ) : (
              'All thirteen unmasked'
            )}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={doShare}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/[0.08] px-5 py-2 font-mono text-xs uppercase tracking-[0.22em] text-goldsoft transition-colors hover:border-gold/70 hover:bg-gold/[0.14]"
            >
              {shared ? 'Copied to clipboard ✓' : 'Share your result'}
            </button>
            <button
              onClick={saveImage}
              disabled={imgState === 'working'}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/[0.08] px-5 py-2 font-mono text-xs uppercase tracking-[0.22em] text-goldsoft transition-colors hover:border-gold/70 hover:bg-gold/[0.14] disabled:opacity-60"
            >
              {imgState === 'working'
                ? 'Rendering…'
                : imgState === 'done'
                  ? 'Image saved ✓'
                  : 'Save image'}
            </button>
            <button
              onClick={resetReveals}
              className="font-mono text-xs uppercase tracking-[0.2em] text-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-muted"
            >
              Play again
            </button>
          </div>
          <Link
            href="/matrix"
            className="mt-5 inline-block max-w-measure text-sm text-goldsoft/80 underline decoration-gold/30 underline-offset-4 transition-colors hover:text-goldsoft hover:decoration-gold"
          >
            The Concordance — how each princess was matched to a god →
          </Link>
        </div>
      )}

      {/* Candidate princesses — a reminder of the roster, ticked off as matched */}
      <details className="group mb-6 rounded-lg border border-white/8 bg-raised/25">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink">
          <span>The 13 princesses · the candidate set</span>
          <span className="text-faint">
            <span className="group-open:hidden">show ▾</span>
            <span className="hidden group-open:inline">hide ▴</span>
          </span>
        </summary>
        <div className="border-t border-white/8 px-4 py-4">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {princesses.map((p) => {
              const god = usedByName.get(p.name)
              return (
                <li
                  key={p.slug}
                  className={`flex items-center justify-between gap-2 text-sm ${
                    god ? 'text-faint' : 'text-ink/85'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <PrincessIcon
                      slug={p.slug}
                      size={15}
                      className={`shrink-0 ${god ? 'text-faint' : 'text-muted'}`}
                    />
                    <span className={god ? 'line-through decoration-wine/50' : ''}>{p.name}</span>
                  </span>
                  {god && (
                    <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-widest text-gold/70">
                      {god}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-widest text-faint">
            {princesses.length - usedByName.size} still available
          </p>
        </div>
      </details>

      {/* Status + controls (hidden once the board is fully unmasked) */}
      {!complete && (
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-faint">
            {coreRevealed === 0 && pendingCount === 0 ? (
              <span>Guess the thirteen</span>
            ) : (
              <>
                <span>
                  {coreRevealed} / {items.length} unmasked
                </span>
                {pendingCount > 0 && (
                  <span className="ml-3 text-goldsoft">· {pendingCount} guessed</span>
                )}
              </>
            )}
          </p>
          <div className="flex items-center gap-4">
            {(coreRevealed > 0 || pendingCount > 0 || bonusOpen) && (
              <button
                onClick={resetReveals}
                className="font-mono text-xs uppercase tracking-[0.2em] text-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-muted"
              >
                Reset
              </button>
            )}
            <button
              onClick={pendingCount > 0 ? unmaskGuessed : unmaskAll}
              className="font-mono text-xs uppercase tracking-[0.2em] text-goldsoft underline decoration-gold/30 underline-offset-4 transition-colors hover:decoration-gold"
            >
              {pendingCount > 0 ? `Unmask guessed (${pendingCount})` : 'Unmask all'}
            </button>
          </div>
        </div>
      )}

      <ol className="border-t border-white/5">

        {items.map((it, idx) => {
          const open = revealed.has(it.godSlug)
          const picking = !open && !!options[it.godSlug]
          const pend = !open && !picking ? pending[it.godSlug] : undefined
          const flashOn = flashed.has(it.godSlug)
          const outcome = guesses[it.godSlug]
          return (
            <li
              key={it.godSlug}
              className="group border-t border-white/8 last:border-b"
              style={flashOn ? ({ '--flash-delay': `${idx * 0.06}s` } as CSSProperties) : undefined}
            >
              <div
                className={`relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-5 rounded-md py-6 transition-colors before:pointer-events-none before:absolute before:inset-y-2 before:left-0 before:w-[2px] before:rounded-full before:bg-transparent before:transition-colors before:content-[''] group-hover:bg-white/[0.025] group-hover:before:bg-gold/50 sm:gap-x-8 ${
                  picking || pend ? '' : 'cursor-pointer'
                }`}
                role={!open && !picking && !pend ? 'button' : undefined}
                tabIndex={!open && !picking && !pend ? 0 : undefined}
                aria-label={!open && !picking && !pend ? `Guess which princess is ${it.god}` : undefined}
                onClick={!open && !picking && !pend ? () => startGuess(it) : undefined}
                onKeyDown={
                  !open && !picking && !pend
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          startGuess(it)
                        }
                      }
                    : undefined
                }
              >
                {/* Sequence */}
                <span className="pl-2 font-mono text-sm tabular-nums text-faint">
                  {String(it.seq).padStart(2, '0')}
                </span>

                {/* God + reveal state */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <GodIcon
                      slug={it.godSlug}
                      className="h-[1.5rem] w-[1.5rem] shrink-0 self-center sm:h-[1.8rem] sm:w-[1.8rem]"
                      style={{ color: godAccent(it.godSlug) }}
                    />
                    <span className="font-serif text-2xl tracking-title text-goldsoft/90 sm:text-3xl">
                      {it.god}
                    </span>
                    {open && (
                      <>
                        <span className="text-faint">is</span>
                        <span
                          className={`font-serif text-2xl tracking-title text-ink transition-colors group-hover:text-goldsoft sm:text-3xl ${
                            flashOn ? 'reveal-name-flash' : ''
                          }`}
                        >
                          {it.princess}
                        </span>
                        {outcome && (
                          <span
                            className={`font-mono text-[0.6rem] uppercase tracking-[0.2em] ${
                              outcome === 'correct' ? 'text-goldsoft' : 'text-wine'
                            }`}
                          >
                            {outcome === 'correct' ? '✓ right' : '✗ wrong'}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {open ? (
                    /* Whole revealed row links to the chapter (stretched link). */
                    <Link
                      href={`/chapters/${it.godSlug}`}
                      className="group/a mt-2.5 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-goldsoft/75 transition-colors after:absolute after:inset-0 after:content-[''] hover:text-goldsoft"
                    >
                      Read the analysis
                      <span
                        aria-hidden
                        className="transition-transform group-hover/a:translate-x-0.5"
                      >
                        →
                      </span>
                    </Link>
                  ) : picking ? (
                    <div className="relative z-10 mt-3">
                      <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint">
                        Which princess?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {displayOptions(it).map((name) => (
                          <button
                            key={name}
                            onClick={() => pick(it, name)}
                            className="rounded-full border border-white/15 px-3.5 py-1 font-serif text-base text-ink/90 transition-colors hover:border-gold/50 hover:bg-gold/[0.06] hover:text-goldsoft"
                          >
                            {name}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            clearPending(it.godSlug)
                            drop(it.godSlug)
                          }}
                          className="rounded-full px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-muted"
                        >
                          cancel
                        </button>
                      </div>
                    </div>
                  ) : pend ? (
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint">
                        Your guess
                      </span>
                      <span className="rounded-full border border-gold/40 bg-gold/[0.06] px-3 py-0.5 font-serif text-base text-goldsoft">
                        {pend}
                      </span>
                      <button
                        onClick={() => startGuess(it)}
                        className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-muted"
                      >
                        change
                      </button>
                    </div>
                  ) : (
                    it.hints.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {it.hints.map((h) => (
                          <span
                            key={h}
                            className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[0.7rem] text-muted"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )
                  )}
                </div>

                {/* Right: the ? guess affordance is visual (whole masked row is
                    the click target); the ✓ on a locked-in guess unmasks it. */}
                <div className="text-right">
                  {open || picking ? null : pend ? (
                    <button
                      onClick={() => unmaskOne(it)}
                      aria-label={`Unmask ${it.god}`}
                      title="Unmask god"
                      className="mr-2 grid h-8 w-8 place-items-center rounded-full border border-gold/40 text-sm text-gold/80 transition-colors hover:border-gold hover:bg-gold/10 hover:text-goldsoft"
                    >
                      ✓
                    </button>
                  ) : (
                    <span
                      aria-hidden
                      className="mr-2 inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint transition-colors group-hover:text-goldsoft"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-white/12 text-base transition-colors group-hover:border-gold/50">
                        ?
                      </span>
                      <span className="hidden sm:inline">guess</span>
                    </span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {/* The fourteenth — off the matrix */}
      {bonus && (
        <div className="mt-10 border-t border-gold/25 pt-6">
          <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-gold/70">
            The fourteenth · non-Olympian · unofficial
          </p>
          <div
            className="group relative grid cursor-pointer grid-cols-[2.5rem_1fr_auto] items-center gap-x-5 rounded-md py-2 transition-colors before:pointer-events-none before:absolute before:inset-y-1 before:left-0 before:w-[2px] before:rounded-full before:bg-transparent before:transition-colors before:content-[''] hover:bg-white/[0.025] hover:before:bg-gold/50 sm:gap-x-8"
            role={!bonusOpen ? 'button' : undefined}
            tabIndex={!bonusOpen ? 0 : undefined}
            aria-label={!bonusOpen ? `Unmask who ${bonus.god} is` : undefined}
            onClick={!bonusOpen ? revealBonus : undefined}
            onKeyDown={
              !bonusOpen
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      revealBonus()
                    }
                  }
                : undefined
            }
          >
            <span aria-hidden className="text-center font-mono text-lg text-gold/70">
              ✦
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <GodIcon
                  slug="hades"
                  className="h-[1.5rem] w-[1.5rem] shrink-0 self-center sm:h-[1.8rem] sm:w-[1.8rem]"
                  style={{ color: godAccent('hades') }}
                />
                <span className="font-serif text-2xl tracking-title text-goldsoft/90 sm:text-3xl">
                  {bonus.god}
                </span>
                {bonusOpen && (
                  <>
                    <span className="text-faint">is</span>
                    <span
                      className={`font-serif text-2xl tracking-title text-ink transition-colors group-hover:text-goldsoft sm:text-3xl ${
                        flashed.has('hades') ? 'reveal-name-flash' : ''
                      }`}
                    >
                      {bonus.princess}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        hideGod('hades')
                      }}
                      className="relative z-10 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-muted"
                    >
                      hide
                    </button>
                  </>
                )}
              </div>
              {!bonusOpen && bonus.hints.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {bonus.hints.map((h) => (
                    <span
                      key={h}
                      className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[0.7rem] text-muted"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}
              {bonusOpen && (
                <Link
                  href={bonus.href}
                  className="group/a mt-2.5 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-goldsoft/75 transition-colors after:absolute after:inset-0 after:content-[''] hover:text-goldsoft"
                >
                  Read the analysis
                  <span aria-hidden className="transition-transform group-hover/a:translate-x-0.5">
                    →
                  </span>
                </Link>
              )}
            </div>
            <div className="text-right">
              {!bonusOpen && (
                <span
                  aria-hidden
                  className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint transition-colors group-hover:text-goldsoft"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-white/12 text-base transition-colors group-hover:border-gold/50">
                    ?
                  </span>
                  <span className="hidden sm:inline">unmask</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
