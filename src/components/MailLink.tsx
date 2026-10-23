import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { EMAIL } from '../content'

const SHOWN_MS = 2400

/** A mailto link that also copies the address, for visitors whose browser has no mail app. The status text is the confirmation, visible and announced. */
export function MailLink({ children, side = 'left', ...rest }: ComponentProps<'a'> & { side?: 'left' | 'right' }) {
  const [status, setStatus] = useState('')
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = () => {
    const done = (text: string) => {
      setStatus(text)
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setStatus(''), SHOWN_MS)
    }
    if (!navigator.clipboard) return done(EMAIL)
    navigator.clipboard.writeText(EMAIL).then(() => done('Email copied'), () => done(EMAIL))
  }

  return (
    <span className="mailwrap">
      <a href={`mailto:${EMAIL}`} onClick={copy} {...rest}>{children}</a>
      <span className="copied" data-side={side} data-on={status ? '' : undefined} role="status">{status}</span>
    </span>
  )
}
