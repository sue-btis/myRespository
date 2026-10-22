import { useCallback, useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { PUBLISHED_AREAS, type AreaId } from './content'

export type Face = 'neutral' | AreaId

function linkedFace(): Face {
  const asked = new URLSearchParams(location.search).get('face')
  return PUBLISHED_AREAS.find((a) => a.id === asked)?.id ?? 'neutral'
}

// The seat animation grows out of (or, on eject, back into) the pressed slot's box.
function setSeatOrigin(slot: HTMLElement) {
  const r = slot.getBoundingClientRect()
  const s = document.documentElement.style
  s.setProperty('--from-t', `${Math.max(0, r.top)}px`)
  s.setProperty('--from-r', `${innerWidth - r.right}px`)
  s.setProperty('--from-b', `${Math.max(0, innerHeight - r.bottom)}px`)
  s.setProperty('--from-l', `${r.left}px`)
}

/** Current face of the site, applied to <html data-face>, with the view-transition seat when switching. */
export function useFace() {
  const [face, setFace] = useState<Face>(linkedFace)

  useLayoutEffect(() => {
    document.documentElement.dataset.face = face
  }, [face])

  const toggle = useCallback((area: AreaId, slot: HTMLElement) => {
    const root = document.documentElement
    const next: Face = root.dataset.face === area ? 'neutral' : area
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduce) {
      setFace(next)
      return
    }
    setSeatOrigin(slot)
    root.classList.toggle('ejecting', next === 'neutral')
    // flushSync so the new face is in the DOM before the transition snapshots it.
    document
      .startViewTransition(() => flushSync(() => setFace(next)))
      .finished.finally(() => root.classList.remove('ejecting'))
  }, [])

  return { face, toggle }
}
