'use client'

import { useSyncExternalStore } from 'react'

// AI-generated pairing portraits are hidden by DEFAULT. A visitor who wants to see
// them opts in once — a one-way, persistent, site-wide choice — after which the
// portraits show on every god page (and the bonus) and the reveal control vanishes.
// Stored in localStorage so the choice outlives the tab and future visits.
const KEY = 'pantheon:revealArt'
type Listener = () => void
const listeners = new Set<Listener>()

/** Opt in to the AI pairing portraits everywhere. One-way. */
export function revealArt() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* ignore quota / disabled storage */
    }
  }
  listeners.forEach((l) => l())
}

function subscribe(l: Listener) {
  listeners.add(l)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) l()
  }
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(l)
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
  }
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function getServerSnapshot(): boolean {
  return false
}

/** Reactive: true once the visitor has opted in to see the AI portraits. */
export function useArtRevealed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
