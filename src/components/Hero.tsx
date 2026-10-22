import type { CSSProperties, PointerEvent } from 'react'
import { PROJECTS, PUBLISHED_AREAS, type AreaId } from '../content'
import type { Face } from '../useFace'

// Feeds the AI face's ripple, which spreads from where the pointer entered.
function trackPointer(e: PointerEvent<HTMLButtonElement>) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`)
}

export function Hero({ face, onToggle }: { face: Face; onToggle: (area: AreaId, slot: HTMLElement) => void }) {
  return (
    <section className="face" id="top" aria-labelledby="line">
      <div className="face__copy">
        <h1 className="face__line display" id="line">
          Engineer who builds across the stack — web, data, AI and&nbsp;3D.
        </h1>
        <p className="face__by">
          <strong>Started in mechatronics, still building things that work.</strong> I'm Josue Escobar, a full-stack and AI
          engineer. Pick an area to see the site the way that work looks, or just scroll.
        </p>
      </div>

      <div className="slots" role="group" aria-label="Choose an area" style={{ '--slots': PUBLISHED_AREAS.length } as CSSProperties}>
        {PUBLISHED_AREAS.map((area) => {
          const seated = face === area.id
          const count = PROJECTS.filter((p) => p.area === area.id).length
          return (
            <button
              key={area.id}
              className="slot"
              type="button"
              aria-pressed={seated}
              onClick={(e) => onToggle(area.id, e.currentTarget)}
              onPointerEnter={trackPointer}
            >
              <span className="slot__edge" aria-hidden="true">
                {area.edge.map((c) => <i key={c} style={{ background: c }} />)}
              </span>
              <span className="slot__num">{area.num}</span>
              <span className="slot__name">{area.name}</span>
              <span className="slot__meta">
                <span>{count} {count === 1 ? 'project' : 'projects'}</span>
                <span className="slot__act">{seated ? 'Eject' : 'Insert'}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
