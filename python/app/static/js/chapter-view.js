/* Port of the interactive half of components/ChapterView.tsx: the unmask/hide
 * toggle, the human/AI analysis tabs and the one-way "reveal AI art" opt-in. */
;(function () {
  'use strict'

  var root = document.querySelector('[data-chapter]')
  if (!root) return

  var S = window.Pantheon
  var godSlug = root.dataset.godSlug

  var when = root.querySelector('[data-when]')
  var revealedName = root.querySelector('[data-revealed]')
  var unmaskBtn = root.querySelector('[data-unmask]')
  var hideBtn = root.querySelector('[data-hide]')
  var art = root.querySelector('[data-art]')
  var artImg = root.querySelector('[data-art-img]')
  var artOptIn = root.querySelector('[data-art-optin]')
  var revealArtBtn = root.querySelector('[data-reveal-art]')

  function render() {
    var revealed = S.revealed().has(godSlug)
    var artRevealed = S.artRevealed()

    when.hidden = !revealed
    revealedName.hidden = !revealed
    unmaskBtn.hidden = revealed

    // The portrait is only shown once the pair is revealed, so it can't spoil —
    // and the file isn't even fetched until then.
    art.hidden = !(revealed && artRevealed)
    artOptIn.hidden = !(revealed && !artRevealed)
    if (revealed && artRevealed && !artImg.src) {
      artImg.src = artImg.dataset.src
    }
  }

  unmaskBtn.addEventListener('click', function () {
    S.revealGod(godSlug)
  })
  if (hideBtn) {
    hideBtn.addEventListener('click', function () {
      S.hideGod(godSlug)
    })
  }
  revealArtBtn.addEventListener('click', function () {
    S.revealArt()
  })

  // Analysis toggle — 'human' by default, matching the original's useState.
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-tab]'))
  var panels = Array.prototype.slice.call(root.querySelectorAll('[data-panel]'))
  var ACTIVE = ['bg-gold/15', 'text-goldsoft']
  var IDLE = ['text-muted', 'hover:text-ink']

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        var on = t === tab
        t.setAttribute('aria-selected', on ? 'true' : 'false')
        ACTIVE.forEach(function (c) {
          t.classList.toggle(c, on)
        })
        IDLE.forEach(function (c) {
          t.classList.toggle(c, !on)
        })
      })
      panels.forEach(function (p) {
        p.hidden = p.dataset.panel !== tab.dataset.tab
      })
    })
  })

  S.subscribe(render)
  render()
})()
