/** Difference-blend circle that trails the mouse; fine pointers only. */
export function initCursor(el: HTMLElement): () => void {
  const ac = new AbortController()
  const { signal } = ac
  let cx = 0, cy = 0, px = 0, py = 0, seen = false, raf = 0

  function step() {
    cx += (px - cx) * 0.22; cy += (py - cy) * 0.22
    el.style.transform = `translate3d(${cx}px,${cy}px,0)`
    raf = Math.abs(px - cx) + Math.abs(py - cy) > 0.2 && !document.hidden ? requestAnimationFrame(step) : 0
  }

  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    px = e.clientX; py = e.clientY
    if (!seen) { seen = true; cx = px; cy = py; el.classList.add('on') }
    el.classList.toggle('big', e.target instanceof Element && !!e.target.closest('a, button'))
    if (!raf) raf = requestAnimationFrame(step)
  }, { signal })
  document.addEventListener('mouseleave', () => el.classList.remove('on'), { signal })
  document.addEventListener('mouseenter', () => { if (seen) el.classList.add('on') }, { signal })

  return () => {
    ac.abort()
    cancelAnimationFrame(raf)
    el.classList.remove('on', 'big')
  }
}
