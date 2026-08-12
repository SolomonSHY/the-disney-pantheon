'use client'

import { useSyncExternalStore } from 'react'

// A tiny sessionStorage-backed store of which gods have been unmasked, shared by
// the landing ledger and every chapter so "unmask them all" progress (and the
// candidate scoreboard) carries across the whole visit. Keyed by god slug; the
// bonus uses the key 'hades'.
const KEY = 'pantheon:revealed'
type Listener = () => void
const listeners = new Set<Listener>()
let cache: string[] | null = null

function load(): string[] {
  if (cache) return cache
  if (typeof window === 'undefined') return (cache = [])
  try {
    cache = JSON.parse(sessionStorage.getItem(KEY) || '[]')
  } catch {
    cache = []
  }
  return cache as string[]
}

function save(next: string[]) {
  cache = next
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* ignore quota / disabled storage */
    }
  }
  listeners.forEach((l) => l())
}

export function revealGod(slug: string) {
  const cur = load()
  if (cur.includes(slug)) return
  save([...cur, slug].sort())
}

export function hideGod(slug: string) {
  const cur = load()
  if (cur.includes(slug)) save(cur.filter((s) => s !== slug))
  // Let the row be replayed: forget any recorded guess for it too.
  const g = gload()
  if (g[slug]) {
    const { [slug]: _drop, ...rest } = g
    gsave(rest)
  }
}

export function revealMany(slugs: string[]) {
  const set = new Set([...load(), ...slugs])
  save([...set].sort())
}

export function resetReveals() {
  save([])
  gsave({})
  psave({})
}

// ── Guess outcomes ─────────────────────────────────────────────────────────
// A parallel store recording, per god slug, whether the player's guess was
// right or wrong. Drives the running "N correct" score. Cleared on reset.
const GKEY = 'pantheon:guesses'
export type Outcome = 'correct' | 'wrong'
let gcache: Record<string, Outcome> | null = null
const glisteners = new Set<Listener>()

function gload(): Record<string, Outcome> {
  if (gcache) return gcache
  if (typeof window === 'undefined') return (gcache = {})
  try {
    gcache = JSON.parse(sessionStorage.getItem(GKEY) || '{}')
  } catch {
    gcache = {}
  }
  return gcache as Record<string, Outcome>
}

function gsave(next: Record<string, Outcome>) {
  gcache = next
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(GKEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }
  glisteners.forEach((l) => l())
}

/** Record a guess outcome and unmask the god in one step. */
export function recordGuess(slug: string, correct: boolean) {
  gsave({ ...gload(), [slug]: correct ? 'correct' : 'wrong' })
  revealGod(slug)
}

function gsubscribe(l: Listener) {
  glisteners.add(l)
  return () => {
    glisteners.delete(l)
  }
}
function ggetSnapshot(): string {
  return JSON.stringify(gload())
}
function ggetServerSnapshot(): string {
  return '{}'
}

/** Reactive map of god slug → guess outcome. */
export function useGuesses(): Record<string, Outcome> {
  const snap = useSyncExternalStore(gsubscribe, ggetSnapshot, ggetServerSnapshot)
  return JSON.parse(snap) as Record<string, Outcome>
}

// ── Pending guesses ────────────────────────────────────────────────────────
// The player's picks BEFORE the batch reveal, so earlier correct answers don't
// leak hints for later rows. Keyed by god slug → princess NAME. Cleared on
// reset and as each pick is committed to a scored outcome.
const PKEY = 'pantheon:pending'
let pcache: Record<string, string> | null = null
const plisteners = new Set<Listener>()

function pload(): Record<string, string> {
  if (pcache) return pcache
  if (typeof window === 'undefined') return (pcache = {})
  try {
    pcache = JSON.parse(sessionStorage.getItem(PKEY) || '{}')
  } catch {
    pcache = {}
  }
  return pcache as Record<string, string>
}

function psave(next: Record<string, string>) {
  pcache = next
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(PKEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }
  plisteners.forEach((l) => l())
}

export function setPending(slug: string, princessName: string) {
  psave({ ...pload(), [slug]: princessName })
}
export function clearPending(slug: string) {
  const cur = pload()
  if (!cur[slug]) return
  const { [slug]: _drop, ...rest } = cur
  psave(rest)
}

function psubscribe(l: Listener) {
  plisteners.add(l)
  return () => {
    plisteners.delete(l)
  }
}
function pgetSnapshot(): string {
  return JSON.stringify(pload())
}
function pgetServerSnapshot(): string {
  return '{}'
}

/** Reactive map of god slug → the player's pending (uncommitted) princess pick. */
export function usePending(): Record<string, string> {
  const snap = useSyncExternalStore(psubscribe, pgetSnapshot, pgetServerSnapshot)
  return JSON.parse(snap) as Record<string, string>
}

function subscribe(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
function getSnapshot(): string {
  return load().join(',')
}
function getServerSnapshot(): string {
  return ''
}

/** Reactive set of revealed god slugs. SSR renders empty (masked), then syncs. */
export function useRevealed(): Set<string> {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return new Set(snap ? snap.split(',') : [])
}
