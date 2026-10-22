const PATHS = {
  arrow: { box: '0 0 16 16', d: 'M4 12 12 4M6 4h6v6', width: 1.6 },
  mail: { box: '0 0 16 16', d: 'M2 4h12v8H2zM2 4l6 5 6-5', width: 1.5 },
  cv: { box: '0 0 18 18', d: 'M4 2h7l3 3v11H4zM11 2v3h3M7 9h4M7 12h4', width: 1.5 },
  linkedin: { box: '0 0 18 18', d: 'M2.5 2.5h13v13h-13zM6 8v5M6 5.5v.01M9 13V8m0 2.5c0-1.5 1-2.5 2.2-2.5S13 9 13 10.5V13', width: 1.5 },
  github: {
    box: '0 0 18 18',
    d: 'M6.8 15.5v-2.3c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.8v2.6',
    width: 1.3,
  },
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const { box, d, width } = PATHS[name]
  return (
    <svg className={className} viewBox={box} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={width} strokeLinejoin="round" />
    </svg>
  )
}
