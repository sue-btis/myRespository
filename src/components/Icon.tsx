const ICONS = {
  mail: { box: '0 0 24 24', d: 'M3 6h18v12H3zM3 6l9 7 9-7', width: 1.8 },
  linkedin: { box: '0 0 24 24', d: 'M4 4h16v16H4zM8 10v6M8 7.5v.01M12 16v-6m0 3c0-2 1.2-3 2.6-3S17 11 17 13v3', width: 1.8 },
  github: {
    box: '0 0 18 18',
    d: 'M6.8 15.5v-2.3c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.8v2.6',
    width: 1.3,
  },
  arrow: { box: '0 0 16 16', d: 'M4 12 12 4M6 4h6v6', width: 1.8, cap: 'square' },
  drag: { box: '0 0 24 24', d: 'M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4', width: 1.8, cap: 'round' },
} as const

export type IconName = keyof typeof ICONS

export function Icon({ name }: { name: IconName }) {
  const icon = ICONS[name]
  return (
    <svg viewBox={icon.box} aria-hidden="true">
      <path
        d={icon.d}
        fill="none"
        stroke="currentColor"
        strokeWidth={icon.width}
        strokeLinejoin="round"
        strokeLinecap={'cap' in icon ? icon.cap : undefined}
      />
    </svg>
  )
}
