import { FACET_ORDER } from '@/lib/data'
import type { FacetCode } from '@/lib/types'

/**
 * The exact tag overlaps that drove a cell, grouped by facet — the tags present
 * in both the god's and the princess's profile. Shown under the AI reading.
 */
export default function ExactTags({ matches }: { matches: Record<FacetCode, string[]> }) {
  const any = FACET_ORDER.some((code) => (matches[code]?.length ?? 0) > 0)
  if (!any) return null

  return (
    <div className="mt-8 rounded-lg border border-white/8 bg-raised/40 p-6">
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-faint">
        Exact tag matches
      </p>
      <dl className="space-y-3">
        {FACET_ORDER.map((code) => {
          const tags = matches[code] ?? []
          if (!tags.length) return null
          return (
            <div key={code} className="grid grid-cols-[3rem_1fr] gap-3">
              <dt className="facet-code text-sm text-gold">{code}</dt>
              <dd className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-xs text-ink/75"
                  >
                    {t}
                  </span>
                ))}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
