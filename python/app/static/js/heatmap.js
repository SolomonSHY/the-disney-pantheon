/* Port of the interactive half of components/Heatmap.tsx: the hover/focus card
 * and the spoiler-safe princess-name toggle. The 169 cells themselves are
 * rendered server-side. */
;(function () {
  'use strict'

  var root = document.querySelector('[data-heatmap]')
  if (!root) return

  var S = window.Pantheon
  var CARD_W = 320

  var card = root.querySelector('[data-card]')
  var table = root.querySelector('[data-grid]')
  var toggle = root.querySelector('[data-names-toggle]')
  var canonicalKeys = JSON.parse(root.dataset.canonicalKeys)
  var canonicalGodSlugs = canonicalKeys.map(function (k) {
    return k.split('::')[1]
  })

  // null until the reader flips it by hand; otherwise it follows whether all
  // thirteen have been unmasked elsewhere.
  var manualNames = null
  var activeCell = null

  function allRevealed() {
    var revealed = S.revealed()
    return (
      canonicalGodSlugs.length > 0 &&
      canonicalGodSlugs.every(function (gs) {
        return revealed.has(gs)
      })
    )
  }

  function namesShown() {
    return manualNames === null ? allRevealed() : manualNames
  }

  // The facet-bar ramp from lib/data.ts — ash -> ember -> gold, the same one the
  // server uses for the grid itself.
  var ASH = [26, 24, 30]
  var EMBER = [122, 60, 54]
  var GOLD = [200, 162, 90]

  function mix(c1, c2, t) {
    var r = Math.round(c1[0] + (c2[0] - c1[0]) * t)
    var g = Math.round(c1[1] + (c2[1] - c1[1]) * t)
    var b = Math.round(c1[2] + (c2[2] - c1[2]) * t)
    return 'rgb(' + r + ' ' + g + ' ' + b + ')'
  }

  function facetColor(value) {
    var t = Math.max(0, Math.min(1, value / 10))
    if (t < 0.5) return mix(ASH, EMBER, t / 0.5)
    return mix(EMBER, GOLD, (t - 0.5) / 0.5)
  }

  function renderNames() {
    var shown = namesShown()
    toggle.textContent = shown ? 'Hide princesses' : 'Unmask princesses'
    root.querySelectorAll('[data-princess-head]').forEach(function (el) {
      el.textContent = shown ? el.dataset.princessHead : '· · ·'
      el.classList.toggle('text-muted', shown)
      el.classList.toggle('text-faint', !shown)
    })
    root.querySelectorAll('[data-cell]').forEach(function (el) {
      el.setAttribute(
        'aria-label',
        (shown ? el.dataset.princess : 'hidden princess') +
          ' × ' +
          el.dataset.god +
          ': ' +
          el.dataset.score,
      )
    })
    if (activeCell) fillCard(activeCell)
  }

  function fillCard(el) {
    var shown = namesShown()
    var princess = card.querySelector('[data-card-princess]')
    princess.textContent = shown ? el.dataset.princess : '· · ·'
    princess.classList.toggle('text-faint', !shown)

    card.querySelector('[data-card-god]').textContent = el.dataset.god
    card.querySelector('[data-card-score]').textContent = el.dataset.score

    var facets = JSON.parse(el.dataset.facets)
    card.querySelectorAll('[data-facet]').forEach(function (row) {
      var v = facets[row.dataset.facet] || 0
      var bar = row.querySelector('[data-bar]')
      bar.style.width = (v / 10) * 100 + '%'
      bar.style.background = facetColor(v)
      row.querySelector('[data-value]').textContent = v.toFixed(1)
    })

    card.querySelector('[data-card-ranks]').textContent =
      'row #' + el.dataset.rankRow + ' · col #' + el.dataset.rankCol
    var status = card.querySelector('[data-card-status]')
    var isPick = el.dataset.pick === '1'
    status.textContent = isPick ? 'canonical' : 'candidate'
    status.classList.toggle('text-gold', isPick)

    var contra = card.querySelector('[data-card-contra]')
    var note = el.dataset.contraNote
    contra.hidden = !note
    contra.textContent = note || ''
  }

  function show(el) {
    if (activeCell && activeCell !== el) activeCell.classList.remove('scale-[1.14]')
    activeCell = el
    el.classList.add('scale-[1.14]')
    fillCard(el)

    var r = el.getBoundingClientRect()
    var below = r.top < 260 // not enough room above -> place card below
    var x = Math.min(
      Math.max(r.left + r.width / 2, CARD_W / 2 + 8),
      window.innerWidth - CARD_W / 2 - 8,
    )
    card.style.left = x + 'px'
    card.style.top = (below ? r.bottom + 10 : r.top - 10) + 'px'
    card.style.transform = 'translate(-50%, ' + (below ? '0%' : '-100%') + ')'
    card.hidden = false
  }

  function hide() {
    if (activeCell) activeCell.classList.remove('scale-[1.14]')
    activeCell = null
    card.hidden = true
  }

  root.querySelectorAll('[data-cell]').forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      show(el)
    })
    el.addEventListener('focus', function () {
      show(el)
    })
    el.addEventListener('blur', hide)
  })
  table.addEventListener('mouseleave', hide)

  toggle.addEventListener('click', function () {
    manualNames = !namesShown()
    renderNames()
  })

  S.subscribe(renderNames)
  renderNames()
})()
