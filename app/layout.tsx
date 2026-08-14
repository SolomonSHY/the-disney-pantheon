import type { Metadata } from 'next'
import Link from 'next/link'
import { Analytics } from '@vercel/analytics/next'
import { Newsreader } from 'next/font/google'
import GodIcon from '@/components/GodIcon'
import { orderedPairings } from '@/lib/data'
import './globals.css'

// The editorial display/reading serif, self-hosted by next/font.
const serif = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://disney-pantheon.com'),
  title: {
    default: 'The Disney Princess Pantheon',
    template: '%s · The Disney Princess Pantheon',
  },
  description:
    'Thirteen Olympian gods, each disguised as a Disney princess — a scored, adversarially-reviewed mapping across five facets of character.',
  openGraph: {
    title: 'The Disney Princess Pantheon',
    description:
      'The Olympian gods, starved of worship, have each disguised themselves as a Disney princess.',
    url: '/',
    siteName: 'The Disney Princess Pantheon',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Disney Princess Pantheon',
    description:
      'The Olympian gods, starved of worship, have each disguised themselves as a Disney princess.',
  },
}

function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-white/5">
      <div className="mx-auto flex max-w-[72rem] flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-6 py-5">
        <Link
          href="/"
          className="font-serif text-lg tracking-title text-ink transition-colors hover:text-goldsoft"
        >
          The Disney Princess&nbsp;Pantheon
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted sm:gap-6">
          <Link href="/" className="transition-colors hover:text-ink">
            Pantheon
          </Link>
          <Link href="/matrix" className="transition-colors hover:text-ink">
            Concordance
          </Link>
          <Link href="/overrides" className="transition-colors hover:text-ink">
            Emendations
          </Link>
        </nav>
      </div>

      {/* Mobile "jump to a god" menu — the rail is hidden below lg */}
      <details className="group border-t border-white/5 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-3 font-mono text-xs uppercase tracking-[0.25em] text-muted [&::-webkit-details-marker]:hidden">
          <span>Jump to a god</span>
          <span className="text-faint">
            <span className="group-open:hidden">▾</span>
            <span className="hidden group-open:inline">▴</span>
          </span>
        </summary>
        <nav className="mx-auto grid max-w-[72rem] grid-cols-2 gap-x-5 gap-y-0.5 border-t border-white/5 px-6 py-4 sm:grid-cols-3">
          {orderedPairings.map((p, i) => (
            <Link
              key={p.godSlug}
              href={`/chapters/${p.godSlug}`}
              className="flex items-center gap-2.5 py-1.5 text-muted transition-colors hover:text-ink"
            >
              <GodIcon slug={p.godSlug} size={16} className="shrink-0 text-gold/70" />
              <span className="font-mono text-[0.6rem] tabular-nums text-faint">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-serif text-base">{p.god}</span>
            </Link>
          ))}
          <Link
            href="/bonus"
            className="flex items-center gap-2.5 py-1.5 text-muted transition-colors hover:text-ink"
          >
            <GodIcon slug="hades" size={16} className="shrink-0 text-gold/70" />
            <span className="font-serif text-base">
              Hades <span className="font-mono text-[0.55rem] uppercase tracking-widest text-faint">bonus</span>
            </span>
          </Link>
        </nav>
      </details>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="relative z-20 border-t border-white/5">
      <div className="mx-auto max-w-[72rem] space-y-4 px-6 py-10">
        <p className="max-w-measure text-xs leading-relaxed text-faint">
          An unofficial fan project, unaffiliated with and unendorsed by The Walt
          Disney Company. Disney, the Disney Princesses, and all related characters
          and films are trademarks of their respective owners, used here for
          commentary and criticism. Pairing portraits are AI-generated.
        </p>
        <p className="max-w-measure text-xs leading-relaxed text-faint">
          Found a bug, or think a pairing is wrong?{' '}
          <a
            href="https://github.com/SolomonSHY/the-disney-pantheon"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white/15 underline-offset-4 transition-colors hover:text-muted hover:decoration-gold/40"
          >
            Open an issue on GitHub →
          </a>
        </p>
        <p className="max-w-measure text-xs leading-relaxed text-faint">
          Playtesting by{' '}
          <a
            href="https://suzyahyah.github.io/about/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white/15 underline-offset-4 transition-colors hover:text-muted hover:decoration-gold/40"
          >
            Suzy Ahyah
          </a>
          .
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-faint">
          <Link href="/" className="transition-colors hover:text-muted">
            Pantheon
          </Link>
          <Link href="/matrix" className="transition-colors hover:text-muted">
            Concordance
          </Link>
          <Link href="/overrides" className="transition-colors hover:text-muted">
            Emendations
          </Link>
        </nav>
      </div>
    </footer>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={serif.variable}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="relative z-10 flex-1 pb-24">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  )
}
