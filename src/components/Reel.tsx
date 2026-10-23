import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type FocusEvent, type PointerEvent, type Ref } from 'react'
import { reducedMotion } from '../env'

export type Stepper = { step(direction: number): void }
type Shot = { src: string; alt: string }

const INTERVAL = 3400
const SWIPE_PX = 40
const pad = (n: number) => String(n).padStart(2, '0')

/** Phone screens, or landscape renders when `wide`, as a 3D carousel. Autoplays only while `live`, and stops for hover, keyboard focus and any change. */
export function Reel({ title, shots, wide, live, ref }: { title: string; shots: Shot[]; wide?: boolean; live: boolean; ref?: Ref<Stepper> }) {
  const n = shots.length
  const [i, setI] = useState(0)
  const [moved, setMoved] = useState(false)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const swipeFrom = useRef<number | null>(null)
  const dragged = useRef(false)

  const show = (k: number) => { setI(((k % n) + n) % n); setMoved(true) }
  const step = (d: number) => show(i + d)
  useImperativeHandle(ref, () => ({ step }))

  const playing = live && !hover && !focus && !reducedMotion() && n > 1
  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => { setI((c) => (c + 1) % n); setMoved(true) }, INTERVAL)
    return () => clearTimeout(t)
  }, [playing, i, n])

  const onPointerUp = (e: PointerEvent) => {
    if (swipeFrom.current === null) return
    const dx = e.clientX - swipeFrom.current
    swipeFrom.current = null
    if (Math.abs(dx) <= SWIPE_PX) return
    dragged.current = true
    step(dx < 0 ? 1 : -1)
    setTimeout(() => { dragged.current = false }, 60)
  }
  const onFocus = (e: FocusEvent) => { if (e.target.matches(':focus-visible')) setFocus(true) }
  const onBlur = (e: FocusEvent) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false) }

  return (
    <div
      className={wide ? 'reel reel--wide' : 'reel'}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${title} screens`}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(true) }}
      onPointerLeave={() => setHover(false)}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div
        className="reel__stage"
        onPointerDown={(e) => { swipeFrom.current = e.clientX; dragged.current = false }}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { swipeFrom.current = null }}
      >
        <div key={i} className={moved ? 'reel__big pop' : 'reel__big'} aria-hidden="true">{pad(i + 1)}</div>
        {shots.map((s, k) => {
          const o = k - i, a = Math.abs(o)
          return (
            <figure
              key={s.src}
              className={o === 0 ? 'ph on' : 'ph'}
              data-hide={a > 1 ? '' : undefined}
              aria-hidden={o !== 0}
              style={{ '--o': o, '--a': Math.min(a, 2) } as CSSProperties}
              onClick={() => { if (!dragged.current) show(k) }}
            >
              <img src={s.src} alt={s.alt} width={wide ? 1000 : 780} height={wide ? 750 : 1688} draggable={false} loading="lazy" />
            </figure>
          )
        })}
      </div>
      <div className="reel__bar">
        <button className="pbtn pbtn--sq" type="button" aria-label="Previous screen" onClick={() => step(-1)}>
          <span className="tri tri--l" aria-hidden="true" />
        </button>
        <div className="pips">
          {shots.map((s, k) => (
            <button key={s.src} type="button" aria-label={`Show screen ${k + 1} of ${n}`} aria-current={k === i} onClick={() => show(k)} />
          ))}
        </div>
        <span className="reel__count" aria-hidden="true">{pad(i + 1)}/{pad(n)}</span>
        <button className="pbtn pbtn--sq" type="button" aria-label="Next screen" onClick={() => step(1)}>
          <span className="tri" aria-hidden="true" />
        </button>
      </div>
      <p className="reel__cap" aria-live={playing ? 'off' : 'polite'}>{shots[i].alt}</p>
    </div>
  )
}
