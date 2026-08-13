import type { Metadata } from 'next'
import Link from 'next/link'
import GodIcon from '@/components/GodIcon'
import GodNav from '@/components/GodNav'
import {
  DISPLAY_CAP,
  getAlgorithmicPairingByGod,
  godAccent,
  isOverrideGod,
  orderedPairings,
} from '@/lib/data'
import Overrides from '@/content/overrides.mdx'

export const metadata: Metadata = {
  title: 'Emendations',
  description:
    'The four places where a human overruled the machine — with the reasons why.',
}

// God-first view of the four corrections: for each affected god, the princess
// the algorithm assigned it (struck) vs. the princess it ended up with.
const emendations = orderedPairings
  .filter((p) => isOverrideGod(p.godSlug))
  .map((canonical) => {
    const alg = getAlgorithmicPairingByGod(canonical.godSlug)
    return {
      god: canonical.god,
      godSlug: canonical.godSlug,
      fromPrincess: alg?.princess ?? '',
      fromScore: alg?.score ?? 0,
      toPrincess: canonical.princess,
      toScore: canonical.score,
    }
  })

export default function OverridesPage() {
  return (
    <div className="mx-auto max-w-[72rem] px-6 py-16">
      <div className="lg:grid lg:grid-cols-[12rem_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-10">
            <GodNav active="" />
          </div>
        </aside>

        <div className="max-w-wide">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-faint">
            Masters of disguise · model limitations
          </p>
          <h1 className="text-4xl leading-tight sm:text-5xl">Emendations</h1>
          <p className="prose-editorial mt-6 text-muted">
            The AI powered matching algorithm produced two purely sacrificial
            pairings — Snow White with Poseidon, Aurora with Hera. Both were
            narratively unsatisfying (read:{' '}
            <span className="font-semibold uppercase tracking-wide text-wine">wrong</span>), and we
            used four manual overrides below to arrive at the right answer:
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/12 font-mono text-[0.65rem] uppercase tracking-widest text-faint">
                  <th className="py-3 pr-4 font-normal">God</th>
                  <th className="py-3 pr-4 font-normal">Algorithm chose</th>
                  <th className="py-3 pr-2 font-normal" aria-hidden />
                  <th className="py-3 pr-4 font-normal">Corrected to</th>
                  <th className="py-3 text-right font-normal">Score</th>
                </tr>
              </thead>
              <tbody className="font-serif">
                {emendations.map((e) => (
                  <tr key={e.godSlug} className="border-b border-white/8">
                    <td className="py-4 pr-4">
                      <Link
                        href={`/chapters/${e.godSlug}`}
                        className="inline-flex items-center gap-2.5 text-ink transition-colors hover:text-goldsoft"
                      >
                        <GodIcon
                          slug={e.godSlug}
                          size={18}
                          className="shrink-0"
                          style={{ color: godAccent(e.godSlug) }}
                        />
                        {e.god}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-muted line-through decoration-wine/60">
                      {e.fromPrincess}
                    </td>
                    <td className="py-4 pr-2 text-center text-lg text-gold">→</td>
                    <td className="py-4 pr-4 text-goldsoft">{e.toPrincess}</td>
                    <td className="py-4 text-right font-mono text-sm tabular-nums text-muted">
                      {e.fromScore.toFixed(1)} <span className="text-faint">→</span>{' '}
                      <span className="text-ink">{e.toScore.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-mono text-xs text-faint">
            Scores out of {DISPLAY_CAP}. Two of the four corrections cost points —
            the human chose the narratively right princess over the
            higher-scoring one.
          </p>

          <div className="prose-editorial mt-10 text-muted">
            <Overrides />
          </div>

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
