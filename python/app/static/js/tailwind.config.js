/* Port of tailwind.config.ts, handed to the Tailwind browser runtime.
   The utility class names used throughout the templates are the same ones the
   TSX used, so this theme has to match the original exactly. */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        // Warm near-black ground and parchment ink. The palette is deliberately
        // narrow: one paper, one ink, one gold. Everything else is opacity.
        ground: '#0c0b0e',
        raised: '#151319',
        ink: '#e9e3d6',
        muted: '#a49c8c',
        faint: '#6b6559',
        gold: '#c8a25a',
        goldsoft: '#d9be86',
        wine: '#8f4b52',
      },
      fontFamily: {
        // Newsreader (loaded from Google Fonts in layout.html), with a graceful
        // system-serif fallback.
        serif: [
          'var(--font-serif)',
          'Iowan Old Style',
          'Palatino Linotype',
          'Palatino',
          'Cambria',
          'Georgia',
          'ui-serif',
          'serif',
        ],
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: {
        measure: '34rem',
        wide: '46rem',
      },
      letterSpacing: {
        title: '-0.02em',
      },
    },
  },
}
