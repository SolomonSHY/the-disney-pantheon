'use client'

import Link from 'next/link'
import PrincessIcon from '@/components/PrincessIcon'
import { FACET_ORDER, facetColor, facetDefinitions, princesses, scoreColor } from '@/lib/data'
import { hideGod, resetReveals, revealGod, revealMany, useRevealed } from '@/lib/revealStore'
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
  const bonusOpen = revealed.has('hades')
  const strongest = Math.max(...items.map((i) => i.score))
  const coreRevealed = items.filter((i) => revealed.has(i.godSlug)).length
  const allOpen = coreRevealed === items.length && (!bonus || bonusOpen)

  const reveal = (slug: string) => revealGod(slug)
  const revealAll = () =>
    revealMany([...items.map((i) => i.godSlug), ...(bonus ? ['hades'] : [])])

  // Which princess (by slug) has already been matched, and to whom.
  const matchedTo = new Map(
    items.filter((i) => revealed.has(i.godSlug)).map((i) => [i.princessSlug, i.god]),
  )

  return (
    <div>
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
              const god = matchedTo.get(p.slug)
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
            {princesses.length - matchedTo.size} still hidden
          </p>
        </div>
      </details>

      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-faint">
          {coreRevealed} / {items.length} unmasked
        </p>
        <div className="flex items-center gap-4">
          {coreRevealed > 0 && (
            <button
              onClick={resetReveals}
              className="font-mono text-xs uppercase tracking-[0.2em] text-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-muted"
            >
              Reset
            </button>
          )}
          {!allOpen && (
            <button
              onClick={revealAll}
              className="font-mono text-xs uppercase tracking-[0.2em] text-goldsoft underline decoration-gold/30 underline-offset-4 transition-colors hover:decoration-gold"
            >
              Reveal all
            </button>
          )}
        </div>
      </div>

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
        {items.map((it) => {
          const open = revealed.has(it.godSlug)
          const rel = it.score / strongest
          return (
            <li key={it.godSlug} className="group border-t border-white/8 last:border-b">
              <div className="relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-5 rounded-md py-6 transition-colors group-hover:bg-white/[0.025] sm:gap-x-8">
                {/* Sequence */}
                <span className="pl-2 font-mono text-sm tabular-nums text-faint">
                  {String(it.seq).padStart(2, '0')}
                </span>

                {/* God — a stretched link over the whole row + princess/hints */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <Link
                      href={`/chapters/${it.godSlug}`}
                      className="font-serif text-2xl tracking-title text-goldsoft/90 transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-goldsoft sm:text-3xl"
                    >
                      {it.god}
                    </Link>
                    {open && (
                      <>
                        <span className="text-faint">is</span>
                        <span className="font-serif text-2xl tracking-title text-ink transition-colors group-hover:text-goldsoft sm:text-3xl">
                          {it.princess}
                        </span>
                      </>
                    )}
                  </div>

                  {open ? (
                    <div className="mt-3 flex items-end gap-1" aria-hidden>
                      {FACET_ORDER.map((code) => (
                        <span
                          key={code}
                          className="w-8 rounded-sm"
                          style={{
                            height: `${Math.max(2, (it.facets[code] / 10) * 18)}px`,
                            background: facetColor(it.facets[code]),
                            opacity: 0.85,
                          }}
                          title={`${code} ${it.facets[code].toFixed(1)}`}
                        />
                      ))}
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

                {/* Right: reveal control or score */}
                <div className="text-right">
                  {open ? (
                    <>
                      <div className="font-mono text-3xl tabular-nums text-ink sm:text-4xl">
                        {it.score.toFixed(1)}
                      </div>
                      <div className="mt-2 ml-auto h-1 w-24 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${rel * 100}%`, background: scoreColor(it.score) }}
                        />
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => reveal(it.godSlug)}
                      aria-label={`Reveal which princess is ${it.god}`}
                      className="relative z-10 mr-2 inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint transition-colors hover:text-goldsoft"
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
                <Link
                  href={bonus.href}
                  className="font-serif text-2xl tracking-title text-goldsoft/90 transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-goldsoft sm:text-3xl"
                >
                  {bonus.god}
                </Link>
                {bonusOpen && (
                  <>
                    <span className="text-faint">is</span>
                    <span className="font-serif text-2xl tracking-title text-ink transition-colors group-hover:text-goldsoft sm:text-3xl">
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
            </div>
            <div className="text-right">
              {bonusOpen ? (
                <>
                  <div className="font-mono text-3xl tabular-nums text-ink sm:text-4xl">
                    {bonus.score.toFixed(1)}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => revealGod('hades')}
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
