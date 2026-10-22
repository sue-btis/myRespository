import { useEffect, useState, type ReactNode } from 'react'

/** A link whose target does not exist yet: never looks live, and says so when tapped (touch has no tooltip). */
export function PendingLink({ label, children }: { label: string; children: ReactNode }) {
  const [told, setTold] = useState(false)

  useEffect(() => {
    if (!told) return
    const t = setTimeout(() => setTold(false), 1800)
    return () => clearTimeout(t)
  }, [told])

  return (
    <span
      className={told ? 'pending-link is-told' : 'pending-link'}
      role="note"
      tabIndex={0}
      title="Link pending"
      onClick={() => setTold(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setTold(true)
        }
      }}
    >
      {children}
      <span className="visually-hidden">{label} (link pending)</span>
    </span>
  )
}
