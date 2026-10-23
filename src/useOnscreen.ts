import { useEffect, useState, type RefObject } from 'react'

/** True while the element is in the viewport and the tab is visible; looping timers hang off this. */
export function useOnscreen(ref: RefObject<Element | null>): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let inView = false
    const sync = () => setOn(inView && !document.hidden)
    const io = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync() })
    io.observe(el)
    document.addEventListener('visibilitychange', sync)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [ref])
  return on
}
