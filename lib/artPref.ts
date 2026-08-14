'use client'

import { useSyncExternalStore } from 'react'

// A one-way, persistent preference: once a visitor hides the AI-generated pairing
// portraits, they stay hidden on every god page (and the bonus) across the whole
// site — and across future visits. Stored in localStorage so it outlives the tab.
const KEY = 'pantheon:hideArt'
type Listener = () => void
const listeners = new Set<Listener>()

/** Hide the AI pairing portraits everywhere. One-way (no un-hide control). */
export function hideArt() {
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

/** Reactive: true once the visitor has chosen to hide the AI portraits. */
export function useArtHidden(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
