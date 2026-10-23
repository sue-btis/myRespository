import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type Ref } from 'react'
import { AREAS, PROJECTS, WORK_NOTE, type Area, type AreaId, type Project } from '../content'
import { reducedMotion } from '../env'
import type { Face } from '../useFace'
import { useOnscreen } from '../useOnscreen'
import { useScreen } from '../useScreen'
import { Icon } from './Icon'
import { Reel, type Stepper } from './Reel'
import { Terminal } from './Terminal'

type Toggle = (area: AreaId, src: MouseEvent<HTMLElement> | HTMLElement) => void
type Slot = { no: string; area: Area; project?: Project }
type Hint = { text: string; area?: Area }

const pad = (n: number) => String(n).padStart(2, '0')
const index = (n: number) => ({ '--i': n }) as CSSProperties
const IDLE_HINT: Hint = { text: 'Choose a slot to load a project.' }
const SKIP_KEYS = ['Enter', ' ', 'Escape']

/** One cartridge per project, and one empty slot for each area that has none, so adding a project fills its slot. */
const SLOTS: Slot[] = AREAS.flatMap((area) => {
  const mine = PROJECTS.filter((p) => p.area === area.id)
  return mine.length ? mine.map((project) => ({ area, project })) : [{ area }]
}).map((s, i) => ({ ...s, no: pad(i + 1) }))
const LOADED = SLOTS.filter((s) => s.project).length

const linkedProject = () => PROJECTS.find((p) => p.id === location.hash.slice(1))?.id

function SlotButton({ slot, ref, onOpen }: { slot: Slot; ref: Ref<HTMLButtonElement>; onOpen: (slot: Slot, el: HTMLButtonElement) => void }) {
  const { no, area, project } = slot
  return (
    <button ref={ref} className={project ? 'slot' : 'slot slot--empty'} type="button" data-area={area.id} onClick={(e) => onOpen(slot, e.currentTarget)}>
      <span className="slot__label"><span className="slot__no">{no}</span><span className="slot__area">{area.name}</span></span>
      <span className="slot__title"><span className="slot__cur" aria-hidden="true" />{project?.title ?? 'Empty slot'}</span>
      <span className="slot__meta">
        {project
          ? project.meta.map(([term, detail]) => <span key={term}><b>{term}</b>{detail}</span>)
          : <span><b>Status</b>In the works</span>}
      </span>
      <span className="slot__go" aria-hidden="true"><span className="tri" />{project ? 'Load' : 'Peek'}</span>
      {project && <span className="slot__pins" aria-hidden="true" />}
    </button>
  )
}

function ProjectView({ slot, project, active, live, register, stepper, onBack }: {
  slot: Slot
  project: Project
  active: boolean
  live: boolean
  register: (el: HTMLElement | null) => void
  stepper: Ref<Stepper>
  onBack: () => void
}) {
  const visual = project.shots ? 'Screens' : project.plugins ? 'Workflow' : null
  return (
    <section
      ref={register}
      className={`view proj${active ? ' on' : ''}${active && !reducedMotion() ? ' is-live' : ''}`}
      inert={!active}
      tabIndex={-1}
      aria-labelledby={`h-${project.id}`}
    >
      <div className="hud">
        <button className="pbtn pbtn--ghost" type="button" onClick={onBack}>
          <span className="tri tri--l" aria-hidden="true" />Back to slots <kbd className="keyhint" aria-hidden="true">Esc</kbd>
        </button>
        <p className="hud__slot"><span aria-hidden="true">{slot.no}</span><span>{slot.area.name}</span></p>
      </div>
      <div className={visual ? 'proj__grid' : 'proj__grid proj__grid--solo'}>
        {visual && (
          <div className="vp">
            <span className="vp__tag" aria-hidden="true">{visual}</span>
            {project.shots && <Reel title={project.title} shots={project.shots} live={live} ref={stepper} />}
            {project.plugins && <Terminal plugins={project.plugins} live={live} ref={stepper} />}
          </div>
        )}
        <div className="info">
          <h3 className="display" id={`h-${project.id}`} style={index(0)}>{project.title}</h3>
          <p className="pitch" style={index(1)}>{project.pitch}</p>
          <ul className="steps" style={index(2)}>
            {project.steps.map(([label, text]) => <li key={label}><b>{label}</b><span>{text}</span></li>)}
          </ul>
          <div className="chips" style={index(3)} aria-label={project.stack.label}>
            {project.stack.items.map((item) => <span className="chip" key={item}>{item}</span>)}
          </div>
          <div className="row" style={index(4)}>
            {project.proof.map((item) => <span className="badge" key={item}><i />{item}</span>)}
          </div>
          <div className="ctas" style={index(5)}>
            {project.links.map((l) => <a className="pbtn" key={l.href} href={l.href}>{l.label}<Icon name="arrow" /></a>)}
            {project.pending && <button className="pbtn" type="button" disabled>{project.pending}</button>}
          </div>
        </div>
      </div>
    </section>
  )
}

export function Work({ face, onToggle }: { face: Face; onToggle: Toggle }) {
  const screen = useScreen(linkedProject() ?? 'select')
  const consoleRef = useRef<HTMLDivElement>(null)
  const slotEls = useRef<(HTMLButtonElement | null)[]>([])
  const lastSlot = useRef<HTMLButtonElement | null>(null)
  const steppers = useRef<Record<string, Stepper | null>>({})
  const onscreen = useOnscreen(consoleRef)
  const [hint, setHint] = useState<Hint>(IDLE_HINT)
  const { view } = screen

  useEffect(() => {
    if (linkedProject()) consoleRef.current?.scrollIntoView()
  }, [])

  const setHash = (id: string | null) => {
    if (id || PROJECTS.some((p) => `#${p.id}` === location.hash)) history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search)
  }

  const open = async (slot: Slot, el: HTMLButtonElement) => {
    if (screen.isBusy()) return
    if (!slot.project) {
      el.classList.remove('slot--shake'); void el.offsetWidth; el.classList.add('slot--shake')
      setHint({ text: slot.area.wip ?? 'Nothing here yet.', area: slot.area })
      return
    }
    lastSlot.current = el
    setHint(IDLE_HINT)
    await screen.go(slot.project.id, { press: el, label: [slot.no, slot.project.title] })
    setHash(slot.project.id)
    screen.focus(slot.project.id)
  }

  const back = async () => {
    await screen.go('select')
    setHash(null)
    const slot = lastSlot.current ?? slotEls.current[0]
    slot?.focus({ preventScroll: true })
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
    const target = e.target instanceof Element ? e.target : null
    // Stopping Esc here keeps useFace's window listener from also resetting the site face.
    if (screen.isBusy()) {
      if (SKIP_KEYS.includes(e.key)) { e.preventDefault(); e.stopPropagation(); screen.skip() }
      return
    }
    if (e.key === 'Escape' && view !== 'select') { e.preventDefault(); e.stopPropagation(); void back(); return }
    const slot = target?.closest('.slot')
    if (view === 'select' && slot) {
      const slots = slotEls.current.filter((s): s is HTMLButtonElement => !!s)
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
      const next = step
        ? slots[(slots.indexOf(slot as HTMLButtonElement) + step + slots.length) % slots.length]
        : e.key === 'Home' ? slots[0] : e.key === 'End' ? slots[slots.length - 1] : null
      if (next) { e.preventDefault(); next.focus() }
      return
    }
    const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    const inside = !!target && (!!consoleRef.current?.contains(target) || target === document.body)
    const stepper = steppers.current[view]
    if (dir && onscreen && inside && stepper) { e.preventDefault(); stepper.step(dir) }
  }
  const latestKey = useRef(onKey)
  useEffect(() => { latestKey.current = onKey })
  useEffect(() => {
    const handler = (e: KeyboardEvent) => latestKey.current(e)
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const peek = hint.area
  const peeking = !!peek && face === peek.id
  return (
    <section className="work" id="work" aria-labelledby="work-title">
      <div className="work__head" data-calm>
        <h2 className="display" id="work-title" data-reveal>Work</h2>
        <p className="work__note" data-reveal style={{ '--d': 120 } as CSSProperties}>{WORK_NOTE}</p>
      </div>

      <div className="console" ref={consoleRef} data-reveal data-calm data-busy={screen.busy ? '' : undefined} style={{ '--d': 160 } as CSSProperties}>
        <div className="console__top">
          <span className="led" aria-hidden="true" />
          <span aria-hidden="true">Projects</span>
          <span className="grille" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
        </div>

        <div className="screen" data-view={view} onPointerDown={() => { if (screen.isBusy()) screen.skip() }}>
          <section ref={screen.register('select')} className={`view v-select${view === 'select' ? ' on' : ''}`} inert={view !== 'select'} aria-labelledby="h-select">
            <div className="sel__head">
              <h3 className="display" id="h-select">Select project</h3>
              <div className="sel__count" aria-label={`${LOADED} projects loaded, ${SLOTS.length - LOADED} empty slots`}>
                <span className="eq" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((n) => <i key={n} style={{ '--n': n } as CSSProperties} />)}</span>
                <span aria-hidden="true">{LOADED} loaded &middot; {SLOTS.length - LOADED} empty</span>
              </div>
            </div>
            <div className="slots">
              {SLOTS.map((slot, i) => (
                <SlotButton key={slot.no} slot={slot} ref={(el) => { slotEls.current[i] = el }} onOpen={open} />
              ))}
            </div>
          </section>

          <section ref={screen.register('load')} className={`view v-load${view === 'load' ? ' on' : ''}`} inert={view !== 'load'} aria-hidden="true">
            <p>{screen.load.no}</p>
            <h3 className="display">{screen.load.name}</h3>
            <div className="bar10">
              {Array.from({ length: screen.loadCells }, (_, n) => <i key={n} className={n < screen.load.filled ? 'f' : undefined} />)}
            </div>
            <small>Loading</small>
          </section>

          {SLOTS.map((slot) => slot.project && (
            <ProjectView
              key={slot.project.id}
              slot={slot}
              project={slot.project}
              active={view === slot.project.id}
              live={view === slot.project.id && onscreen}
              register={screen.register(slot.project.id)}
              stepper={(s) => { steppers.current[slot.project!.id] = s }}
              onBack={() => void back()}
            />
          ))}
        </div>

        <div className="console__bot">
          <span className="console__hint" aria-live="polite">
            <span>{hint.text}</span>
            {peek && (
              <button className="cbtn" type="button" aria-pressed={peeking} onClick={(e) => onToggle(peek.id, e.clientX || e.clientY ? e : e.currentTarget)}>
                {peeking ? 'Back to neutral' : 'Preview this style'}
              </button>
            )}
          </span>
          <span className="keyhint" aria-hidden="true"><kbd>&larr;</kbd> <kbd>&rarr;</kbd> move &nbsp; <kbd>Enter</kbd> load</span>
        </div>
      </div>
    </section>
  )
}
