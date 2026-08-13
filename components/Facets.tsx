import Link from 'next/link'
import {
  DISPLAY_CAP,
  FACET_ORDER,
  facetColor,
  facetGloss,
  facetName,
  getAlgorithmicPairing,
  getPairing,
} from '@/lib/data'
import type { FacetScores } from '@/lib/types'

type FacetsProps = {
  /** Princess slug — resolves a pairing, its god, facets and score. */
  princess?: string
  /**
   * Which assignment to read for `princess`: the human's final call
   * ('authorial', default) or Fable's original pick ('algorithmic').
   */
  source?: 'authorial' | 'algorithmic'
  /** Or pass an explicit set of facet values (0–10 each). */
  facets?: Partial<FacetScores>
  /** Optional labels when passing explicit facets. */
  title?: string
  god?: string
  score?: number
  /** Hide the header row (used when a chapter already sets the scene). */
  bare?: boolean
  /** Show a short "what the bars & score mean" note + link to the facets guide. */
  explain?: boolean
  className?: string
}

/**
 * The facet breakdown for one pairing: five weighted sub-scores (0–10) that
 * feed the normalised total. Used inline in MDX chapters and reused by the
 * matrix hover cards. Renders on the server; no interactivity required.
 */
export default function Facets({
  princess,
  source = 'authorial',
  facets,
  title,
  god,
  score,
  bare = false,
  explain = false,
  className = '',
}: FacetsProps) {
  const pairing = princess
    ? source === 'algorithmic'
      ? getAlgorithmicPairing(princess)
      : getPairing(princess)
    : undefined
  const values = (facets ?? pairing?.facets) as FacetScores | undefined

  if (!values) {
    return (
      <p className="my-6 text-sm text-wine">
        No facet data for <code>{princess ?? title ?? 'unknown'}</code>.
      </p>
    )
  }

  const heading = title ?? pairing?.princess
  const against = god ?? pairing?.god
  const total = score ?? pairing?.score

  return (
    <figure
      className={`my-10 rounded-lg border border-white/8 bg-raised/60 px-6 py-6 not-italic ${className}`}
    >
      {!bare && (heading || against || total != null) && (
        <figcaption className="mb-5 flex items-baseline justify-between gap-4 border-b border-white/8 pb-3">
          <span className="font-serif text-lg tracking-title text-ink">
            {heading}
            {against && (
              <>
                {' '}
                <span className="text-faint">×</span>{' '}
                <span className="text-goldsoft">{against}</span>
              </>
            )}
          </span>
          {total != null && (
            <span className="shrink-0 font-mono text-sm text-muted">
              <span className="text-2xl text-gold">{total.toFixed(1)}</span>
              <span className="text-faint"> / {DISPLAY_CAP}</span>
            </span>
          )}
        </figcaption>
      )}

      <dl className="space-y-3">
        {FACET_ORDER.map((code) => {
          const v = values[code] ?? 0
          const gloss = facetGloss(code)
          return (
            <div key={code} className="grid grid-cols-[3.2rem_1fr_2.4rem] items-center gap-3">
              <dt
                className="facet-code text-sm font-medium text-muted"
                title={`${facetName(code)} — ${gloss.princess} vs. ${gloss.god}`}
              >
                {code}
              </dt>
              <dd className="h-2 overflow-hidden rounded-full bg-white/6" aria-hidden>
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{ width: `${(v / 10) * 100}%`, background: facetColor(v) }}
                />
              </dd>
              <dd className="text-right font-mono text-sm tabular-nums text-ink/80">
                {v.toFixed(1)}
              </dd>
            </div>
          )
        })}
      </dl>

      {explain && (
        <figcaption className="mt-5 border-t border-white/8 pt-3 text-xs leading-relaxed text-faint">
          Each bar is one of five facets, scored 0–10; the pairing&rsquo;s score is
          their sum, out of {DISPLAY_CAP}.{' '}
          <Link
            href="/matrix#facets"
            className="text-goldsoft underline decoration-gold/30 underline-offset-2 transition-colors hover:decoration-gold"
          >
            What the five facets mean →
          </Link>
        </figcaption>
      )}
    </figure>
  )
}
