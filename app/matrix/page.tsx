import type { Metadata } from 'next'
import Link from 'next/link'
import Heatmap from '@/components/Heatmap'
import GodNav from '@/components/GodNav'
import {
  canonicalPairings,
  cells,
  facetDefinitions,
  orderedGods,
  orderedPrincesses,
  scaleNote,
} from '@/lib/data'

export const metadata: Metadata = {
  title: 'The Concordance',
  description:
    'The full 13 × 13 grid of princesses against gods, every cell scored across five facets. Hover a cell for its breakdown.',
}

export default function MatrixPage() {
  const canonicalKeys = canonicalPairings.map((p) => `${p.princessSlug}::${p.godSlug}`)

  return (
    <div className="mx-auto max-w-[72rem] px-6 py-16">
      <div className="lg:grid lg:grid-cols-[12rem_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-10">
            <GodNav active="" />
          </div>
        </aside>

        <div>
          <header className="mb-10 max-w-measure">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-faint">
              169 cells · 5 facets each
            </p>
            <h1 className="text-4xl leading-tight sm:text-5xl">The Concordance</h1>
            <p className="prose-editorial mt-6 text-muted">
              Every princess measured against every god — gods down the side
              (click one to read its chapter), princesses across the top with
              their names hidden by default, so the grid doesn&rsquo;t spoil the
              pairings; reveal them when you&rsquo;re ready. Colour is heat: ash
              at zero, gold at the cap. Both axes share one order,
              with kindred gods grouped together — sovereignty, hearth and craft,
              earth and sea, war, arts and love, the liminal — so the canonical
              picks (the gold-ringed cells) run down the diagonal while the
              near-misses cluster right beside it. Hover any cell for its five
              facets. Compare down a column — one princess against every god —
              never across a row: the gods differ wildly in breadth, so a
              god&rsquo;s row of scores is not commensurable.
            </p>
          </header>

          {/* The five facets — read these first; the grid only makes sense after */}
          <section id="facets" className="mb-14 max-w-measure scroll-mt-24">
            <h2 className="text-2xl text-goldsoft">The five facets</h2>
            <p className="prose-editorial mt-4 text-muted">{scaleNote}</p>
            <dl className="mt-6 space-y-6">
              {facetDefinitions.map((f) => (
                <div key={f.code} className="border-t border-white/8 pt-5">
                  <dt className="flex items-baseline gap-3">
                    <span className="facet-code font-mono text-sm text-gold">{f.code}</span>
                    <span className="font-serif text-lg text-ink">{f.name}</span>
                  </dt>
                  <dd className="prose-editorial mt-2 grid gap-1 text-base text-muted sm:grid-cols-2">
                    <span>
                      <span className="text-faint">God — </span>
                      {f.god}
                    </span>
                    <span>
                      <span className="text-faint">Princess — </span>
                      {f.princess}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <Heatmap
            princesses={orderedPrincesses}
            gods={orderedGods}
            cells={cells}
            canonicalKeys={canonicalKeys}
          />

          <div className="mt-12 flex justify-center border-t border-white/8 pt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-muted transition-colors hover:border-gold/50 hover:text-goldsoft"
            >
              ← Back to the pantheon
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
