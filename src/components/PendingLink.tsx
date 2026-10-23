import type { ReactNode } from 'react'

/** A link whose target does not exist yet: dashed, never an anchor, and named as pending for assistive tech. */
export function PendingLink({ label, className = 'pend', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <span className={className} title="Link pending">
      {children}
      <span className="sr">{label} (link pending)</span>
    </span>
  )
}
