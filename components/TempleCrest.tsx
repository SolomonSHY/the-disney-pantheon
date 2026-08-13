// A Greek temple facade — pediment, fluted colonnade, stylobate — drawn in the
// same engraved line style as the god/princess icons. Used as a frontispiece
// crest on the landing masthead. Purely decorative.
export default function TempleCrest({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 132"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* pediment */}
      <path d="M18 52 L119 12 L220 52" />
      <path d="M34 49 L119 20 L204 49" />
      {/* akroteria */}
      <path d="M119 12 V7 M18 52 V49 M220 52 V49" />
      {/* entablature */}
      <path d="M16 52 H222" />
      <path d="M20 57 H218" />
      <path d="M23 62 H215" />
      {/* six fluted columns */}
      <path d="M29 62 H39 M31.5 63 V101 M36.5 63 V101 M29 102 H39" />
      <path d="M63 62 H73 M65.5 63 V101 M70.5 63 V101 M63 102 H73" />
      <path d="M97 62 H107 M99.5 63 V101 M104.5 63 V101 M97 102 H107" />
      <path d="M131 62 H141 M133.5 63 V101 M138.5 63 V101 M131 102 H141" />
      <path d="M165 62 H175 M167.5 63 V101 M172.5 63 V101 M165 102 H175" />
      <path d="M199 62 H209 M201.5 63 V101 M206.5 63 V101 M199 102 H209" />
      {/* stylobate */}
      <path d="M23 103 H215" />
      <path d="M18 109 H220" />
      <path d="M13 116 H225" />
    </svg>
  )
}
