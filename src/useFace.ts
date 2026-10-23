import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from 'react'
import { AREAS, type AreaId } from './content'

export type Face = 'neutral' | AreaId
export type Origin = [x: number, y: number]
type Source = { clientX: number; clientY: number } | Element | undefined

function linkedFace(): Face {
  const asked = document.documentElement.dataset.face
  return AREAS.find((a) => a.id === asked)?.id ?? 'neutral'
}

function originOf(src: Source): Origin {
  if (src && 'clientX' in src && (src.clientX || src.clientY)) return [src.clientX, src.clientY]
  if (src instanceof Element) {
    const r = src.getBoundingClientRect()
    return [r.left + r.width / 2, r.top + r.height / 2]
  }
  return [innerWidth / 2, innerHeight / 2]
}

/**
 * The one face of the site. It is mirrored on <html data-face>, which drives the CSS tokens; the engines (field,
 * 3D scene, wipe) follow the same state and read where the change started from `origin`.
 * `?face=` is applied to <html> by the script in index.html before first paint, so this only reads it back.
 */
export function useFace(): {
  face: Face
  origin: MutableRefObject<Origin>
  toggle: (area: AreaId, src?: Source) => void
} {
  const [face, setFace] = useState<Face>(linkedFace)
  const faceRef = useRef(face)
  const origin = useRef<Origin>([0, 0])

  useLayoutEffect(() => {
    faceRef.current = face
    document.documentElement.dataset.face = face
  }, [face])

  const change = useCallback((next: Face, src?: Source) => {
    if (next === faceRef.current) return
    origin.current = originOf(src)
    setFace(next)
  }, [])

  const toggle = useCallback((area: AreaId, src?: Source) => {
    change(faceRef.current === area ? 'neutral' : area, src)
  }, [change])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target instanceof Element && /input|textarea|select/i.test(e.target.tagName))) return
      const i = '1234'.indexOf(e.key)
      const card = (id: string) => document.querySelector(`.ac[data-area="${id}"]`) ?? undefined
      if (i >= 0 && e.key.length === 1) toggle(AREAS[i].id, card(AREAS[i].id))
      else if (e.key === 'Escape' && faceRef.current !== 'neutral') change('neutral', card(faceRef.current))
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [toggle, change])

  return { face, origin, toggle }
}
