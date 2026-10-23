export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
export const reducedMotion = () => matchMedia(REDUCED_MOTION_QUERY).matches
export const finePointer = () => matchMedia('(hover:hover) and (pointer:fine)').matches
export const coarsePointer = () => matchMedia('(pointer:coarse)').matches
