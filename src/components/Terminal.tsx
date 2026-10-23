import { useEffect, useImperativeHandle, useState, type Ref } from 'react'
import { reducedMotion } from '../env'
import type { Plugin } from '../content'
import type { Stepper } from './Reel'

const CHAR_MS = 34
const PAUSE_BEFORE_OK_MS = 380
const PAUSE_AFTER_OK_MS = 260
const REPLAY_MS = 3200
const pad = (n: number) => String(n).padStart(2, '0')
const stageText = (p: Plugin, k: number) => {
  const note = p.notes?.[p.stages[k]]
  return `${pad(k + 1)} ${p.stages[k]}${note ? ` (${note})` : ''}`
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Plugin tabs, a stage rail, and a terminal that types the real stages in order. Types only while `live`; reduced motion shows it finished. */
export function Terminal({ plugins, live, ref }: { plugins: Plugin[]; live: boolean; ref?: Ref<Stepper> }) {
  const [p, setP] = useState(0)
  const plugin = plugins[p]
  const n = plugin.stages.length
  const [done, setDone] = useState(() => (reducedMotion() ? n : 0))
  const [typed, setTyped] = useState('')
  const typing = typed !== ''

  useImperativeHandle(ref, () => ({ step: (d) => setP((c) => (c + d + plugins.length) % plugins.length) }))

  useEffect(() => {
    if (reducedMotion()) { setDone(n); setTyped(''); return }
    if (!live) return
    let cancelled = false
    ;(async () => {
      while (!cancelled) {
        setDone(0); setTyped('')
        for (let k = 0; k < n; k++) {
          const text = stageText(plugin, k)
          for (let c = 1; c <= text.length; c++) {
            if (cancelled) return
            setTyped(text.slice(0, c))
            await sleep(CHAR_MS)
          }
          await sleep(PAUSE_BEFORE_OK_MS)
          if (cancelled) return
          setTyped(''); setDone(k + 1)
          await sleep(PAUSE_AFTER_OK_MS)
        }
        await sleep(REPLAY_MS)
      }
    })()
    return () => { cancelled = true }
  }, [live, plugin, n])

  return (
    <div className="term">
      <div className="term__tabs" role="group" aria-label="Plugin">
        {plugins.map((pl, k) => (
          <button key={pl.name} type="button" aria-pressed={k === p} onClick={() => setP(k)}>
            {pl.name}<small>v{pl.version}</small>
          </button>
        ))}
      </div>
      <div className="term__rail" aria-hidden="true">
        {plugin.stages.map((s, k) => (
          <span key={s} className="term__node">
            {k > 0 && <span className={k <= done ? 'nc done' : 'nc'} />}
            <span className={k < done ? 'nd done' : k === done && typing ? 'nd on' : 'nd'}>{pad(k + 1)} {s}</span>
          </span>
        ))}
      </div>
      <div className="term__body" aria-hidden="true">
        {plugin.stages.slice(0, done).map((_, k) => (
          <span key={k} className="term__line"><span className="p">$</span> {stageText(plugin, k)}  <span className="ok">✓</span></span>
        ))}
        {typing && <span className="term__line"><span className="p">$</span> {typed}<span className="cur" /></span>}
        {done === n && plugin.tail && <span className="term__line dim">{plugin.tail}</span>}
      </div>
      <p className="term__foot">{plugin.desc}</p>
      <ol className="sr" aria-label="Workflow stages">
        {plugin.stages.map((s) => <li key={s}>{s}{plugin.notes?.[s] ? ` ${plugin.notes[s]}` : ''}</li>)}
      </ol>
    </div>
  )
}
