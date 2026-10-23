import { Fragment, type CSSProperties } from 'react'

/** Animated hover text: the full label for assistive tech, plus per-character spans that ripple on hover. */
export function Chars({ text }: { text: string }) {
  return (
    <>
      <span className="sr">{text}</span>
      {[...text].map((ch, i) => (
        <span key={i} className={ch === ' ' ? 'ch sp' : 'ch'} style={{ '--i': i } as CSSProperties} aria-hidden="true">
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </>
  )
}

/** Words wrapped for the masked slide-in of [data-split] headings; the heading carries the aria-label. */
export function Words({ text }: { text: string }) {
  return text.split(/\s+/).filter(Boolean).map((word, i, all) => (
    <Fragment key={i}>
      <span className="w" aria-hidden="true">
        <span className="w__i" style={{ '--i': i } as CSSProperties}>{word}</span>
      </span>
      {i < all.length - 1 ? ' ' : null}
    </Fragment>
  ))
}
