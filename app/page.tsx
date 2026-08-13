import Link from 'next/link'
import GodNav from '@/components/GodNav'
import RevealLedger, { type BonusItem, type RevealItem } from '@/components/RevealLedger'
import {
  DISPLAY_CAP,
  appendix,
  getNearMissPrincesses,
  godDomainHints,
  isOverride,
  orderedPairings,
} from '@/lib/data'

export default function LandingPage() {
  const items: RevealItem[] = orderedPairings.map((p, i) => ({
    seq: i + 1,
    god: p.god,
    godSlug: p.godSlug,
    princess: p.princess,
    princessSlug: p.princessSlug,
    score: p.score,
    facets: p.facets,
    hints: godDomainHints(p.god),
    distractors: getNearMissPrincesses(p.godSlug, p.princessSlug, 3),
    isFirstChoice: p.isFirstChoice,
    isOverride: isOverride(p.princessSlug),
  }))

  const bonus: BonusItem = {
    god: 'Hades',
    princess: 'Elsa',
    score: appendix.score,
    facets: appendix.facets,
    hints: ['the dead', 'underworld', 'riches'],
    href: '/bonus',
  }

  return (
    <div className="mx-auto max-w-[72rem] px-6 py-16">
      <div className="lg:grid lg:grid-cols-[12rem_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-10">
            <GodNav active="" />
          </div>
        </aside>

        <div className="max-w-wide">
          {/* Masthead */}
          <section className="pb-14 pt-4">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-faint">
              Thirteen gods · thirteen disguises · thirteen princesses
            </p>
            <h1 className="text-balance text-5xl leading-[1.05] sm:text-6xl">
              The Disney <span className="italic text-goldsoft">Pantheon</span>
            </h1>
            <p className="prose-editorial mt-8 max-w-measure text-muted">
              The 13 Olympian gods, starved of worship, have each disguised
              themselves as one of the official 13 Disney princesses. Some gods
              have disguised themselves very cleverly, and some disguises are
              barely disguises at all.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-faint">
              <Link
                href="/matrix"
                className="text-goldsoft underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
              >
                See the full 13 × 13 matrix →
              </Link>
              <span className="font-mono text-xs">
                scores 0–{DISPLAY_CAP} · the five facets summed
              </span>
            </div>
          </section>

          {/* The reveal ledger */}
          <section aria-label="Gods in disguise — click to unmask each princess" className="pb-6">
            <RevealLedger items={items} bonus={bonus} />
          </section>
        </div>
      </div>
    </div>
  )
}
