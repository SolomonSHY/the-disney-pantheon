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
  if (!cur.includes(slug)) return
  save(cur.filter((s) => s !== slug))
}

export function revealMany(slugs: string[]) {
  const set = new Set([...load(), ...slugs])
  save([...set].sort())
}

export function resetReveals() {
  save([])
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
