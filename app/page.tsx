import GodNav from '@/components/GodNav'
import RevealLedger, { type BonusItem, type RevealItem } from '@/components/RevealLedger'
import TempleCrest from '@/components/TempleCrest'
import {
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
            <TempleCrest className="mb-7 w-44 text-gold/50 sm:w-52" />
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-faint">
              Thirteen gods · thirteen disguises · thirteen princesses
            </p>
            <h1 className="text-balance text-5xl leading-[1.05] sm:text-6xl">
              The Disney Princess <span className="italic text-goldsoft">Pantheon</span>
            </h1>
            <p className="prose-editorial mt-8 max-w-measure text-muted">
              The 13 Olympian gods, starved of worship, have each disguised
              themselves as one of the official 13 Disney princesses.
            </p>
            <p className="prose-editorial mt-5 max-w-measure text-sm text-muted">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-goldsoft">
                How to play —{' '}
              </span>
              Lock in a{' '}
              <span className="font-mono text-[0.85em] uppercase tracking-wider text-goldsoft">
                Guess
              </span>{' '}
              for each god, then <span className="text-ink/80">Unmask guessed</span> to reveal and
              score your picks. (Or <span className="text-ink/80">Unmask all</span> to skip ahead.)
            </p>
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
