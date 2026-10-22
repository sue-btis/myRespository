import today from './assets/trainlog/today.webp'
import importReview from './assets/trainlog/import-review.webp'
import progress from './assets/trainlog/progress.webp'
import exerciseHistory from './assets/trainlog/exercise-history.webp'

export type AreaId = 'fullstack' | 'ai' | 'data' | 'design'

export type Area = {
  id: AreaId
  num: string
  name: string
  /** The module's palette, shown as the slot's edge strip. */
  edge: string[]
}

export type Project = {
  id: string
  area: AreaId
  title: string
  desc: string
  spec: [term: string, detail: string][]
  links: { label: string; href: string }[]
  pending?: string
  shots?: { src: string; alt: string }[]
  parts?: { name: string; version: string; desc: string }[]
}

export const EMAIL = 'josuee152@gmail.com'
export const GITHUB = 'https://github.com/sue-btis'

export const AREAS: Area[] = [
  { id: 'fullstack', num: '01', name: 'Full-stack & Product', edge: ['#B23850', '#3B8BEB', '#E7E3D4', '#C4DBF6', '#8590AA'] },
  { id: 'ai', num: '02', name: 'AI & Agents', edge: ['#304C64', '#26788E', '#631B08', '#A4CCD4', '#E2480C'] },
  { id: 'data', num: '03', name: 'Data & Analytics', edge: ['#3D52A0', '#7091E6', '#8697C4', '#ADBBDA', '#EDE8F5'] },
  { id: 'design', num: '04', name: '3D & Engineering design', edge: ['#141414', '#273DB4', '#C50900', '#F95CA4', '#ED7845'] },
]

export const PROJECTS: Project[] = [
  {
    id: 'trainlog',
    area: 'fullstack',
    title: 'TrainLog',
    desc: 'An offline-first training PWA. You write your programme as a YAML file; the app runs it in the gym, records what you actually did, and works out your next load from that record.',
    spec: [
      ['Area', '01 Full-stack & Product'],
      ['Built for', 'A phone, in a gym, with unreliable signal. No account, no server.'],
      ['Stack', 'React, TypeScript, PWA'],
      ['Rigor', 'Mutation testing, architecture decision records'],
    ],
    links: [{ label: 'Source', href: 'https://github.com/sue-btis/TrainLog' }],
    pending: 'Live demo · URL pending',
    shots: [
      { src: today, alt: 'TrainLog Today screen: the workout planned for today' },
      { src: importReview, alt: 'Reviewing an imported routine file' },
      { src: progress, alt: 'Progress: best estimated 1RM and load over time' },
      { src: exerciseHistory, alt: 'Front Squat history: working weight and every session' },
    ],
  },
  {
    id: 'changesmith',
    area: 'ai',
    title: 'ChangeSmith',
    desc: 'Plugins that make coding agents work like a careful engineer: shape the change, write the spec, plan, implement, then verify it independently.',
    spec: [
      ['Area', '02 AI & Agents'],
      ['Runs in', 'Claude Code and Codex'],
      ['Rigor', 'CI on Node 24, plugin validation'],
    ],
    links: [{ label: 'Source', href: 'https://github.com/sue-btis/ChangeSmith' }],
    parts: [
      { name: 'software-design-skills', version: '1.2.0', desc: 'From product brief to PRD, system design, design review and a build plan.' },
      { name: 'compact-change-skills', version: '3.0.0', desc: 'Shape, audit, spec, plan, implement and verify one change at a time.' },
    ],
  },
]

export const TIMELINE = [
  { when: '2018', what: 'Mechatronics technician', where: 'CBTis 122' },
  { when: '2024', what: 'Biomedical engineer', where: 'UACH' },
  { when: '2024', what: 'QA data analysis intern', where: 'Teleflex' },
  { when: '2025', what: 'Data scientist', where: "Waldo's" },
  { when: 'Now', what: 'Ecosat', where: 'Role title pending' },
]

// An area goes live only once it holds a project; until then its slot is not rendered.
export const PUBLISHED_AREAS = AREAS.filter((area) => PROJECTS.some((p) => p.area === area.id))
