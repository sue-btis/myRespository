import { useEffect, useRef, useState } from 'react'
import { TIMELINE } from '../content'

export function About() {
  const timeline = useRef<HTMLOListElement>(null)
  // Drawn by default; the draw-in only arms when it can also be triggered, so the line never stays hidden.
  const [state, setState] = useState<'drawn' | 'armed'>('drawn')

  useEffect(() => {
    const el = timeline.current
    if (!el || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setState('armed')
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setState('drawn')
        io.disconnect()
      }
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="section__head">
        <h2 className="section__title display" id="about-title">How I got here</h2>
      </div>
      <div className="about">
        <div className="about__intro">
          <p>I learned to build on machines before I built software: wiring, controllers, parts that have to fit. That habit stayed. I start from how the thing is used, then build the whole of it.</p>
          <p>Off the clock: sports and music.</p>
        </div>
        <ol className="timeline" ref={timeline} data-state={state}>
          {TIMELINE.map((t) => (
            <li key={`${t.when}-${t.what}`}><time>{t.when}</time><b>{t.what}</b><span>{t.where}</span></li>
          ))}
        </ol>
      </div>
    </section>
  )
}
