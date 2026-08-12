import Link from 'next/link'
import GodIcon from '@/components/GodIcon'
import { orderedPairings } from '@/lib/data'

/**
 * The left-hand "pantheon" rail on chapter pages — lets a reader skip to any god
 * without following the reveal order. Listed in reveal order (chapter numbers),
 * with the off-matrix bonus (Hades) pinned at the end. `active` is the current
 * god slug, or 'bonus' on the bonus page.
 */
export default function GodNav({ active }: { active: string }) {
  return (
    <nav aria-label="Jump to a god" className="text-sm">
      <Link
        href="/"
        className="mb-4 block font-mono text-[0.6rem] uppercase tracking-[0.3em] text-faint transition-colors hover:text-goldsoft"
      >
        The pantheon
      </Link>
      <ol className="space-y-0.5">
        {orderedPairings.map((p, i) => {
          const on = active === p.godSlug
          return (
            <li key={p.godSlug}>
              <Link
                href={`/chapters/${p.godSlug}`}
                aria-current={on ? 'page' : undefined}
                className={`-mx-2 flex items-center gap-2 border-l-2 py-1 pl-2.5 pr-2 transition-colors ${
                  on
                    ? 'border-gold text-goldsoft'
                    : 'border-transparent text-muted hover:border-white/20 hover:text-ink'
                }`}
              >
                <span
                  className={`font-mono text-[0.65rem] tabular-nums ${on ? 'text-gold' : 'text-faint'}`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <GodIcon
                  slug={p.godSlug}
                  size={15}
                  className={`shrink-0 ${on ? 'text-gold' : 'text-faint'}`}
                />
                <span className="font-serif">{p.god}</span>
              </Link>
            </li>
          )
        })}
        <li className="mt-2 border-t border-white/8 pt-2">
          <Link
            href="/bonus"
            aria-current={active === 'bonus' ? 'page' : undefined}
            className={`-mx-2 flex items-center gap-2 border-l-2 py-1 pl-2.5 pr-2 transition-colors ${
              active === 'bonus'
                ? 'border-gold text-goldsoft'
                : 'border-transparent text-muted hover:border-white/20 hover:text-ink'
            }`}
          >
            <span
              className={`font-mono text-[0.6rem] leading-none ${active === 'bonus' ? 'text-gold' : 'text-faint'}`}
            >
              ✦
            </span>
            <GodIcon
              slug="hades"
              size={15}
              className={`shrink-0 ${active === 'bonus' ? 'text-gold' : 'text-faint'}`}
            />
            <span className="font-serif">
              Hades <span className="font-mono text-[0.6rem] uppercase tracking-widest text-faint">bonus</span>
            </span>
          </Link>
        </li>
      </ol>
    </nav>
  )
}
