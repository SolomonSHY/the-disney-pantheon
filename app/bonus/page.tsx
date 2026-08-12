import type { Metadata } from 'next'
import Link from 'next/link'
import ChapterView from '@/components/ChapterView'
import ExactTags from '@/components/ExactTags'
import GodNav from '@/components/GodNav'
import { appendix } from '@/lib/data'
import HumanEssay from '@/content/human/elsa.mdx'
import AiAnalysis from '@/content/ai-elsa.mdx'

export const metadata: Metadata = {
  title: { absolute: 'Hades — X' },
  description:
    'The off-matrix fourteenth pairing: the most famous god who is not an Olympian against the most famous heroine who is not a princess.',
}

const intro = (
  <p>
    The most famous god who is <em>technically</em> not an Olympian — matched, off
    the matrix, to a heroine who is <em>technically</em> not a princess. Neither
    was ever in the scored set.
  </p>
)

export default function BonusPage() {
  return (
    <div className="mx-auto max-w-[72rem] px-6 py-16">
      <div className="lg:grid lg:grid-cols-[12rem_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-10">
            <GodNav active="bonus" />
          </div>
        </aside>

        <article className="max-w-wide">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.25em] text-faint transition-colors hover:text-muted"
          >
            ← Pantheon
          </Link>

          <div className="mt-8">
            <ChapterView
              godSlug="hades"
              princessSlug="elsa"
              label="Bonus · off the matrix"
              god="Hades"
              princess="Elsa"
              film="Frozen"
              year={2013}
              score={appendix.score}
              facets={appendix.facets}
              rankLabel=""
              override={null}
              intro={intro}
              hideable
              humanEssay={<HumanEssay />}
              aiEssay={<AiAnalysis />}
              aiExtra={<ExactTags matches={appendix.exactMatches} />}
            />
          </div>

          <nav className="mt-20 grid grid-cols-2 gap-6 border-t border-white/8 pt-8 text-sm">
            <Link href="/chapters/dionysus" className="group block">
              <span className="font-mono text-xs uppercase tracking-widest text-faint">
                ← Previous
              </span>
              <span className="mt-1 block font-serif text-lg text-ink/85 transition-colors group-hover:text-goldsoft">
                Dionysus
              </span>
            </Link>
            <Link href="/chapters/zeus" className="group block text-right">
              <span className="font-mono text-xs uppercase tracking-widest text-faint">
                Start over →
              </span>
              <span className="mt-1 block font-serif text-lg text-ink/85 transition-colors group-hover:text-goldsoft">
                Zeus
              </span>
            </Link>
          </nav>
        </article>
      </div>
    </div>
  )
}
