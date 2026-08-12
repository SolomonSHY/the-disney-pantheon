import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-measure px-6 py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-faint">Off the matrix</p>
      <h1 className="mt-6 text-4xl">No cell here</h1>
      <p className="prose-editorial mt-4 text-muted">
        This pairing was never scored. Return to the main page and choose one
        that was.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block font-serif text-goldsoft underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
      >
        ← Main
      </Link>
    </div>
  )
}
