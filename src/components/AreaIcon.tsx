import type { CSSProperties, JSX } from 'react'
import type { Face } from '../useFace'

const dx = (v: string) => ({ '--dx': v }) as CSSProperties

const ICONS: Record<Face, (live: boolean) => JSX.Element> = {
  neutral: (live) => (
    <svg className={`ico ico-neutral${live ? ' live' : ''}`} viewBox="0 0 64 64">
      <rect x="8" y="48" width="48" height="6" rx="1" />
      <path d="M16 48V38M48 48V38" />
      <circle className="gear" cx="32" cy="24" r="12" />
      <circle className="gear2 ac2" cx="32" cy="24" r="6" />
      <circle className="fl" cx="32" cy="24" r="2.4" />
    </svg>
  ),
  fullstack: (live) => (
    <svg className={`ico ico-fullstack${live ? ' live' : ''}`} viewBox="0 0 64 64">
      <rect className="p2" x="22" y="22" width="34" height="28" rx="3" />
      <rect className="p1" x="8" y="12" width="34" height="28" rx="3" />
      <path className="p1" d="M8 20h34" />
      <circle className="p1 fl" cx="13" cy="16" r="1.4" />
      <circle className="p1 fl" cx="18" cy="16" r="1.4" />
      <path className="p1 caret ac2" d="M16 30h10" />
    </svg>
  ),
  ai: (live) => (
    <svg className={`ico ico-ai${live ? ' live' : ''}`} viewBox="0 0 64 64">
      <path className="e ac2" d="M12 20 32 14 52 22M12 20 32 32 52 22M12 44 32 32 52 44M12 44 32 50 52 44M12 20v24M52 22v22" />
      <circle className="n" cx="12" cy="20" r="4" />
      <circle className="n" cx="32" cy="14" r="4" />
      <circle className="n" cx="52" cy="22" r="4" />
      <circle className="n" cx="32" cy="32" r="4" />
      <circle className="n" cx="12" cy="44" r="4" />
      <circle className="n" cx="52" cy="44" r="4" />
      <circle className="n" cx="32" cy="50" r="4" />
    </svg>
  ),
  data: (live) => (
    <svg className={`ico ico-data${live ? ' live' : ''}`} viewBox="0 0 64 64">
      <path d="M6 54h52" />
      <rect className="b" style={dx('11px')} x="9" y="34" width="7" height="20" rx="1" />
      <rect className="b" style={dx('22px')} x="20" y="20" width="7" height="34" rx="1" />
      <rect className="b" style={dx('-22px')} x="31" y="42" width="7" height="12" rx="1" />
      <rect className="b" style={dx('-11px')} x="42" y="26" width="7" height="28" rx="1" />
      <rect className="b" style={dx('0px')} x="53" y="14" width="7" height="40" rx="1" transform="translate(-2 0)" />
    </svg>
  ),
  design: (live) => (
    <svg className={`ico ico-design${live ? ' live' : ''}`} viewBox="0 0 64 64">
      <path d="M10 28v18l22 10 22-10V28M32 38v18M10 28l22 10 22-10" />
      <g className="cap"><path className="ac2" d="M10 24 32 14l22 10-22 10z" /></g>
      <path className="guide ac2" d="M32 6v6M32 40v10" />
      <circle className="fl" cx="32" cy="38" r="2" />
    </svg>
  ),
}

/** Authored animated icon of a face; `live` plays it without needing a hover. */
export function AreaIcon({ face, live = false }: { face: Face; live?: boolean }) {
  return ICONS[face](live)
}
