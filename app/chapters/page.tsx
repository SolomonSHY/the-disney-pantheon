import type { Metadata } from 'next'
import Link from 'next/link'
import { getPrincess, orderedPairings } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Chapters',
  description: 'The thirteen chapters, in reveal order — god by god.',
}

export default function ChaptersIndex() {
  return (
    <div className="mx-auto max-w-wide px-6 py-16">
      <h1 className="text-4xl leading-tight sm:text-5xl">Chapters</h1>
      <p className="prose-editorial mt-6 max-w-measure text-muted">
        The full contents, in reveal order — each Olympian and the princess she
        turned out to be.
      </p>

      <ol className="mt-12">
        {orderedPairings.map((p, i) => {
          const princess = getPrincess(p.princessSlug)
          return (
            <li key={p.godSlug} className="border-t border-white/8 last:border-b">
              <Link
                href={`/chapters/${p.godSlug}`}
                className="group flex items-baseline gap-5 py-5"
              >
                <span className="font-mono text-sm tabular-nums text-faint">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">
                  <span className="font-serif text-xl tracking-title">
                    <span className="text-goldsoft/90">{p.god}</span>{' '}
                    <span className="text-faint">is</span>{' '}
                    <span className="text-ink transition-colors group-hover:text-goldsoft">
                      {p.princess}
                    </span>
                  </span>
                  {princess && (
                    <span className="ml-3 font-mono text-xs text-faint">
                      {princess.film}, {princess.year}
                    </span>
                  )}
                </span>
                <span className="font-mono text-lg tabular-nums text-muted">
                  {p.score.toFixed(1)}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
