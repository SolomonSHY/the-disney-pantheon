import type { CSSProperties, ReactNode } from 'react'

// Stylized line-art attributes of each god, on a 24×24 grid. Deliberately
// minimal — they read as identifying marks beside the god's name, not as
// detailed illustration. All stroke-based for one consistent engraved look.
const ICONS: Record<string, ReactNode> = {
  // Zeus — thunderbolt
  zeus: <path d="M13 2 L6 13 H10 L8 22 L18 9 H12 Z" />,
  // Hera — diadem
  hera: (
    <>
      <path d="M4 18 H20 L18.5 9 L14.5 13 L12 6 L9.5 13 L5.5 9 Z" />
      <circle cx="5.5" cy="9" r="0.9" />
      <circle cx="12" cy="6" r="0.9" />
      <circle cx="18.5" cy="9" r="0.9" />
    </>
  ),
  // Poseidon — trident
  poseidon: (
    <>
      <path d="M12 22 V7" />
      <path d="M7.5 8 H16.5" />
      <path d="M8 8 V4 M12 8 V3 M16 8 V4" />
      <path d="M6.7 5.4 L8 4 L9.3 5.4 M10.7 4.4 L12 3 L13.3 4.4 M14.7 5.4 L16 4 L17.3 5.4" />
    </>
  ),
  // Demeter — wheat
  demeter: (
    <>
      <path d="M12 22 V8" />
      <path d="M12 8.5 C9.6 8 8.4 6.2 8.4 4 C10.7 4 12 6 12 8.2" />
      <path d="M12 8.5 C14.4 8 15.6 6.2 15.6 4 C13.3 4 12 6 12 8.2" />
      <path d="M12 13 C10 12.5 9 11 9 9 C11 9 12 10.6 12 12.6" />
      <path d="M12 13 C14 12.5 15 11 15 9 C13 9 12 10.6 12 12.6" />
    </>
  ),
  // Athena — owl
  athena: (
    <>
      <circle cx="12" cy="12.5" r="7.5" />
      <circle cx="9" cy="11" r="2" />
      <circle cx="15" cy="11" r="2" />
      <path d="M12 13.5 L11 15.5 H13 Z" />
      <path d="M6.2 6.5 L8.6 8.9 M17.8 6.5 L15.4 8.9" />
    </>
  ),
  // Apollo — sun
  apollo: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3 V5.4 M12 18.6 V21 M3 12 H5.4 M18.6 12 H21 M5.5 5.5 L7.2 7.2 M16.8 16.8 L18.5 18.5 M18.5 5.5 L16.8 7.2 M7.2 16.8 L5.5 18.5" />
    </>
  ),
  // Artemis — crescent moon
  artemis: <path d="M16 3.5 A8.6 8.6 0 1 0 16 20.5 A6.6 6.6 0 0 1 16 3.5 Z" />,
  // Ares — crested helmet
  ares: (
    <>
      <path d="M7 20 V13 a5 5 0 0 1 10 0 V20 H14 V16 L12.5 17.5 H11.5 L10 16 V20 Z" />
      <path d="M8.5 8 Q12 3 15.5 8" />
    </>
  ),
  // Aphrodite — hand mirror (Venus)
  aphrodite: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14 V21 M9 18 H15" />
    </>
  ),
  // Hephaestus — blacksmith's hammer
  hephaestus: (
    <>
      <path d="M5 5 H15 V9 H5 Z" />
      <path d="M10 9 V20" />
    </>
  ),
  // Hermes — caduceus
  hermes: (
    <>
      <path d="M12 22 V6" />
      <circle cx="12" cy="4.3" r="1.2" />
      <path d="M12 6.5 Q8 4.5 6 6.5 Q9 7.2 12 8.5 M12 6.5 Q16 4.5 18 6.5 Q15 7.2 12 8.5" />
      <path d="M9 9.5 Q12 12 15 9.5 M9 13 Q12 15.5 15 13" />
    </>
  ),
  // Hestia — hearth flame
  hestia: (
    <path d="M12 3 C14.5 6.5 16 8.5 16 11.5 a4 4 0 0 1 -8 0 c0-2 .8-3.4 2-4.5 0 2 .8 3 2 3.2 C11.5 9.5 11 6.5 12 3 Z" />
  ),
  // Dionysus — grapes
  dionysus: (
    <>
      <path d="M12 10 V7 M12 7 C14 5 16.5 5.8 16.5 5.8 C16.5 8 14 8.8 12 7 Z" />
      <circle cx="10" cy="12" r="1.7" />
      <circle cx="14" cy="12" r="1.7" />
      <circle cx="12" cy="15" r="1.7" />
      <circle cx="8.6" cy="15" r="1.7" />
      <circle cx="15.4" cy="15" r="1.7" />
      <circle cx="10.4" cy="18" r="1.7" />
      <circle cx="13.6" cy="18" r="1.7" />
    </>
  ),
  // Hades — bident
  hades: (
    <>
      <path d="M12 22 V8" />
      <path d="M8 8 H16" />
      <path d="M8 8 V4 M16 8 V4" />
      <path d="M6.7 5.4 L8 4 L9.3 5.4 M14.7 5.4 L16 4 L17.3 5.4" />
    </>
  ),
}

export default function GodIcon({
  slug,
  className = '',
  size = 24,
  strokeWidth = 1.4,
  style,
}: {
  slug: string
  className?: string
  size?: number
  strokeWidth?: number
  style?: CSSProperties
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
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {glyph}
    </svg>
  )
}
