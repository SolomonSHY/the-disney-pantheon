'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import {
  DISPLAY_CAP,
  FACET_ORDER,
  facetColor,
  facetName,
  scoreColor,
  scoreInk,
} from '@/lib/data'
import { useRevealed } from '@/lib/revealStore'
import type { Cell, God, Princess } from '@/lib/types'

type HeatmapProps = {
  princesses: Princess[]
  gods: God[]
  cells: Cell[]
  /** `${princessSlug}::${godSlug}` keys for the canonical (authorial) picks. */
  canonicalKeys: string[]
}

type Active = { cell: Cell; x: number; y: number; below: boolean } | null

const CARD_W = 320

export default function Heatmap({ princesses, gods, cells, canonicalKeys }: HeatmapProps) {
  const [active, setActive] = useState<Active>(null)
  const [manualNames, setManualNames] = useState<boolean | null>(null)
  const canonical = new Set(canonicalKeys)

  // Princess names are hidden by default so a stray visit doesn't spoil the
  // pairings — unless the reader has already unmasked all thirteen elsewhere.
  const revealed = useRevealed()
  const canonicalGodSlugs = canonicalKeys.map((k) => k.split('::')[1])
  const allRevealed =
    canonicalGodSlugs.length > 0 && canonicalGodSlugs.every((gs) => revealed.has(gs))
  const namesShown = manualNames ?? allRevealed

  const cellAt = useCallback(
    (pSlug: string, gSlug: string) =>
      cells.find((c) => c.princessSlug === pSlug && c.godSlug === gSlug),
    [cells],
  )

  const show = (cell: Cell, el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    const below = r.top < 260 // not enough room above -> place card below
    setActive({
      cell,
      x: Math.min(Math.max(r.left + r.width / 2, CARD_W / 2 + 8), window.innerWidth - CARD_W / 2 - 8),
      y: below ? r.bottom + 10 : r.top - 10,
      below,
    })
  }

  return (
    <div className="relative">
      {/* Spoiler-safe toggle for the princess names across the top */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="font-mono text-[0.7rem] uppercase tracking-widest text-faint">
          {namesShown ? 'Princess names shown' : 'Princess names hidden'}
        </p>
        <button
          onClick={() => setManualNames(!namesShown)}
          className="font-mono text-xs uppercase tracking-[0.2em] text-goldsoft underline decoration-gold/30 underline-offset-4 transition-colors hover:decoration-gold"
        >
          {namesShown ? 'Hide princesses' : 'Reveal princesses'}
        </button>
      </div>

      <div className="overflow-x-auto pb-4">
        <table
          className="border-separate"
          style={{ borderSpacing: 3 }}
          onMouseLeave={() => setActive(null)}
        >
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-ground" />
              {princesses.map((p) => (
                <th key={p.slug} className="h-32 w-10 align-bottom">
                  <div className="mx-auto flex h-28 items-end justify-center">
                    <span
                      className={`whitespace-nowrap font-mono text-xs tracking-wide ${
                        namesShown ? 'text-muted' : 'text-faint'
                      }`}
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                      {namesShown ? p.name : '· · ·'}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gods.map((g) => (
              <tr key={g.slug}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-ground pr-3 text-right align-middle"
                >
                  <Link
                    href={`/chapters/${g.slug}`}
                    className="whitespace-nowrap font-serif text-sm text-ink/85 transition-colors hover:text-goldsoft"
                  >
                    {g.name}
                  </Link>
                </th>
                {princesses.map((p) => {
                  const cell = cellAt(p.slug, g.slug)
                  if (!cell) return <td key={p.slug} />
                  const key = `${p.slug}::${g.slug}`
                  const isPick = canonical.has(key)
                  const isActive = active?.cell === cell
                  return (
                    <td key={p.slug} className="p-0">
                      <button
                        type="button"
                        onMouseEnter={(e) => show(cell, e.currentTarget)}
                        onFocus={(e) => show(cell, e.currentTarget)}
                        onBlur={() => setActive(null)}
                        aria-label={`${namesShown ? p.name : 'hidden princess'} × ${g.name}: ${cell.score.toFixed(1)}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-[3px] text-[0.7rem] tabular-nums outline-none transition-transform duration-100 ${
                          isActive ? 'scale-[1.14]' : ''
                        } ${isPick ? 'ring-1 ring-gold ring-offset-1 ring-offset-ground' : ''}`}
                        style={{ background: scoreColor(cell.score), color: scoreInk(cell.score) }}
                      >
                        {cell.score.toFixed(0)}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3 text-xs text-faint">
        <span className="font-mono">0</span>
        <span
          className="h-2 w-40 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${scoreColor(0)}, ${scoreColor(DISPLAY_CAP * 0.5)}, ${scoreColor(DISPLAY_CAP)})`,
          }}
        />
        <span className="font-mono">{DISPLAY_CAP}</span>
        <span className="ml-4 inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-[3px] ring-1 ring-gold" />
          canonical pick
        </span>
      </div>

      {/* Hover / focus card */}
      {active && <HoverCard active={active} canonical={canonical} showPrincess={namesShown} />}
    </div>
  )
}

function HoverCard({
  active,
  canonical,
  showPrincess,
}: {
  active: NonNullable<Active>
  canonical: Set<string>
  showPrincess: boolean
}) {
  const { cell, x, y, below } = active
  const isPick = canonical.has(`${cell.princessSlug}::${cell.godSlug}`)
  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 w-80 rounded-lg border border-white/12 bg-raised/95 p-4 shadow-2xl shadow-black/60 backdrop-blur"
      style={{ left: x, top: y, transform: `translate(-50%, ${below ? '0%' : '-100%'})` }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
        <span className="font-serif text-base tracking-title text-ink">
          <span className={showPrincess ? '' : 'text-faint'}>
            {showPrincess ? cell.princess : '· · ·'}
          </span>{' '}
          <span className="text-faint">×</span>{' '}
          <span className="text-goldsoft">{cell.god}</span>
        </span>
        <span className="font-mono text-xl tabular-nums text-gold">{cell.score.toFixed(1)}</span>
      </div>

      <div className="space-y-2">
        {FACET_ORDER.map((code) => {
          const v = cell.facets[code] ?? 0
          return (
            <div key={code} className="grid grid-cols-[2.6rem_1fr_2rem] items-center gap-2">
              <span className="facet-code text-xs text-muted" title={facetName(code)}>
                {code}
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-white/8">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(v / 10) * 100}%`, background: facetColor(v) }}
                />
              </span>
              <span className="text-right font-mono text-xs tabular-nums text-ink/75">
                {v.toFixed(1)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[0.65rem] uppercase tracking-widest text-faint">
        <span>row #{cell.rankInRow} · col #{cell.rankInColumn}</span>
        {isPick ? <span className="text-gold">canonical</span> : <span>candidate</span>}
      </div>
      {cell.contraNote && (
        <p className="mt-2 text-xs italic leading-snug text-wine">{cell.contraNote}</p>
      )}
    </div>
  )
}
