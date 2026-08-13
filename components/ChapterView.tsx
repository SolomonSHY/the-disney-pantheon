'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Facets from '@/components/Facets'
import GodIcon from '@/components/GodIcon'
import PrincessIcon from '@/components/PrincessIcon'
import { hideGod, revealGod, useRevealed } from '@/lib/revealStore'
import type { FacetScores } from '@/lib/types'

type ChapterViewProps = {
  /** Store key + icon key for this god ('hades' on the bonus). */
  godSlug: string
  /** The god's domain accent colour, for the mark and header rule. */
  accent?: string
  /** Princess slug — for her emblem in the title once revealed. */
  princessSlug: string
  /** Eyebrow prefix, e.g. "Chapter 08" or "Bonus · off the matrix". */
  label: string
  god: string
  princess: string
  film: string
  year: number
  /** Kept in the props for the callers; the header no longer renders them. */
  score?: number
  facets: FacetScores
  rankLabel?: string
  override: { algPrincess: string; algScore: number } | null
  humanEssay: ReactNode
  aiEssay: ReactNode
  /** The exact-tag-matches block — shown under either essay, below the facets. */
  exactTags?: ReactNode
  /** Optional lead paragraph under the header (used by the bonus). */
  intro?: ReactNode
  /** Allow re-hiding after reveal (the bonus is toggleable; the 13 are one-way). */
  hideable?: boolean
}

export default function ChapterView({
  godSlug,
  accent = '#c8a25a',
  princessSlug,
  label,
  god,
  princess,
  film,
  year,
  facets,
  override,
  humanEssay,
  aiEssay,
  exactTags,
  intro,
  hideable = false,
}: ChapterViewProps) {
  const revealed = useRevealed().has(godSlug)
  const [analysis, setAnalysis] = useState<'human' | 'ai'>('human')

  return (
    <>
      <header className="border-b pb-8" style={{ borderColor: `${accent}40` }}>
        <div className="flex flex-wrap items-baseline gap-x-3 font-mono text-xs uppercase tracking-[0.3em] text-faint">
          <span>{label}</span>
          {revealed && (
            <>
              <span aria-hidden>·</span>
              <span>
                {film}, {year}
              </span>
            </>
          )}
        </div>

        {/* God is Princess — one line, icon aligned with each name */}
        <h1 className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-balance text-4xl leading-[1.12] tracking-title sm:text-5xl">
          <GodIcon
            slug={godSlug}
            className="h-[0.85em] w-[0.85em] shrink-0"
            style={{ color: accent }}
          />
          <span>{god}</span>
          <span className="font-serif text-2xl text-faint sm:text-3xl">is</span>
          {revealed ? (
            <span className="inline-flex items-center gap-2.5">
              <PrincessIcon
                slug={princessSlug}
                className="h-[0.8em] w-[0.8em] shrink-0 text-goldsoft/80"
              />
              <span className="text-goldsoft">{princess}</span>
              {hideable && (
                <button
                  onClick={() => hideGod(godSlug)}
                  className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-muted"
                >
                  hide
                </button>
              )}
            </span>
          ) : (
            <button
              onClick={() => revealGod(godSlug)}
              aria-label={`Reveal which princess is ${god}`}
              className="group inline-flex translate-y-[-0.15em] items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1 align-middle font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:border-gold/50 hover:text-goldsoft"
            >
              <span aria-hidden className="text-sm leading-none">?</span>
              reveal
            </button>
          )}
        </h1>
      </header>

      {/* The pairing portrait — the god fused with the princess. Only mounted
          (and only fetched) once the pair is revealed, so it can't spoil. */}
      {revealed && (
        <figure
          className="reveal-in mt-8 overflow-hidden rounded-lg border"
          style={{ borderColor: `${accent}55` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/pairings/${godSlug}.jpg`}
            alt={`${god}, disguised as ${princess}`}
            width={1280}
            height={698}
            className="block w-full"
          />
        </figure>
      )}

      {intro && <div className="prose-editorial mt-8 text-muted">{intro}</div>}

      {/* Analysis toggle */}
      <div className="mt-8">
        <div
          role="tablist"
          aria-label="Choose analysis"
          className="inline-flex items-stretch gap-1 rounded-lg border border-white/10 bg-raised/50 p-1"
        >
          {(
            [
              { key: 'human', label: 'Human analysis' },
              { key: 'ai', label: 'AI analysis' },
            ] as const
          ).map((t) => {
            const active = analysis === t.key
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setAnalysis(t.key)}
                className={`rounded-md px-4 py-2 font-serif text-base transition-colors ${
                  active ? 'bg-gold/15 text-goldsoft' : 'text-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Essay body */}
      <div className="prose-editorial essay-body mt-8">
        {analysis === 'human' ? humanEssay : aiEssay}
      </div>

      <Facets bare explain facets={facets} />

      {exactTags}

      {/* Override footnote — kept out of the commentary, noted at the end */}
      {override && (
        <p className="mt-12 border-t border-white/8 pt-5 text-sm text-faint">
          <span aria-hidden className="mr-2 text-wine">
            ⚑
          </span>
          Manual override — the algorithm originally paired this god with{' '}
          <span className="text-muted">{override.algPrincess}</span> (
          {override.algScore.toFixed(1)}).{' '}
          <Link
            href="/overrides"
            className="text-goldsoft underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
          >
            Why →
          </Link>
        </p>
      )}
    </>
  )
}
