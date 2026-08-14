import type { Metadata } from 'next'
import Link from 'next/link'
import ChapterView from '@/components/ChapterView'
import ExactTags from '@/components/ExactTags'
import GodIcon from '@/components/GodIcon'
import GodNav from '@/components/GodNav'
import { appendix, godAccent } from '@/lib/data'
import HumanEssay from '@/content/human/elsa.mdx'
import AiAnalysis from '@/content/ai-elsa.mdx'

export const metadata: Metadata = {
  title: { absolute: 'Hades — X' },
  description:
    'The off-matrix fourteenth pairing: the most famous god who is not an Olympian against the most famous heroine who is not a princess.',
  openGraph: {
    title: 'Hades — X',
    description: 'Which Disney heroine is Hades in disguise?',
    images: [{ url: '/og/hades.png', width: 1200, height: 630, alt: 'Hades — which Disney heroine is in disguise?' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hades — X',
    description: 'Which Disney heroine is Hades in disguise?',
    images: ['/og/hades.png'],
  },
}

const intro = (
  <p>
    The most famous god who is <em>technically</em> not an Olympian — matched, off
    the matrix, to a heroine who is <em>technically</em> not a princess. Neither
    was ever in the scored set.
  </p>
)

const accent = godAccent('hades')

export default function BonusPage() {
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(55% 45% at 82% 6%, ${accent}22, transparent 62%)` }}
        />
        <div
          className="absolute -right-16 top-20 sm:right-0"
          style={{ color: accent, opacity: 0.14 }}
        >
          <GodIcon slug="hades" size={580} strokeWidth={0.7} />
        </div>
      </div>

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
              accent={accent}
              princessSlug="elsa"
              label="The fourteenth"
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
              exactTags={<ExactTags matches={appendix.exactMatches} />}
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
            <Link href="/matrix" className="group block text-right">
              <span className="font-mono text-xs uppercase tracking-widest text-faint">
                Next →
              </span>
              <span className="mt-1 block font-serif text-lg text-ink/85 transition-colors group-hover:text-goldsoft">
                The Concordance
              </span>
            </Link>
          </nav>

          {/* Return to the ledger from the foot of the analysis. */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-muted transition-colors hover:border-gold/50 hover:text-goldsoft"
            >
              ← Back to the pantheon
            </Link>
          </div>
        </article>
        </div>
      </div>
    </>
  )
}
