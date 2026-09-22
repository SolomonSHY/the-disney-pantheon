/* Port of components/RevealLedger.tsx.
 *
 * The React version re-rendered from three hooks (revealed / guesses / pending)
 * plus local state for the open picker and the flash animation. Here `render()`
 * plays the same part: it reads the store and switches each row between the four
 * states the template already rendered (hints -> picking -> pending -> open).
 */
;(function () {
  'use strict'

  var root = document.querySelector('[data-ledger]')
  if (!root) return

  var S = window.Pantheon
  var ALL_PRINCESSES = JSON.parse(
    document.getElementById('ledger-data').textContent,
  ).princesses

  var rows = Array.prototype.slice.call(root.querySelectorAll('[data-row]'))
  var bonusEl = root.querySelector('[data-bonus]')
  var bonusHit = bonusEl && bonusEl.querySelector('[data-bonus-hit]')

  var items = rows.map(function (el) {
    return {
      el: el,
      godSlug: el.dataset.godSlug,
      god: el.dataset.god,
      princess: el.dataset.princess,
      index: Number(el.dataset.index),
      distractors: JSON.parse(el.dataset.distractors),
    }
  })

  // Rows with an open picker, and rows revealed *this interaction* — only the
  // latter get the flashy animation (rows already open from storage stay calm).
  var options = {} // god slug -> string[]
  var flashed = new Set()
  var sharedAt = 0

  function shuffle(arr) {
    var a = arr.slice()
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var t = a[i]
      a[i] = a[j]
      a[j] = t
    }
    return a
  }

  function startGuess(it) {
    var revealed = S.revealed()
    var pending = S.pending()
    // Princesses already spent on another god are off the table — each can only
    // be used once (it's a one-to-one matching).
    var usedElsewhere = new Set(
      items
        .filter(function (i) {
          return (
            i.godSlug !== it.godSlug && !revealed.has(i.godSlug) && pending[i.godSlug]
          )
        })
        .map(function (i) {
          return pending[i.godSlug]
        }),
    )
    var canUseCorrect = !usedElsewhere.has(it.princess)
    // The god's next-best princesses make the tempting wrong answers; fill with
    // other unused names if needed.
    var nearMiss = it.distractors.filter(function (n) {
      return n !== it.princess && !usedElsewhere.has(n)
    })
    var filler = shuffle(
      ALL_PRINCESSES.filter(function (n) {
        return (
          n !== it.princess && !usedElsewhere.has(n) && nearMiss.indexOf(n) === -1
        )
      }),
    )
    var pool = nearMiss.concat(filler)
    var opts = canUseCorrect
      ? [it.princess].concat(pool.slice(0, 3))
      : pool.slice(0, 4)
    options[it.godSlug] = shuffle(opts)
    render()
  }

  /** Lock in a pick WITHOUT revealing — the answer waits for the batch reveal. */
  function pick(it, name) {
    delete options[it.godSlug]
    S.setPending(it.godSlug, name)
  }

  /** Unmask a single god whose guess is locked in (commit + score just that one). */
  function unmaskOne(it) {
    var pickName = S.pending()[it.godSlug]
    if (!pickName) return
    flashed.add(it.godSlug)
    S.recordGuess(it.godSlug, pickName === it.princess)
    S.clearPending(it.godSlug)
  }

  /** Unmask ONLY the gods with a pending guess — commit + score just those,
      leaving the un-guessed gods still masked. */
  function unmaskGuessed() {
    var revealed = S.revealed()
    var pending = S.pending()
    items.forEach(function (it) {
      if (revealed.has(it.godSlug)) return
      var pickName = pending[it.godSlug]
      if (pickName) {
        flashed.add(it.godSlug)
        S.recordGuess(it.godSlug, pickName === it.princess)
        S.clearPending(it.godSlug)
      }
    })
  }

  /** Unmask everything still hidden (any pending guesses score; the rest just
      reveal), plus the bonus. */
  function unmaskAll() {
    var revealed = S.revealed()
    var pending = S.pending()
    var fresh = items
      .filter(function (it) {
        return !revealed.has(it.godSlug)
      })
      .map(function (it) {
        return it.godSlug
      })
    items.forEach(function (it) {
      if (revealed.has(it.godSlug)) return
      var pickName = pending[it.godSlug]
      if (pickName) {
        S.recordGuess(it.godSlug, pickName === it.princess)
        S.clearPending(it.godSlug)
      }
    })
    var bonusFresh = bonusEl && !revealed.has('hades') ? ['hades'] : []
    fresh.concat(bonusFresh).forEach(function (s) {
      flashed.add(s)
    })
    S.revealMany(
      items
        .map(function (i) {
          return i.godSlug
        })
        .concat(bonusFresh),
    )
  }

  /** Bonus (Hades) stays an independent one-off reveal. */
  function revealBonus() {
    flashed.add('hades')
    S.revealGod('hades')
  }

  function doShare() {
    var guesses = S.guesses()
    var squares = items
      .map(function (it) {
        var o = guesses[it.godSlug]
        return o === 'correct' ? '🟩' : o === 'wrong' ? '🟥' : '⬛'
      })
      .join('')
    var guessedCount = items.filter(function (it) {
      return guesses[it.godSlug]
    }).length
    var correctCount = items.filter(function (it) {
      return guesses[it.godSlug] === 'correct'
    }).length
    var scoreLine =
      guessedCount > 0
        ? 'Guessed ' + correctCount + '/' + guessedCount + ' right'
        : 'All thirteen unmasked'
    var text =
      'The Disney Princess Pantheon 🏛️\n' +
      squares +
      '\n' +
      scoreLine +
      '\n' +
      window.location.origin
    if (navigator.share) {
      navigator.share({ text: text }).catch(function () {
        copyShare(text)
      })
      return
    }
    copyShare(text)
  }

  function copyShare(text) {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(text).then(function () {
      sharedAt = Date.now()
      render()
      setTimeout(function () {
        sharedAt = 0
        render()
      }, 2000)
    }, function () {
      /* ignore */
    })
  }

  // --- rendering ------------------------------------------------------------

  function setState(container, name) {
    container.querySelectorAll('[data-state]').forEach(function (el) {
      el.hidden = el.dataset.state !== name
    })
  }

  function render() {
    var revealed = S.revealed()
    var guesses = S.guesses()
    var pending = S.pending()

    var coreRevealed = items.filter(function (i) {
      return revealed.has(i.godSlug)
    }).length
    var complete = coreRevealed === items.length
    var pendingCount = items.filter(function (i) {
      return !revealed.has(i.godSlug) && pending[i.godSlug]
    }).length
    var guessedCount = items.filter(function (i) {
      return guesses[i.godSlug]
    }).length
    var correctCount = items.filter(function (i) {
      return guesses[i.godSlug] === 'correct'
    }).length
    var bonusOpen = revealed.has('hades')

    // Which princesses are "spent" — by a locked-in guess while playing, or by
    // the real pairing once revealed — mapped to the god that used them. Drives
    // both the candidate-set strike-through and the double-use guard.
    var usedByName = new Map()
    var usedByGodSlug = new Map()
    items.forEach(function (it) {
      if (revealed.has(it.godSlug)) {
        usedByName.set(it.princess, it.god)
        usedByGodSlug.set(it.princess, it.godSlug)
      } else if (pending[it.godSlug]) {
        usedByName.set(pending[it.godSlug], it.god)
        usedByGodSlug.set(pending[it.godSlug], it.godSlug)
      }
    })

    // Completion banner — the payoff once the whole board is unmasked.
    var completeEl = root.querySelector('[data-complete]')
    completeEl.hidden = !complete
    root.querySelector('[data-skip]').hidden = complete
    root.querySelector('[data-controls]').hidden = complete
    if (complete) {
      var line = completeEl.querySelector('[data-score-line]')
      line.innerHTML =
        guessedCount > 0
          ? 'You guessed <span class="text-goldsoft">' +
            correctCount +
            '</span> of ' +
            guessedCount +
            ' right'
          : 'All thirteen unmasked'
      completeEl.querySelector('[data-share]').textContent =
        sharedAt > 0 ? 'Copied to clipboard ✓' : 'Share your result'
    }

    // Candidate set — ticked off as matched.
    root.querySelectorAll('[data-candidate]').forEach(function (li) {
      var god = usedByName.get(li.dataset.candidate)
      li.classList.toggle('text-faint', !!god)
      li.classList.toggle('text-ink/85', !god)
      var icon = li.querySelector('svg')
      if (icon) {
        icon.classList.toggle('text-faint', !!god)
        icon.classList.toggle('text-muted', !god)
      }
      var name = li.querySelector('[data-candidate-name]')
      name.classList.toggle('line-through', !!god)
      name.classList.toggle('decoration-wine/50', !!god)
      var badge = li.querySelector('[data-candidate-god]')
      badge.hidden = !god
      badge.textContent = god || ''
    })
    root.querySelector('[data-available]').textContent =
      ALL_PRINCESSES.length - usedByName.size + ' still available'

    // Status + controls.
    var status = root.querySelector('[data-status]')
    if (coreRevealed === 0 && pendingCount === 0) {
      status.innerHTML = '<span>Guess the thirteen</span>'
    } else {
      status.innerHTML =
        '<span>' +
        coreRevealed +
        ' / ' +
        items.length +
        ' unmasked</span>' +
        (pendingCount > 0
          ? '<span class="ml-3 text-goldsoft">· ' + pendingCount + ' guessed</span>'
          : '')
    }
    root.querySelector('[data-controls] [data-reset]').hidden = !(
      coreRevealed > 0 ||
      pendingCount > 0 ||
      bonusOpen
    )
    var bulk = root.querySelector('[data-unmask-bulk]')
    bulk.textContent =
      pendingCount > 0 ? 'Unmask guessed (' + pendingCount + ')' : 'Unmask all'
    bulk.dataset.mode = pendingCount > 0 ? 'guessed' : 'all'

    // The thirteen rows.
    items.forEach(function (it) {
      var open = revealed.has(it.godSlug)
      var picking = !open && !!options[it.godSlug]
      var pend = !open && !picking ? pending[it.godSlug] : undefined
      var flashOn = flashed.has(it.godSlug)
      var outcome = guesses[it.godSlug]
      var hit = it.el.querySelector('[data-hit]')
      var detail = it.el.querySelector('[data-detail]')

      it.el.style.setProperty(
        '--flash-delay',
        flashOn ? it.index * 0.06 + 's' : '',
      )

      var nameWrap = it.el.querySelector('[data-revealed-name]')
      nameWrap.hidden = !open
      var nameEl = it.el.querySelector('[data-princess-name]')
      nameEl.classList.toggle('reveal-name-flash', open && flashOn)

      var outcomeEl = it.el.querySelector('[data-outcome]')
      outcomeEl.hidden = !(open && outcome)
      if (open && outcome) {
        outcomeEl.textContent = outcome === 'correct' ? '✓ right' : '✗ wrong'
        outcomeEl.classList.toggle('text-goldsoft', outcome === 'correct')
        outcomeEl.classList.toggle('text-wine', outcome !== 'correct')
      }

      setState(detail, open ? 'open' : picking ? 'picking' : pend ? 'pending' : 'hints')

      if (picking) {
        renderOptions(it, usedByGodSlug)
      } else if (pend) {
        it.el.querySelector('[data-pending-name]').textContent = pend
      }

      // Row click target: masked -> guess; locked-in guess -> unmask.
      var interactive = !open && !picking
      hit.classList.toggle('cursor-pointer', interactive)
      if (interactive) {
        hit.setAttribute('role', 'button')
        hit.setAttribute('tabindex', '0')
        hit.setAttribute(
          'aria-label',
          pend ? 'Unmask ' + it.god : 'Guess which princess is ' + it.god,
        )
      } else {
        hit.removeAttribute('role')
        hit.removeAttribute('tabindex')
        hit.removeAttribute('aria-label')
      }

      var guessAff = it.el.querySelector('[data-affordance="guess"]')
      var unmaskAff = it.el.querySelector('[data-affordance="unmask"]')
      guessAff.hidden = open || picking || !!pend
      unmaskAff.hidden = open || picking || !pend
    })

    // The fourteenth.
    if (bonusEl) {
      bonusEl.querySelector('[data-revealed-name]').hidden = !bonusOpen
      bonusEl
        .querySelector('[data-princess-name]')
        .classList.toggle('reveal-name-flash', bonusOpen && flashed.has('hades'))
      setState(bonusHit, bonusOpen ? 'open' : 'hints')
      bonusHit.querySelector('[data-affordance="unmask"]').hidden = bonusOpen
      bonusHit.classList.toggle('cursor-pointer', !bonusOpen)
      if (bonusOpen) {
        bonusHit.removeAttribute('role')
        bonusHit.removeAttribute('tabindex')
        bonusHit.removeAttribute('aria-label')
      } else {
        bonusHit.setAttribute('role', 'button')
        bonusHit.setAttribute('tabindex', '0')
        bonusHit.setAttribute('aria-label', 'Unmask who Hades is')
      }
    }
  }

  /** The options actually shown for an open picker: the generated set minus any
      a different god has since claimed, then backfilled to four (correct answer,
      near-misses, then any remaining unused) so a full slate shows when possible. */
  function renderOptions(it, usedByGodSlug) {
    function usedByOther(name) {
      var g = usedByGodSlug.get(name)
      return !!g && g !== it.godSlug
    }
    var shown = (options[it.godSlug] || []).filter(function (n) {
      return !usedByOther(n)
    })
    var backfill = [it.princess].concat(it.distractors, ALL_PRINCESSES)
    for (var i = 0; i < backfill.length && shown.length < 4; i++) {
      var name = backfill[i]
      if (shown.indexOf(name) !== -1 || usedByOther(name)) continue
      shown.push(name)
    }

    var host = it.el.querySelector('[data-options]')
    host.textContent = ''
    shown.forEach(function (name) {
      var b = document.createElement('button')
      b.type = 'button'
      b.className =
        'rounded-full border border-white/15 px-3.5 py-1 font-serif text-base ' +
        'text-ink/90 transition-colors hover:border-gold/50 hover:bg-gold/[0.06] ' +
        'hover:text-goldsoft'
      b.textContent = name
      b.addEventListener('click', function (e) {
        e.stopPropagation()
        pick(it, name)
      })
      host.appendChild(b)
    })
  }

  // --- wiring ---------------------------------------------------------------

  items.forEach(function (it) {
    var hit = it.el.querySelector('[data-hit]')
    function activate() {
      if (S.revealed().has(it.godSlug) || options[it.godSlug]) return
      if (S.pending()[it.godSlug]) unmaskOne(it)
      else startGuess(it)
    }
    hit.addEventListener('click', function (e) {
      // Let the "Read the analysis" link and the inline buttons act for
      // themselves.
      if (e.target.closest('a, button')) return
      activate()
    })
    hit.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return
      if (e.target !== hit) return
      e.preventDefault()
      activate()
    })
    it.el.querySelector('[data-cancel]').addEventListener('click', function (e) {
      e.stopPropagation()
      delete options[it.godSlug]
      S.clearPending(it.godSlug)
      render()
    })
    it.el.querySelector('[data-change]').addEventListener('click', function (e) {
      e.stopPropagation()
      startGuess(it)
    })
  })

  if (bonusHit) {
    bonusHit.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return
      if (!S.revealed().has('hades')) revealBonus()
    })
    bonusHit.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return
      if (e.target !== bonusHit) return
      e.preventDefault()
      if (!S.revealed().has('hades')) revealBonus()
    })
    bonusEl.querySelector('[data-hide]').addEventListener('click', function (e) {
      e.stopPropagation()
      S.hideGod('hades')
    })
  }

  root.querySelectorAll('[data-reset]').forEach(function (b) {
    b.addEventListener('click', function () {
      options = {}
      flashed = new Set()
      S.resetReveals()
    })
  })
  root.querySelector('[data-unmask-bulk]').addEventListener('click', function (e) {
    if (e.currentTarget.dataset.mode === 'guessed') unmaskGuessed()
    else unmaskAll()
  })
  root.querySelector('[data-share]').addEventListener('click', doShare)

  S.subscribe(render)
  render()
})()
