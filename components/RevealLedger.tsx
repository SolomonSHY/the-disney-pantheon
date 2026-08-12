'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import PrincessIcon from '@/components/PrincessIcon'
import {
  DISPLAY_CAP,
  FACET_ORDER,
  facetColor,
  facetDefinitions,
  princesses,
  scoreColor,
} from '@/lib/data'
import {
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
  hints: string[]
  href: string
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
  const strongest = Math.max(...items.map((i) => i.score))
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
  const [introDismissed, setIntroDismissed] = useState(false)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem('pantheon:introDismissed')) setIntroDismissed(true)
    } catch {
      /* ignore */
    }
  }, [])

  const dismissIntro = () => {
    setIntroDismissed(true)
    try {
      localStorage.setItem('pantheon:introDismissed', '1')
    } catch {
      /* ignore */
    }
  }

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

  // Commit every pending guess, score it, and unmask the whole board at once.
  const revealAll = () => {
    const freshly: string[] = []
    items.forEach((it) => {
      if (revealed.has(it.godSlug)) return
      const pickName = pending[it.godSlug]
      if (pickName) recordGuess(it.godSlug, pickName === it.princess)
      freshly.push(it.godSlug)
    })
    revealMany([...items.map((i) => i.godSlug), ...(bonus && !bonusOpen ? ['hades'] : [])])
    setFlashed((prev) => new Set([...prev, ...freshly, ...(bonus && !bonusOpen ? ['hades'] : [])]))
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
    const text = `The Disney Pantheon 🏛️\n${squares}\n${scoreLine}\n${site}`
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
              'All thirteen revealed'
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
              onClick={resetReveals}
              className="font-mono text-xs uppercase tracking-[0.2em] text-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-muted"
            >
              Play again
            </button>
          </div>
        </div>
      )}

      {/* How to play — a one-time framing for first visitors, dismissible */}
      {!introDismissed && !complete && (
        <div className="relative mb-6 overflow-hidden rounded-lg border border-gold/20 bg-gradient-to-br from-gold/[0.07] to-transparent px-5 py-4 pr-10">
          <button
            onClick={dismissIntro}
            aria-label="Dismiss how to play"
            className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full text-faint transition-colors hover:bg-white/5 hover:text-ink"
          >
            ✕
          </button>
          <p className="font-serif text-lg text-ink">How this works</p>
          <p className="prose-editorial mt-1 max-w-measure text-sm text-muted">
            Every god below is one of the thirteen princesses in disguise. Lock in a{' '}
            <span className="font-mono text-[0.8em] uppercase tracking-wider text-goldsoft">Guess</span>{' '}
            for each — then <span className="text-ink/80">Reveal answers</span> unmasks them all at
            once and scores you, so earlier answers can&rsquo;t tip off the later ones. (Or{' '}
            <span className="text-ink/80">Reveal all</span> to just skip ahead.) Once unmasked, click
            a row to read the full pairing analysis.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[0.65rem] uppercase tracking-widest text-faint">
            <span>
              <span className="text-muted">bars</span> = DOM · ROL · ARC · ICO · TMP
            </span>
            <span>
              <span className="text-muted">number</span> = total ⁄ {DISPLAY_CAP}
            </span>
          </div>
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
            {coreRevealed} / {items.length} unmasked
            {pendingCount > 0 && (
              <span className="ml-3 text-goldsoft">· {pendingCount} locked in</span>
            )}
          </p>
          <div className="flex items-center gap-4">
            {(coreRevealed > 0 || pendingCount > 0) && (
              <button
                onClick={resetReveals}
                className="font-mono text-xs uppercase tracking-[0.2em] text-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-muted"
              >
                Reset
              </button>
            )}
            <button
              onClick={revealAll}
              className="font-mono text-xs uppercase tracking-[0.2em] text-goldsoft underline decoration-gold/30 underline-offset-4 transition-colors hover:decoration-gold"
            >
              {pendingCount > 0 ? `Reveal answers (${pendingCount})` : 'Reveal all'}
            </button>
          </div>
        </div>
      )}

      {/* Legend for the facet sparkline on each revealed row */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-white/5 py-2 text-[0.7rem] text-faint">
        <span className="font-mono uppercase tracking-widest">Bars →</span>
        {facetDefinitions.map((f) => (
          <span key={f.code} className="inline-flex items-baseline gap-1.5">
            <span className="facet-code font-mono text-muted">{f.code}</span>
            <span>{f.name}</span>
          </span>
        ))}
        <Link
          href="/matrix#facets"
          className="text-goldsoft underline decoration-gold/30 underline-offset-2 transition-colors hover:decoration-gold"
        >
          what these mean →
        </Link>
      </div>

      <ol>
        {items.map((it, idx) => {
          const open = revealed.has(it.godSlug)
          const rel = it.score / strongest
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
              <div className="relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-5 rounded-md py-6 transition-colors group-hover:bg-white/[0.025] sm:gap-x-8">
                {/* Sequence */}
                <span className="pl-2 font-mono text-sm tabular-nums text-faint">
                  {String(it.seq).padStart(2, '0')}
                </span>

                {/* God — a stretched link over the whole row + princess/hints */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3">
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
                            className={`relative z-10 font-mono text-[0.6rem] uppercase tracking-[0.2em] ${
                              outcome === 'correct' ? 'text-goldsoft' : 'text-wine'
                            }`}
                          >
                            {outcome === 'correct' ? '✓ unmasked' : '✗ missed'}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {open ? (
                    <>
                      <div
                        className={`mt-3 flex items-end gap-1.5 ${flashOn ? 'reveal-in' : ''}`}
                        aria-hidden
                      >
                        {FACET_ORDER.map((code) => (
                          <span key={code} className="flex flex-col items-center">
                            <span
                              className="flex h-[18px] items-end"
                              title={`${code} ${it.facets[code].toFixed(1)}`}
                            >
                              <span
                                className="facet-bar w-8 rounded-sm"
                                style={{
                                  height: `${Math.max(2, (it.facets[code] / 10) * 18)}px`,
                                  background: facetColor(it.facets[code]),
                                  opacity: 0.85,
                                }}
                              />
                            </span>
                            <span className="facet-code mt-1 font-mono text-[0.6rem] leading-none text-faint">
                              {code}
                            </span>
                          </span>
                        ))}
                      </div>
                      {/* The one link to the chapter — only after reveal. */}
                      <Link
                        href={`/chapters/${it.godSlug}`}
                        className="group/a mt-3 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-goldsoft/75 transition-colors hover:text-goldsoft"
                      >
                        Read the analysis
                        <span
                          aria-hidden
                          className="transition-transform group-hover/a:translate-x-0.5"
                        >
                          →
                        </span>
                      </Link>
                    </>
                  ) : picking ? (
                    <div className="relative z-10 mt-3">
                      <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint">
                        Which princess?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {options[it.godSlug]
                          .filter((name) => {
                            // Drop any option a *different* god has since claimed.
                            const usedBy = usedByGodSlug.get(name)
                            return !usedBy || usedBy === it.godSlug
                          })
                          .map((name) => (
                            <button
                              key={name}
                              onClick={() => pick(it, name)}
                              className="rounded-full border border-white/15 px-3.5 py-1 font-serif text-base text-ink/90 transition-colors hover:border-gold/50 hover:bg-gold/[0.06] hover:text-goldsoft"
                            >
                              {name}
                            </button>
                          ))}
                        <button
                          onClick={() => drop(it.godSlug)}
                          className="rounded-full px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-muted"
                        >
                          cancel
                        </button>
                      </div>
                    </div>
                  ) : pend ? (
                    <div className="relative z-10 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
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

                {/* Right: guess control / locked marker / score */}
                <div className="text-right">
                  {open ? (
                    <div className={flashOn ? 'reveal-in' : ''}>
                      <div className="font-mono text-3xl tabular-nums text-ink sm:text-4xl">
                        {it.score.toFixed(1)}
                      </div>
                      <div className="mt-2 ml-auto h-1 w-24 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${rel * 100}%`, background: scoreColor(it.score) }}
                        />
                      </div>
                    </div>
                  ) : picking ? null : pend ? (
                    <span
                      aria-label="Guess locked in"
                      title="Guess locked in"
                      className="relative z-10 mr-2 grid h-8 w-8 place-items-center rounded-full border border-gold/40 text-sm text-gold/80"
                    >
                      ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => startGuess(it)}
                      aria-label={`Guess which princess is ${it.god}`}
                      className="relative z-10 mr-2 inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint transition-colors hover:text-goldsoft"
                    >
                      <span
                        aria-hidden
                        className="grid h-8 w-8 place-items-center rounded-full border border-white/12 text-base transition-colors hover:border-gold/50"
                      >
                        ?
                      </span>
                      <span className="hidden sm:inline">guess</span>
                    </button>
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
            The fourteenth · off the matrix
          </p>
          <div className="group relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-5 rounded-md py-2 transition-colors hover:bg-white/[0.025] sm:gap-x-8">
            <span aria-hidden className="text-center font-mono text-lg text-gold/70">
              ✦
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3">
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
                      onClick={() => hideGod('hades')}
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
                  className="group/a mt-2.5 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-goldsoft/75 transition-colors hover:text-goldsoft"
                >
                  Read the analysis
                  <span aria-hidden className="transition-transform group-hover/a:translate-x-0.5">
                    →
                  </span>
                </Link>
              )}
            </div>
            <div className="text-right">
              {bonusOpen ? (
                <div className="font-mono text-3xl tabular-nums text-ink sm:text-4xl">
                  {bonus.score.toFixed(1)}
                </div>
              ) : (
                <button
                  onClick={revealBonus}
                  aria-label={`Reveal who ${bonus.god} is`}
                  className="relative z-10 inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint transition-colors hover:text-goldsoft"
                >
                  <span
                    aria-hidden
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/12 text-base transition-colors hover:border-gold/50"
                  >
                    ?
                  </span>
                  <span className="hidden sm:inline">reveal</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
