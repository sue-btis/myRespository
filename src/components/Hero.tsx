import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react'
import { AREAS, EMAIL, GITHUB, HERO, PROJECTS, type AreaId } from '../content'
import { coarsePointer, reducedMotion } from '../env'
import type { Face } from '../useFace'
import { AreaIcon } from './AreaIcon'
import { Icon } from './Icon'
import { MailLink } from './MailLink'
import { Chars } from './text'

const EASE: Record<Face, string> = {
  neutral: 'cubic-bezier(.16,1,.3,1)',
  fullstack: 'cubic-bezier(.16,1,.3,1)',
  ai: 'cubic-bezier(.65,0,.35,1)',
  data: 'steps(6,end)',
  design: 'cubic-bezier(.16,1,.3,1)',
}

const words = HERO.line.split(' ')

type Props = {
  face: Face
  hint: boolean
  onToggle: (area: AreaId, src: MouseEvent<HTMLElement> | HTMLElement) => void
}

export function Hero({ face, hint, onToggle }: Props) {
  const line = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)

  useEffect(() => {
    const slow = first.current
    first.current = false
    if (reducedMotion() || !line.current) return
    line.current.querySelectorAll<HTMLElement>('.hw > span').forEach((s, i) => s.animate(
      [{ transform: 'translateY(112%) rotate(5deg)' }, { transform: 'none' }],
      { duration: slow ? 1000 : 650, delay: i * (slow ? 55 : 28), easing: EASE[face], fill: 'backwards' },
    ))
  }, [face])

  return (
    <section className="hero" aria-labelledby="line">
      <div className="hstage" id="hstage" aria-hidden="true" data-calm="soft">
        <div className="fallback"><AreaIcon face={face} live /></div>
      </div>
      {hint && !coarsePointer() && (
        <p className="hint" aria-hidden="true">
          <Icon name="drag" />
          <span>{HERO.hint}</span>
        </p>
      )}

      <div className="hcopy" data-calm>
        <h1 className="hline display" id="line" ref={line} aria-label={HERO.line}>
          {words.map((w, i) => (
            <span key={i}>
              <span className="hw" aria-hidden="true"><span>{w}</span></span>
              {i < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </h1>
        <p className="hby"><strong>{HERO.by}</strong> {HERO.lead}</p>
        <div className="hctas">
          <MailLink className="btn spot" data-mag="0.2">
            <Icon name="mail" /><span className="lbl"><Chars text="Write to me" /></span>
          </MailLink>
          <a className="btn btn--ghost spot" href={GITHUB} data-mag="0.2">
            <Icon name="github" /><span className="lbl"><Chars text="GitHub" /></span>
          </a>
        </div>
        <p className="hmail">{EMAIL}</p>
      </div>

      <div className="cards" role="group" aria-label={`Choose an area. Keys 1 to ${AREAS.length} also work, Escape resets.`} style={{ '--areas': AREAS.length } as CSSProperties}>
        {AREAS.map((area, n) => {
          const count = PROJECTS.filter((p) => p.area === area.id).length
          const on = face === area.id
          const projects = `${count} ${count === 1 ? 'project' : 'projects'}`
          return (
            <button
              key={area.id}
              className="ac"
              type="button"
              data-area={area.id}
              data-ripple
              aria-label={`${area.name}, ${projects}`}
              aria-pressed={on}
              style={{ '--n': n } as CSSProperties}
              onClick={(e) => onToggle(area.id, e.clientX || e.clientY ? e : e.currentTarget)}
            >
              <span className="ac__top">
                <span className="ac__ico"><AreaIcon face={area.id} /></span>
                <span className="ac__num" aria-hidden="true">{String(n + 1).padStart(2, '0')}</span>
              </span>
              <span className="ac__name">{area.name}</span>
              <span className="ac__meta" aria-hidden="true">
                <span>{projects}</span>
                {on && <span>Selected</span>}
              </span>
              <span className="ac__edge" aria-hidden="true">
                {area.edge.map((c) => <i key={c} style={{ background: c }} />)}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
