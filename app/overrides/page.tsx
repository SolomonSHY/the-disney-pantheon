import type { Metadata } from 'next'
import Link from 'next/link'
import GodNav from '@/components/GodNav'
import { DISPLAY_CAP, getPairing, overrides } from '@/lib/data'
import Overrides from '@/content/overrides.mdx'

export const metadata: Metadata = {
  title: 'Manual Overrides',
  description:
    'The four places where a human overruled the machine — with the reasons why.',
}

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
          <h1 className="text-4xl leading-tight sm:text-5xl">Manual Overrides</h1>
          <p className="prose-editorial mt-6 text-muted">
            Fable&rsquo;s initial analysis produced two purely sacrificial pairings
            — Snow White with Poseidon, Aurora with Hera. Both were narratively
            unsatisfying (read: clearly wrong), and it took the four manual
            overrides below to arrive at the right answer.
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/12 font-mono text-[0.65rem] uppercase tracking-widest text-faint">
                  <th className="py-3 pr-4 font-normal">Princess</th>
                  <th className="py-3 pr-4 font-normal">Computer</th>
                  <th className="py-3 pr-4 font-normal">Human</th>
                  <th className="py-3 pr-4 text-right font-normal">Score</th>
                  <th className="py-3 text-right font-normal">Row</th>
                </tr>
              </thead>
              <tbody className="font-serif">
                {overrides.map((o) => (
                  <tr key={o.princessSlug} className="border-b border-white/8">
                    <td className="py-4 pr-4">
                      <Link
                        href={`/chapters/${getPairing(o.princessSlug)?.godSlug ?? ''}`}
                        className="text-ink transition-colors hover:text-goldsoft"
                      >
                        {o.princess}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-muted line-through decoration-wine/60">
                      {o.from.god}
                    </td>
                    <td className="py-4 pr-4 text-goldsoft">{o.to.god}</td>
                    <td className="py-4 pr-4 text-right font-mono text-sm tabular-nums text-muted">
                      {o.from.score.toFixed(1)} <span className="text-faint">→</span>{' '}
                      <span className="text-ink">{o.to.score.toFixed(1)}</span>
                    </td>
                    <td className="py-4 text-right font-mono text-sm tabular-nums text-faint">
                      #{o.rankInRow}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-mono text-xs text-faint">
            Scores out of {DISPLAY_CAP}. Two of the four cost points — the human
            chose the narratively right god over the higher-scoring one.
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
