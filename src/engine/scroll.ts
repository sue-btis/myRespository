const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export type ScrollApi = { update(): void; destroy(): void }

/** Scroll-linked state: header backing, hero depth, heading drift and the timeline draw. */
export function initScroll(reduced: boolean, onFrame: (scrollY: number, heroProgress: number) => void): ScrollApi {
  const root = document.documentElement
  const q = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)
  const bar = q('#bar'), hero = q('.hero'), tl = q('#tl')
  const drifts = [...document.querySelectorAll<HTMLElement>('[data-drift]')]
  let queued = 0

  function update() {
    const sy = scrollY
    bar?.classList.toggle('stuck', sy > 12)
    let heroP = 0
    if (hero) {
      const hr = hero.getBoundingClientRect()
      heroP = clamp(-hr.top / hr.height, 0, 1)
    }
    root.style.setProperty('--hp', heroP.toFixed(3))
    if (!reduced) {
      for (const el of drifts) {
        const r = el.getBoundingClientRect()
        if (r.bottom > 0 && r.top < innerHeight) el.style.transform = `translate3d(${((r.top - innerHeight * 0.5) * -0.18).toFixed(1)}px,0,0)`
      }
    }
    if (tl) {
      const r = tl.getBoundingClientRect()
      tl.style.setProperty('--p', reduced ? '1' : clamp((innerHeight * 0.7 - r.top) / r.height, 0, 1).toFixed(3))
    }
    onFrame(sy, heroP)
  }

  const onScroll = () => {
    if (queued) return
    queued = requestAnimationFrame(() => { queued = 0; update() })
  }
  addEventListener('scroll', onScroll, { passive: true })

  return {
    update,
    destroy() {
      removeEventListener('scroll', onScroll)
      cancelAnimationFrame(queued)
      root.style.removeProperty('--hp')
    },
  }
}
