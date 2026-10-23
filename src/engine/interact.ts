const closest = (t: EventTarget | null, sel: string) => (t instanceof Element ? t.closest<HTMLElement>(sel) : null)
const enteredFrom = (el: HTMLElement, e: PointerEvent) => !(e.relatedTarget instanceof Node && el.contains(e.relatedTarget))

function ripple(el: HTMLElement, e: PointerEvent | null, kind: 'press' | 'wave') {
  const r = el.getBoundingClientRect()
  const x = e ? e.clientX - r.left : r.width / 2, y = e ? e.clientY - r.top : r.height / 2
  const d = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) * 2
  const s = document.createElement('span')
  s.className = `rp ${kind}`
  s.style.cssText = `left:${x}px;top:${y}px;width:${d}px;height:${d}px`
  el.appendChild(s)
  s.addEventListener('animationend', () => s.remove())
}

type Magnet = { el: HTMLElement; s: number; x: number; y: number; tx: number; ty: number }

/** Pointer micro-interactions, delegated from the document: card tilt, ripples, magnets, spotlight. */
export function initInteractions(reduced: boolean, fine: boolean): () => void {
  const ac = new AbortController()
  const { signal } = ac
  const on = <K extends keyof DocumentEventMap>(type: K, fn: (e: DocumentEventMap[K]) => void, passive = false) =>
    document.addEventListener(type, fn, { signal, passive })
  const timers = new Set<number>()

  const off = (c: HTMLElement) => {
    c.classList.remove('hot'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg')
  }

  on('pointerover', (e) => {
    const card = closest(e.target, '.ac')
    if (card && enteredFrom(card, e)) card.classList.add('hot')

    if (reduced) return
    const rp = closest(e.target, '[data-ripple]')
    if (rp && e.pointerType === 'mouse' && enteredFrom(rp, e)) {
      ripple(rp, e, 'wave')
      timers.add(window.setTimeout(() => ripple(rp, null, 'wave'), 140))
    }
  })

  on('pointerout', (e) => {
    const card = closest(e.target, '.ac')
    if (card && enteredFrom(card, e)) off(card)
  })
  on('pointercancel', (e) => {
    const card = closest(e.target, '.ac')
    if (card) off(card)
  })

  on('pointermove', (e) => {
    const spot = closest(e.target, '.spot')
    if (spot) {
      const b = spot.getBoundingClientRect()
      spot.style.setProperty('--mx', `${e.clientX - b.left}px`); spot.style.setProperty('--my', `${e.clientY - b.top}px`)
    }
    if (reduced) return
    const c = closest(e.target, '.ac')
    if (c) {
      const r = c.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
      c.style.setProperty('--ry', `${((x - 0.5) * 16).toFixed(2)}deg`)
      c.style.setProperty('--rx', `${((0.5 - y) * 16).toFixed(2)}deg`)
      c.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`)
      c.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`)
    }
  }, true)

  on('pointerdown', (e) => {
    if (reduced) return
    const rp = closest(e.target, '[data-ripple]')
    if (rp) ripple(rp, e, 'press')
    const b = closest(e.target, '.btn')
    if (b) {
      const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2
      const sp = document.createElement('span')
      sp.className = 'rpl'
      sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`
      b.appendChild(sp)
      sp.addEventListener('animationend', () => sp.remove())
    }
  })

  if (fine && !reduced) {
    const mags: Magnet[] = [...document.querySelectorAll<HTMLElement>('[data-mag]')].map((el) => ({ el, s: Number(el.dataset.mag), x: 0, y: 0, tx: 0, ty: 0 }))
    let raf = 0
    let prev = performance.now()
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      let moving = false
      for (const m of mags) {
        m.x += (m.tx - m.x) * Math.min(1, dt * 14); m.y += (m.ty - m.y) * Math.min(1, dt * 14)
        const rest = Math.abs(m.x) + Math.abs(m.y) < 0.05 && !m.tx && !m.ty
        m.el.style.translate = rest ? '' : `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`
        if (!rest) moving = true
      }
      raf = moving ? requestAnimationFrame(step) : 0
    }
    on('pointermove', (e) => {
      for (const m of mags) {
        const r = m.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2
        const dx = e.clientX - cx, dy = e.clientY - cy, reach = Math.max(r.width, r.height) * 0.8 + 40
        if (Math.hypot(dx, dy) < reach) { m.tx = dx * m.s; m.ty = dy * m.s } else m.tx = m.ty = 0
        if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) {
          m.el.style.setProperty('--hx', `${((e.clientX - r.left) / r.width) * 100}%`)
          m.el.style.setProperty('--hy', `${((e.clientY - r.top) / r.height) * 100}%`)
        }
      }
      if (!raf) { prev = performance.now(); raf = requestAnimationFrame(step) }
    }, true)
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(raf)
      for (const m of mags) m.el.style.translate = ''
    })
  }

  return () => {
    ac.abort()
    timers.forEach(clearTimeout)
  }
}
