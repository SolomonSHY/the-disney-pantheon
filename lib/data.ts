import matrixJson from '@/data/matrix.json'
import pairingsJson from '@/data/pairings.json'
import methodJson from '@/data/method.json'
import appendixJson from '@/data/appendix.json'
import profilesJson from '@/data/profiles.json'
import type {
  Cell,
  FacetCode,
  FacetDefinition,
  FacetScores,
  God,
  Matrix,
  Pairing,
  PairingSet,
  Princess,
} from './types'

const matrix = matrixJson as unknown as Matrix
const pairings = pairingsJson as unknown as {
  algorithmic: PairingSet
  authorial: PairingSet
}
const method = methodJson as unknown as {
  facetDefinitions: FacetDefinition[]
  traps: { pair: string; originalRank: number; revisedRank: number }[]
  limitations: string[]
}

export const FACET_ORDER: FacetCode[] = matrix.facets

// Scores are the five facet subscores (0–10 each) added up, out of a possible
// 50 — a perfect ten on all five. A small contra-penalty trims the ~11% of
// cells where the pairing inverts the god's role; for every other cell the
// total is exactly the sum of the visible facet bars.
export const DISPLAY_CAP = 50
const LAMBDA = matrix.lambdaContra
function facetSum(f: FacetScores): number {
  return FACET_ORDER.reduce((s, code) => s + (f[code] ?? 0), 0)
}
export function computeScore(facets: FacetScores, contra = 0): number {
  const penalised = facetSum(facets) * Math.max(0, 1 - (LAMBDA * contra) / 10)
  return Math.round(penalised * 10) / 10
}

export const princesses: Princess[] = matrix.princesses
export const gods: God[] = matrix.gods
export const cells: Cell[] = matrix.cells.map((c) => ({
  ...c,
  score: computeScore(c.facets, c.contra),
}))
const newScoreByCell = new Map(cells.map((c) => [`${c.princessSlug}::${c.godSlug}`, c.score]))
export const facetDefinitions: FacetDefinition[] = method.facetDefinitions
export const limitations: string[] = method.limitations
export const scaleNote =
  'Each pairing is scored 0–10 on five facets; the total is simply their sum, out of a possible 50 — a perfect ten on all five. Nothing comes close: the strongest pairings land in the low forties. A small contra-penalty trims the handful of cells where a pairing inverts the god’s role.'

const facetDefByCode = new Map(facetDefinitions.map((d) => [d.code, d]))
export function facetName(code: FacetCode): string {
  return facetDefByCode.get(code)?.name ?? code
}
export function facetGloss(code: FacetCode): { god: string; princess: string } {
  const d = facetDefByCode.get(code)
  return { god: d?.god ?? '', princess: d?.princess ?? '' }
}

// Top domain tags for a god, pulled straight from the profile vectors. Used as
// spoiler-free hints on the reveal ledger — the god's sphere of power, minus the
// princess's name.
type ProfileMap = Record<string, Record<FacetCode, Record<string, number>>>
const profiles = profilesJson as unknown as {
  princesses: ProfileMap
  gods: ProfileMap
}
export function godDomainHints(godName: string, n = 3): string[] {
  const dom = profiles.gods?.[godName]?.DOM ?? {}
  return Object.entries(dom)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tag]) => tag.replace(/-/g, ' '))
}

// Tags that appear in BOTH the princess's and the god's profile for a facet —
// the exact overlaps that drove the cell, per facet. Same shape the appendix
// uses for the bonus.
export function getExactMatches(
  princessName: string,
  godName: string,
): Record<FacetCode, string[]> {
  const pr = profiles.princesses?.[princessName]
  const gd = profiles.gods?.[godName]
  const out = {} as Record<FacetCode, string[]>
  for (const code of FACET_ORDER) {
    const pTags = new Set(Object.keys(pr?.[code] ?? {}))
    out[code] = Object.keys(gd?.[code] ?? {}).filter((t) => pTags.has(t))
  }
  return out
}

// Re-score each pairing from the recomputed cell it points at (ranks are
// unchanged — the new score is monotonic in the old — so isFirstChoice /
// rankInRow stay valid).
function reScore(p: Pairing): Pairing {
  return { ...p, score: newScoreByCell.get(`${p.princessSlug}::${p.godSlug}`) ?? p.score }
}

// The authorial set is the canonical reading — the editor's thirteen. The
// algorithmic set is kept for the two places we want to show the seam.
export const authorial: PairingSet = {
  ...pairings.authorial,
  pairs: pairings.authorial.pairs.map(reScore),
}
export const algorithmic: PairingSet = {
  ...pairings.algorithmic,
  pairs: pairings.algorithmic.pairs.map(reScore),
}
export const canonicalPairings: Pairing[] = [...authorial.pairs].sort((a, b) => b.score - a.score)

const cellIndex = new Map<string, Cell>()
for (const c of cells) cellIndex.set(`${c.princessSlug}::${c.godSlug}`, c)
export function getCell(princessSlug: string, godSlug: string): Cell | undefined {
  return cellIndex.get(`${princessSlug}::${godSlug}`)
}

const pairingByPrincess = new Map(canonicalPairings.map((p) => [p.princessSlug, p]))
export function getPairing(princessSlug: string): Pairing | undefined {
  return pairingByPrincess.get(princessSlug)
}

// The algorithmic (Fable) assignment for a princess — the god the machine
// chose before the human overrode it. Differs from the canonical pick in the
// four override rows.
const algByPrincess = new Map(algorithmic.pairs.map((p) => [p.princessSlug, p]))
export function getAlgorithmicPairing(princessSlug: string): Pairing | undefined {
  return algByPrincess.get(princessSlug)
}

// The four manual overrides, as documented in the source. `from` is Fable's
// original assignment; `to` is the human's final call. Scores are read live
// from the recomputed cells so they track the current scale.
export interface Override {
  princess: string
  princessSlug: string
  from: { god: string; score: number }
  to: { god: string; score: number }
  rankInRow: number
}
const godSlugByName = new Map(gods.map((g) => [g.name, g.slug]))
function overrideScore(princessSlug: string, godName: string): number {
  const gs = godSlugByName.get(godName)
  return gs ? (newScoreByCell.get(`${princessSlug}::${gs}`) ?? 0) : 0
}
const overrideDefs = [
  { princess: 'Moana', princessSlug: 'moana', fromGod: 'Demeter', toGod: 'Poseidon', rankInRow: 2 },
  { princess: 'Jasmine', princessSlug: 'jasmine', fromGod: 'Zeus', toGod: 'Hera', rankInRow: 1 },
  { princess: 'Aurora', princessSlug: 'aurora', fromGod: 'Hera', toGod: 'Demeter', rankInRow: 4 },
  { princess: 'Snow White', princessSlug: 'snow-white', fromGod: 'Poseidon', toGod: 'Zeus', rankInRow: 9 },
]
export const overrides: Override[] = overrideDefs.map((o) => ({
  princess: o.princess,
  princessSlug: o.princessSlug,
  from: { god: o.fromGod, score: overrideScore(o.princessSlug, o.fromGod) },
  to: { god: o.toGod, score: overrideScore(o.princessSlug, o.toGod) },
  rankInRow: o.rankInRow,
}))
const overrideSlugs = new Set(overrides.map((o) => o.princessSlug))
export function isOverride(princessSlug: string): boolean {
  return overrideSlugs.has(princessSlug)
}
export function getOverride(princessSlug: string): Override | undefined {
  return overrides.find((o) => o.princessSlug === princessSlug)
}

// The bonus, off-matrix pairing: Elsa × Hades. appendix.json is effectively the
// model's own read of a cell that was never in the scored set.
export interface Appendix {
  pairing: string
  facets: FacetScores
  base: number
  score: number
  note: string
  exactMatches: Record<FacetCode, string[]>
  alternatives: { god: string; score: number }[]
  caveat: string
}
const appendixRaw = appendixJson as unknown as Appendix
export const appendix: Appendix = {
  ...appendixRaw,
  score: computeScore(appendixRaw.facets, 0),
}

const princessBySlug = new Map(princesses.map((p) => [p.slug, p]))
export function getPrincess(slug: string): Princess | undefined {
  return princessBySlug.get(slug)
}

// The princesses who scored NEXT-highest in a god's column — the plausible
// near-misses that make the landing guess a real challenge, rather than three
// random names you can dismiss on sight.
export function getNearMissPrincesses(
  godSlug: string,
  exceptPrincessSlug: string,
  n = 3,
): string[] {
  return cells
    .filter((c) => c.godSlug === godSlug && c.princessSlug !== exceptPrincessSlug)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((c) => princessBySlug.get(c.princessSlug)?.name ?? c.princessSlug)
}

// A whisper-quiet accent hue per god, grouped by domain (sovereignty, hearth/
// craft, earth/sea/wild, war, arts/love, liminal). Deliberately muted mid-tones
// so they only tint a background wash and the god's own mark — never compete
// with the one-gold palette. Hades (bonus) gets an underworld violet.
const GOD_ACCENTS: Record<string, string> = {
  zeus: '#c9a24a', // sky-gold
  hera: '#4f8a86', // peacock teal
  hestia: '#c07b43', // hearth amber
  hephaestus: '#b3702f', // forge ember
  demeter: '#8a9150', // grain olive
  poseidon: '#3f7d94', // sea
  artemis: '#6f8f7d', // moonlit sage
  ares: '#9a4b4b', // blood wine
  athena: '#7f8659', // owl / bronze-olive
  apollo: '#c9993c', // sun
  aphrodite: '#b06a78', // rose
  hermes: '#7f8a9a', // quicksilver
  dionysus: '#7a5a9a', // vine violet
  hades: '#6f5f95', // underworld
}
export function godAccent(slug: string): string {
  return GOD_ACCENTS[slug] ?? '#c8a25a'
}

// Presentation order for the god-first ledger, chapters and numbering. Now that
// players guess the whole board at once, a "gentle first" ordering no longer
// matters — so this follows the natural/canonical Olympian order instead.
export const revealOrder: string[] = [
  'zeus',
  'hera',
  'poseidon',
  'demeter',
  'athena',
  'apollo',
  'artemis',
  'ares',
  'aphrodite',
  'hephaestus',
  'hermes',
  'hestia',
  'dionysus',
]
const pairingByGod = new Map(authorial.pairs.map((p) => [p.godSlug, p]))
export const orderedPairings: Pairing[] = revealOrder
  .map((g) => pairingByGod.get(g))
  .filter((p): p is Pairing => Boolean(p))

// Chapters are addressed by GOD slug — the god leads. This maps a god slug to
// its canonical pairing (and thence the princess and MDX content).
export function getPairingByGod(godSlug: string): Pairing | undefined {
  return pairingByGod.get(godSlug)
}

// The algorithmic (Fable) assignment keyed by god — the princess the Hungarian
// optimum gave this god before any human override.
const algByGod = new Map(algorithmic.pairs.map((p) => [p.godSlug, p]))
export function getAlgorithmicPairingByGod(godSlug: string): Pairing | undefined {
  return algByGod.get(godSlug)
}
// A god is an override target when the human reassigned it — i.e. the algorithm
// gave it a different princess than the canonical mapping does.
export function isOverrideGod(godSlug: string): boolean {
  const alg = algByGod.get(godSlug)
  const canon = pairingByGod.get(godSlug)
  return !!alg && !!canon && alg.princessSlug !== canon.princessSlug
}

// Matrix axis order — DISTINCT from the reveal order. Gods are grouped by
// domain so kindred deities sit together (sovereignty → hearth/craft →
// earth/sea/wild → war → arts/love → liminal). Because both axes share this one
// permutation, the canonical pairings still fall on the diagonal; and since a
// princess's near-miss god is usually a kindred one, the hot off-diagonal cells
// now cluster right beside the diagonal — a block-diagonal, "clustery" heatmap.
export const matrixOrder: string[] = [
  'zeus', // sovereignty
  'hera',
  'hestia', // hearth / craft (Hestia beside Hephaestus)
  'hephaestus',
  'demeter', // earth / sea / wild
  'poseidon',
  'artemis',
  'ares', // war
  'athena',
  'apollo', // arts / love
  'aphrodite',
  'hermes', // liminal (Hermes beside Dionysus)
  'dionysus',
]
const godBySlug = new Map(gods.map((g) => [g.slug, g]))
export const orderedGods: God[] = matrixOrder
  .map((s) => godBySlug.get(s))
  .filter((g): g is God => Boolean(g))
// Rows follow the same order via each god's canonical princess, keeping the
// canonical cells on the diagonal.
export const orderedPrincesses: Princess[] = matrixOrder
  .map((s) => pairingByGod.get(s))
  .filter((p): p is Pairing => Boolean(p))
  .map((p) => princessBySlug.get(p.princessSlug))
  .filter((p): p is Princess => Boolean(p))

// Chapter order and prev/next follow the reveal order above, keyed by god slug.
export const chapterSlugs: string[] = orderedPairings.map((p) => p.godSlug)

export function chapterNeighbors(godSlug: string): {
  index: number
  prev: Pairing | null
  next: Pairing | null
} {
  const i = chapterSlugs.indexOf(godSlug)
  return {
    index: i,
    prev: i > 0 ? orderedPairings[i - 1] : null,
    next: i >= 0 && i < orderedPairings.length - 1 ? orderedPairings[i + 1] : null,
  }
}

// --- Scales -----------------------------------------------------------------
// A single warm ramp: cold ash at zero, gold at the cap. Used by both the
// heatmap cells and the facet bars so the whole site reads on one temperature.

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
function mix(c1: [number, number, number], c2: [number, number, number], t: number): string {
  const r = Math.round(lerp(c1[0], c2[0], t))
  const g = Math.round(lerp(c1[1], c2[1], t))
  const b = Math.round(lerp(c1[2], c2[2], t))
  return `rgb(${r} ${g} ${b})`
}

const ASH: [number, number, number] = [26, 24, 30] // near the ground colour
const EMBER: [number, number, number] = [122, 60, 54] // wine/ember midpoint
const GOLD: [number, number, number] = [200, 162, 90] // brand gold

// score 0..DISPLAY_CAP -> colour. Two-stop ramp through ember so mid scores
// read as heat rather than mud.
export function scoreColor(score: number): string {
  const t = Math.max(0, Math.min(1, score / DISPLAY_CAP))
  const eased = Math.pow(t, 0.85) // matches the matrix compression exponent
  if (eased < 0.5) return mix(ASH, EMBER, eased / 0.5)
  return mix(EMBER, GOLD, (eased - 0.5) / 0.5)
}

// A readable ink colour to sit on top of a given score cell.
export function scoreInk(score: number): string {
  return score / DISPLAY_CAP > 0.62 ? '#1a1206' : '#e9e3d6'
}

// facet 0..10 -> colour on the same ramp (facets top out well below the cap,
// so we stretch them across the full ramp for legibility).
export function facetColor(value: number): string {
  const t = Math.max(0, Math.min(1, value / 10))
  if (t < 0.5) return mix(ASH, EMBER, t / 0.5)
  return mix(EMBER, GOLD, (t - 0.5) / 0.5)
}
