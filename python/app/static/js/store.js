/* Port of lib/revealStore.ts and lib/artPref.ts.
 *
 * React's useSyncExternalStore becomes a plain subscribe/notify pair; the
 * storage keys, the one-way art opt-in and the reset semantics are unchanged, so
 * a visitor's progress reads the same as the Next.js version's.
 */
window.Pantheon = (function () {
  'use strict'

  // ── revealStore: which gods have been unmasked ──────────────────────────
  // A tiny sessionStorage-backed store shared by the landing ledger and every
  // chapter, so "unmask them all" progress (and the candidate scoreboard)
  // carries across the whole visit. Keyed by god slug; the bonus uses 'hades'.
  var KEY = 'pantheon:revealed'
  var GKEY = 'pantheon:guesses'
  var PKEY = 'pantheon:pending'
  var ART_KEY = 'pantheon:revealArt'

  var listeners = new Set()

  function notify() {
    listeners.forEach(function (l) {
      l()
    })
  }

  /** Subscribe to every store change. Returns an unsubscribe function. */
  function subscribe(l) {
    listeners.add(l)
    window.addEventListener('storage', l)
    return function () {
      listeners.delete(l)
      window.removeEventListener('storage', l)
    }
  }

  function readJSON(store, key, fallback) {
    try {
      var raw = store.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch (e) {
      return fallback
    }
  }

  function writeJSON(store, key, value) {
    try {
      store.setItem(key, JSON.stringify(value))
    } catch (e) {
      /* ignore quota / disabled storage */
    }
  }

  function revealedList() {
    var v = readJSON(sessionStorage, KEY, [])
    return Array.isArray(v) ? v : []
  }

  /** Set of revealed god slugs. */
  function revealed() {
    return new Set(revealedList())
  }

  function saveRevealed(next) {
    writeJSON(sessionStorage, KEY, next)
    notify()
  }

  function revealGod(slug) {
    var cur = revealedList()
    if (cur.indexOf(slug) !== -1) return
    saveRevealed(cur.concat([slug]).sort())
  }

  function hideGod(slug) {
    var cur = revealedList()
    if (cur.indexOf(slug) !== -1) {
      writeJSON(
        sessionStorage,
        KEY,
        cur.filter(function (s) {
          return s !== slug
        }),
      )
    }
    // Let the row be replayed: forget any recorded guess for it too.
    var g = guesses()
    if (g[slug]) {
      delete g[slug]
      writeJSON(sessionStorage, GKEY, g)
    }
    notify()
  }

  function revealMany(slugs) {
    var set = new Set(revealedList())
    slugs.forEach(function (s) {
      set.add(s)
    })
    saveRevealed(Array.from(set).sort())
  }

  function resetReveals() {
    writeJSON(sessionStorage, KEY, [])
    writeJSON(sessionStorage, GKEY, {})
    writeJSON(sessionStorage, PKEY, {})
    notify()
  }

  // ── Guess outcomes ──────────────────────────────────────────────────────
  // A parallel store recording, per god slug, whether the player's guess was
  // right ('correct') or wrong. Drives the running "N correct" score. Cleared
  // on reset.
  function guesses() {
    var v = readJSON(sessionStorage, GKEY, {})
    return v && typeof v === 'object' ? v : {}
  }

  /** Record a guess outcome and unmask the god in one step. */
  function recordGuess(slug, correct) {
    var g = guesses()
    g[slug] = correct ? 'correct' : 'wrong'
    writeJSON(sessionStorage, GKEY, g)
    revealGod(slug)
  }

  // ── Pending guesses ─────────────────────────────────────────────────────
  // The player's picks BEFORE the batch reveal, so earlier correct answers
  // don't leak hints for later rows. Keyed by god slug -> princess NAME.
  // Cleared on reset and as each pick is committed to a scored outcome.
  function pending() {
    var v = readJSON(sessionStorage, PKEY, {})
    return v && typeof v === 'object' ? v : {}
  }

  function setPending(slug, princessName) {
    var p = pending()
    p[slug] = princessName
    writeJSON(sessionStorage, PKEY, p)
    notify()
  }

  function clearPending(slug) {
    var p = pending()
    if (!p[slug]) return
    delete p[slug]
    writeJSON(sessionStorage, PKEY, p)
    notify()
  }

  // ── artPref: the AI pairing portraits ───────────────────────────────────
  // Hidden by DEFAULT. A visitor who wants to see them opts in once — a
  // one-way, persistent, site-wide choice — after which the portraits show on
  // every god page (and the bonus) and the reveal control vanishes. Stored in
  // localStorage so the choice outlives the tab and future visits.
  function artRevealed() {
    try {
      return localStorage.getItem(ART_KEY) === '1'
    } catch (e) {
      return false
    }
  }

  /** Opt in to the AI pairing portraits everywhere. One-way. */
  function revealArt() {
    try {
      localStorage.setItem(ART_KEY, '1')
    } catch (e) {
      /* ignore quota / disabled storage */
    }
    notify()
  }

  return {
    subscribe: subscribe,
    revealed: revealed,
    revealGod: revealGod,
    hideGod: hideGod,
    revealMany: revealMany,
    resetReveals: resetReveals,
    guesses: guesses,
    recordGuess: recordGuess,
    pending: pending,
    setPending: setPending,
    clearPending: clearPending,
    artRevealed: artRevealed,
    revealArt: revealArt,
  }
})()
