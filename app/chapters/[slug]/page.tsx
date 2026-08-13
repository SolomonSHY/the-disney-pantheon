import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ChapterView from '@/components/ChapterView'
import ExactTags from '@/components/ExactTags'
import GodIcon from '@/components/GodIcon'
import GodNav from '@/components/GodNav'
import {
  chapterNeighbors,
  chapterSlugs,
  getAlgorithmicPairingByGod,
  getExactMatches,
  getPairingByGod,
  getPrincess,
  godAccent,
  isOverrideGod,
} from '@/lib/data'

export function generateStaticParams() {
  // `slug` is the god slug.
  return chapterSlugs.map((slug) => ({ slug }))
}

const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th']
function ordinal(n: number): string {
  return ORDINALS[n] ?? `${n}th`
}

export const dynamicParams = false

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const pairing = getPairingByGod(slug)
  if (!pairing) return {}
  return {
    // Absolute title (no site suffix): the god, and an X for the hidden princess.
    title: { absolute: `${pairing.god} — X` },
    description: `${pairing.god} in disguise: the human reveal and an AI editorial reading of the pairing.`,
  }
}

export default async function ChapterPage({ params }: Params) {
  const { slug } = await params
  const pairing = getPairingByGod(slug)
  if (!pairing) notFound()
  const princess = getPrincess(pairing.princessSlug)
  if (!princess) notFound()

  // God-centric override note: if the human reassigned this god, name the
  // princess the algorithm had originally paired it with.
  const alg = isOverrideGod(slug) ? getAlgorithmicPairingByGod(slug) : undefined
  const { index, prev, next } = chapterNeighbors(slug)
  const accent = godAccent(slug)

  // Essays are keyed by princess slug; the route is keyed by god slug.
  const { default: HumanEssay } = await import(`@/content/human/${pairing.princessSlug}.mdx`)
  const { default: AiEssay } = await import(`@/content/ai/${pairing.princessSlug}.mdx`)

  return (
    <>
      {/* Per-god atmosphere: a faint domain-tinted wash and a giant ghosted
          engraving of the god's own mark, bleeding off the top-right. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(55% 45% at 82% 6%, ${accent}22, transparent 62%)` }}
        />
        <div
          className="absolute -right-16 top-20 sm:right-0"
          style={{ color: accent, opacity: 0.14 }}
        >
          <GodIcon slug={slug} size={580} strokeWidth={0.7} />
        </div>
      </div>

      <div className="mx-auto max-w-[72rem] px-6 py-16">
        <div className="lg:grid lg:grid-cols-[12rem_1fr] lg:gap-14">
        {/* Left rail — jump to any god */}
        <aside className="hidden lg:block">
          <div className="sticky top-10">
            <GodNav active={slug} />
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
              godSlug={slug}
              accent={accent}
              princessSlug={pairing.princessSlug}
              label={`Hymn ${String(index + 1).padStart(2, '0')}`}
              god={pairing.god}
              princess={pairing.princess}
              film={princess.film}
              year={princess.year}
              score={pairing.score}
              facets={pairing.facets}
              rankLabel={
                pairing.rankInRow === 1
                  ? 'first choice'
                  : `${ordinal(pairing.rankInRow)}-closest god`
              }
              override={alg ? { algPrincess: alg.princess, algScore: alg.score } : null}
              humanEssay={<HumanEssay />}
              aiEssay={<AiEssay />}
              exactTags={<ExactTags matches={getExactMatches(pairing.princess, pairing.god)} />}
            />
          </div>

          {/* Chapter navigation */}
          <nav className="mt-20 grid grid-cols-2 gap-6 border-t border-white/8 pt-8 text-sm">
            <div>
              {prev && (
                <Link href={`/chapters/${prev.godSlug}`} className="group block">
                  <span className="font-mono text-xs uppercase tracking-widest text-faint">
                    ← Previous
                  </span>
                  <span className="mt-1 block font-serif text-lg text-ink/85 transition-colors group-hover:text-goldsoft">
                    {prev.god}
                  </span>
                </Link>
              )}
            </div>
            <div className="text-right">
              {next ? (
                <Link href={`/chapters/${next.godSlug}`} className="group block">
                  <span className="font-mono text-xs uppercase tracking-widest text-faint">
                    Next →
                  </span>
                  <span className="mt-1 block font-serif text-lg text-ink/85 transition-colors group-hover:text-goldsoft">
                    {next.god}
                  </span>
                </Link>
              ) : (
                // After the final pairing (Dionysus), send the reader to the bonus.
                <Link href="/bonus" className="group block">
                  <span className="font-mono text-xs uppercase tracking-widest text-faint">
                    Bonus →
                  </span>
                  <span className="mt-1 block font-serif text-lg text-goldsoft/90 transition-colors group-hover:text-goldsoft">
                    Hades, off the matrix
                  </span>
                </Link>
              )}
            </div>
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
