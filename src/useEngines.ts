import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { AREAS } from './content'
import { REDUCED_MOTION_QUERY, coarsePointer, finePointer, reducedMotion } from './env'
import { initCursor } from './engine/cursor'
import { initField, type FieldApi } from './engine/field'
import { initInteractions } from './engine/interact'
import { initReveals } from './engine/reveal'
import { initScroll } from './engine/scroll'
import type { SceneApi } from './engine/scene'
import type { Face, Origin } from './useFace'

function setThemeColor() {
  const ground = getComputedStyle(document.documentElement).getPropertyValue('--ground').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', ground)
}

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

/**
 * Starts the imperative engines against the markup React rendered (field canvas, hero 3D scene, cursor, scroll
 * effects, pointer micro-interactions, reveals) and keeps them in step with the face. Returns whether the 3D
 * scene failed to start, so the markup can drop its hint and keep the SVG fallback.
 */
export function useEngines(face: Face, origin: MutableRefObject<Origin>): { sceneFailed: boolean } {
  const [sceneFailed, setSceneFailed] = useState(false)
  const faceRef = useRef(face)
  const field = useRef<FieldApi | null>(null)
  const scene = useRef<SceneApi | null>(null)
  const shown = useRef(face)

  useEffect(() => {
    faceRef.current = face
  }, [face])

  useEffect(() => {
    const reduced = reducedMotion(), fine = finePointer()
    const mq = matchMedia(REDUCED_MOTION_QUERY)
    const reload = () => location.reload()
    mq.addEventListener('change', reload)

    setThemeColor()
    const f = initField(byId<HTMLCanvasElement>('field'), faceRef.current, reduced)
    field.current = f
    let heroP = 0
    const scroll = initScroll(reduced, (y, p) => {
      heroP = p
      f.setScroll(y)
      scene.current?.setHeroProgress(p)
    })
    const stopInteractions = initInteractions(reduced, fine)
    const stopCursor = fine ? initCursor(byId('cursor')) : () => {}
    const stopReveals = initReveals(() => { f.measure(); scroll.update() })

    let timer = 0
    const ro = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = window.setTimeout(() => { f.measure(); scroll.update() }, 100)
    })
    ro.observe(document.body)
    scroll.update()

    let gone = false
    if (!reduced) {
      import('./engine/scene')
        .then(({ initScene }) => {
          const started = faceRef.current
          return initScene(byId('hstage'), started, coarsePointer()).then((s) => ({ s, started }))
        })
        .then(({ s, started }) => {
          if (gone) { s.destroy(); return }
          if (faceRef.current !== started) s.setFace(faceRef.current)
          s.setHeroProgress(heroP)
          scene.current = s
        })
        .catch((err) => {
          console.warn('3D scene unavailable, using the static SVG fallback:', err)
          if (!gone) setSceneFailed(true)
        })
    }

    return () => {
      gone = true
      clearTimeout(timer)
      mq.removeEventListener('change', reload)
      ro.disconnect()
      stopReveals(); stopCursor(); stopInteractions(); scroll.destroy()
      f.destroy(); field.current = null
      scene.current?.destroy(); scene.current = null
    }
  }, [])

  useEffect(() => {
    if (shown.current === face) return
    shown.current = face
    const o = origin.current
    field.current?.setFace(face, reducedMotion() ? undefined : o)
    scene.current?.setFace(face)

    const area = AREAS.find((a) => a.id === face)
    byId('live').textContent = area ? `Style changed to ${area.name}` : 'Neutral style'

    // Computed tokens are mid-transition right after the switch; read the settled colour.
    const settle = window.setTimeout(setThemeColor, 1000)

    if (!reducedMotion()) {
      const [x, y] = o
      const c = `circle(0px at ${x}px ${y}px)`, big = `circle(${Math.hypot(innerWidth, innerHeight)}px at ${x}px ${y}px)`
      byId('wipe').animate(
        [{ clipPath: c, opacity: 0.95 }, { clipPath: big, opacity: 0.95, offset: 0.5 }, { clipPath: big, opacity: 0 }],
        { duration: 760, easing: 'cubic-bezier(.7,0,.2,1)' },
      )
    }
    return () => clearTimeout(settle)
  }, [face, origin])

  return { sceneFailed }
}
