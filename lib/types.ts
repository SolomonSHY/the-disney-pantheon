export type FacetCode = 'DOM' | 'ROL' | 'ARC' | 'ICO' | 'TMP'

export type FacetScores = Record<FacetCode, number>

export interface Princess {
  name: string
  slug: string
  film: string
  year: number
  info: number
}

export interface God {
  name: string
  slug: string
}

export interface Cell {
  princess: string
  princessSlug: string
  god: string
  godSlug: string
  score: number
  rankInRow: number
  rankInColumn: number
  facets: FacetScores
  contra: number
  contraNote: string | null
  base: number
}

export interface Matrix {
  facets: FacetCode[]
  weights: Record<FacetCode, number>
  lambdaContra: number
  displayCap: number
  compressionExponent: number
  scaleNote: string
  princesses: Princess[]
  gods: God[]
  cells: Cell[]
}

export interface Pairing {
  princess: string
  princessSlug: string
  god: string
  godSlug: string
  score: number
  rankInRow: number
  facets: FacetScores
  isFirstChoice: boolean
}

export interface PairingSet {
  total: number
  floor: number
  firstChoices: number
  overrides?: string[]
  note?: string
  pairs: Pairing[]
}

export interface FacetDefinition {
  code: FacetCode
  name: string
  god: string
  princess: string
}
