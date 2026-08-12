import type { ReactNode } from 'react'

// A stylized emblem per princess, matched to the god icons' engraved line style.
// Minimal marks meant to sit beside a name, not detailed illustration.
const ICONS: Record<string, ReactNode> = {
  // Snow White — apple
  'snow-white': (
    <>
      <path d="M12 8.6c-1.6-1.8-6-1.3-6 3 0 4 2.8 8.4 6 8.4s6-4.4 6-8.4c0-4.3-4.4-4.8-6-3z" />
      <path d="M12 8.6V5" />
      <path d="M12 6.6c1-2 3.4-2 3.4-2s.2 2.6-3.4 2z" />
    </>
  ),
  // Cinderella — broom
  cinderella: (
    <>
      <path d="M12 2 V12" />
      <path d="M8 12 L6.5 21 L17.5 21 L16 12 Z" />
      <path d="M8.5 12 H15.5" />
      <path d="M10 13 L9 21 M12 13 L12 21 M14 13 L15 21" />
    </>
  ),
  // Aurora — rose
  aurora: (
    <>
      <path d="M12 4a3.4 3.4 0 1 0 3 5 A2.3 2.3 0 1 0 12 6.4 a1.2 1.2 0 1 0 1 1.8" />
      <path d="M12 11v8" />
      <path d="M12 14c1.8-1 3.8-.2 3.8-.2s-.9 2.3-3.8 1" />
    </>
  ),
  // Ariel — scallop shell (fan of ribs from a hinge, scalloped top)
  ariel: (
    <>
      <path d="M12 19 C7 17 4.6 12 6 8.5" />
      <path d="M12 19 C17 17 19.4 12 18 8.5" />
      <path d="M6 8.5 Q7.5 6.8 9 8 Q10.5 6.4 12 7.6 Q13.5 6.4 15 8 Q16.5 6.8 18 8.5" />
      <path d="M12 19 L12 7.6 M12 19 L9 8 M12 19 L15 8" />
    </>
  ),
  // Belle — open book
  belle: (
    <>
      <path d="M12 6.6 C9.5 5.2 5.6 5.2 3.6 6.2 V17.6 C5.6 16.6 9.5 16.6 12 18 C14.5 16.6 18.4 16.6 20.4 17.6 V6.2 C18.4 5.2 14.5 5.2 12 6.6 Z" />
      <path d="M12 6.6 V18" />
    </>
  ),
  // Jasmine — magic lamp
  jasmine: (
    <>
      <path d="M4.5 15.5 C4.5 12.6 8 11.6 12 11.6 C15.5 11.6 18.5 12.4 18.5 15 L4.5 15.5 Z" />
      <path d="M18 13 L21.5 11" />
      <path d="M10.5 11.7 V9.9 A1.3 1.3 0 0 1 13 9.9" />
      <path d="M21.5 11 Q21.6 9.7 22.2 9.1" />
    </>
  ),
  // Pocahontas — feather
  pocahontas: (
    <>
      <path d="M6.5 18.5 C10 12 14.5 7.5 18.5 5.5 C18.5 10 14.5 15.5 8.5 17.5" />
      <path d="M6.5 18.5 L18 6" />
      <path d="M9.6 14.4 L12.5 15 M12.6 11 L15.2 11.6 M8 16.6 L10.3 17" />
    </>
  ),
  // Mulan — sword (broad blade, crossguard, pommel)
  mulan: (
    <>
      <path d="M12 3 L13 7 V13.5 H11 V7 Z" />
      <path d="M8.3 14 H15.7" />
      <path d="M12 14 V18" />
      <path d="M10.6 18.4 H13.4" />
    </>
  ),
  // Tiana — lily pad (leaf with the slit on the narrow side, pac-man style)
  tiana: <path d="M12 12 L18.95 9.75 A7.5 6 0 1 0 18.95 14.25 Z" />,
  // Rapunzel — long braid
  rapunzel: (
    <>
      <path d="M9.5 4 Q12 3.2 14.5 4" />
      <path d="M9.5 4 Q13 6 9.5 8 Q13 10 9.5 12 Q12.5 14 10.5 16" />
      <path d="M14.5 4 Q11 6 14.5 8 Q11 10 14.5 12 Q11.5 14 13.5 16" />
      <path d="M10.5 16 Q12 18.5 12 21 Q12 18.5 13.5 16" />
    </>
  ),
  // Merida — bow and arrow
  merida: (
    <>
      <path d="M7 4 C15 9 15 15 7 20" />
      <path d="M7 4 V20" />
      <path d="M5.5 12 H20" />
      <path d="M17 9 L20 12 L17 15" />
    </>
  ),
  // Moana — a sail on a mast over the canoe hull
  moana: (
    <>
      <path d="M8 3 V18" />
      <path d="M8 5 C13 6.2 16.2 9.5 17 14 L8 14 Z" />
      <path d="M4 18 Q12 21.2 20 18" />
    </>
  ),
  // Raya — the Salakot (wide-brimmed conical hat with finial)
  raya: (
    <>
      <ellipse cx="12" cy="16.4" rx="9.6" ry="1.8" />
      <path d="M6 16 Q6.6 9.2 12 6 Q17.4 9.2 18 16" />
      <path d="M12 6 V4.4" />
      <circle cx="12" cy="3.8" r="0.8" />
    </>
  ),
  // Elsa — snowflake (the off-matrix bonus)
  elsa: (
    <>
      <path d="M12 2 V22 M3.34 7 L20.66 17 M3.34 17 L20.66 7" />
      <path d="M12 5.5 L10 7.3 M12 5.5 L14 7.3 M12 18.5 L10 16.7 M12 18.5 L14 16.7" />
      <path d="M6 8.6 L6.4 11.1 M6 8.6 L8.4 8.5 M18 15.4 L17.6 12.9 M18 15.4 L15.6 15.5" />
      <path d="M6 15.4 L8.4 15.5 M6 15.4 L6.4 12.9 M18 8.6 L15.6 8.5 M18 8.6 L17.6 11.1" />
    </>
  ),
}

export default function PrincessIcon({
  slug,
  className = '',
  size = 24,
}: {
  slug: string
  className?: string
  size?: number
}) {
  const glyph = ICONS[slug]
  if (!glyph) return null
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {glyph}
    </svg>
  )
}
