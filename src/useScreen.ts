import { useCallback, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { reducedMotion } from './env'

export type ScreenView = 'select' | 'load' | (string & {})
type Frames = Keyframe[]

const EASE = 'cubic-bezier(.2,.8,.2,1)'
const POWER_OFF: Frames = [
  { clipPath: 'inset(0 0 0 0)', filter: 'brightness(1)' },
  { clipPath: 'inset(49.4% 0 49.4% 0)', filter: 'brightness(3)', offset: 0.6 },
  { clipPath: 'inset(49.4% 50% 49.4% 50%)', filter: 'brightness(5)' },
]
const POWER_ON: Frames = [
  { clipPath: 'inset(49.4% 50% 49.4% 50%)', filter: 'brightness(5)' },
  { clipPath: 'inset(49.4% 0 49.4% 0)', filter: 'brightness(3)', offset: 0.35 },
  { clipPath: 'inset(0 0 0 0)', filter: 'brightness(1)' },
]
const LOAD_CELLS = 10

type GoOptions = { press?: HTMLElement | null; instant?: boolean; label?: [no: string, name: string] }

/**
 * The console screen as a small state machine: one visible view at a time, and a CRT power-off, LOADING bar,
 * power-on sequence between the select screen and a project. Any timed step can be skipped.
 */
export function useScreen(initial: ScreenView = 'select') {
  const [view, setView] = useState<ScreenView>(initial)
  const [busy, setBusy] = useState(false)
  const [load, setLoad] = useState({ no: '', name: '', filled: 0 })
  const viewRef = useRef<ScreenView>(initial)
  const els = useRef(new Map<string, HTMLElement>())
  const run = useRef({ busy: false, skipping: false, pending: new Set<() => void>() })

  const register = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) els.current.set(id, el)
    else els.current.delete(id)
  }, [])

  const wait = (ms: number) => new Promise<void>((resolve) => {
    if (reducedMotion() || run.current.skipping) return resolve()
    const done = () => { clearTimeout(t); run.current.pending.delete(done); resolve() }
    const t = setTimeout(done, ms)
    run.current.pending.add(done)
  })

  const anim = (id: string, frames: Frames, ms: number, fill: FillMode = 'none') => {
    const el = els.current.get(id)
    if (!el || reducedMotion() || run.current.skipping) return Promise.resolve()
    return el.animate(frames, { duration: ms, easing: EASE, fill }).finished.then(() => undefined, () => undefined)
  }

  const show = (id: ScreenView) => {
    flushSync(() => setView(id))
    viewRef.current = id
    els.current.forEach((el) => el.getAnimations().forEach((a) => a.cancel()))
  }

  const skip = useCallback(() => {
    run.current.skipping = true
    run.current.pending.forEach((done) => done())
    els.current.forEach((el) => el.getAnimations().forEach((a) => a.finish()))
  }, [])

  const focus = useCallback((id: string) => els.current.get(id)?.focus({ preventScroll: true }), [])

  const isBusy = useCallback(() => run.current.busy, [])

  const go = async (to: ScreenView, { press, instant, label }: GoOptions = {}) => {
    const r = run.current
    if (r.busy || to === viewRef.current) return
    r.busy = true; r.skipping = false; setBusy(true)
    const from = viewRef.current
    if (!instant && !reducedMotion()) {
      if (press) { press.classList.add('is-pressed'); await wait(140); press.classList.remove('is-pressed') }
      await anim(from, POWER_OFF, 240, 'forwards')
      if (label) {
        setLoad({ no: label[0], name: label[1], filled: 0 })
        show('load')
        await anim('load', POWER_ON, 160)
        for (let i = 1; i <= LOAD_CELLS; i++) { setLoad((l) => ({ ...l, filled: i })); await wait(48) }
        await wait(120)
        await anim('load', POWER_OFF, 160, 'forwards')
      }
      show(to)
      await anim(to, POWER_ON, 440)
    } else show(to)
    r.busy = false; setBusy(false)
  }

  return { view, busy, load, loadCells: LOAD_CELLS, register, go, skip, focus, isBusy }
}
