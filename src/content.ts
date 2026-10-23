import today from './assets/trainlog/today.webp'
import importReview from './assets/trainlog/import-review.webp'
import progress from './assets/trainlog/progress.webp'
import exerciseHistory from './assets/trainlog/exercise-history.webp'

export type AreaId = 'fullstack' | 'ai' | 'data' | 'design'

export type Area = {
  id: AreaId
  num: string
  name: string
  /** The area's palette, shown as the card's edge strip. */
  edge: string[]
  /** Shown on the placeholder card while the area has no project. */
  wip?: string
}

export type Plugin = {
  name: string
  version: string
  desc: string
  stages: string[]
  /** Qualifier shown after a stage, keyed by stage name. */
  notes?: Record<string, string>
  /** Closing line printed once every stage has run. */
  tail?: string
}

export type Project = {
  id: string
  area: AreaId
  title: string
  pitch: string
  /** Labelled lines (Problem, Built, Proof...) shown beside the project's visual. */
  steps: [label: string, text: string][]
  stack: { label: string; items: string[] }
  proof: string[]
  /** Short facts printed on the project's cartridge. */
  meta: [term: string, detail: string][]
  links: { label: string; href: string }[]
  pending?: string
  /** Screens for the carousel. */
  shots?: { src: string; alt: string }[]
  /** Plugins for the terminal. */
  plugins?: Plugin[]
}

export const EMAIL = 'josuee152@gmail.com'
export const GITHUB = 'https://github.com/sue-btis'
export const LINKEDIN = 'https://mx.linkedin.com/in/escobarjosue'

export const AREAS: Area[] = [
  { id: 'fullstack', num: '01', name: 'Full-stack & Product', edge: ['#B23850', '#3B8BEB', '#E7E3D4', '#C4DBF6', '#8590AA'] },
  { id: 'ai', num: '02', name: 'AI & Agents', edge: ['#304C64', '#26788E', '#631B08', '#A4CCD4', '#E2480C'] },
  { id: 'data', num: '03', name: 'Data & Analytics', edge: ['#3D52A0', '#7091E6', '#8697C4', '#ADBBDA', '#EDE8F5'], wip: 'No project here yet. A data project lands here; until then, you can preview how this area looks.' },
  { id: 'design', num: '04', name: '3D & Engineering design', edge: ['#141414', '#273DB4', '#C50900', '#F95CA4', '#ED7845'], wip: 'No project here yet. A 3D or CAD piece lands here; until then, you can preview how this area looks.' },
]

export const PROJECTS: Project[] = [
  {
    id: 'trainlog',
    area: 'fullstack',
    title: 'TrainLog',
    pitch: 'Write your programme as a YAML file. The app runs it in the gym and works out your next load.',
    steps: [
      ['Problem', 'A phone, in a gym, with unreliable signal. No account, no server.'],
      ['Built', 'An offline-first training PWA. It records what you actually did and works out your next load from that record.'],
      ['Proof', 'Mutation testing and architecture decision records, with the source open on GitHub.'],
    ],
    stack: { label: 'Stack', items: ['React', 'TypeScript', 'PWA'] },
    proof: ['Mutation testing', 'ADRs', 'Offline-first'],
    meta: [['Stack', 'React, TypeScript, PWA'], ['Rigor', 'Mutation testing, ADRs']],
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
    pitch: 'Plugins that make coding agents work like a careful engineer.',
    steps: [
      ['Aim', 'Coding agents that shape the change, write the spec, plan, implement, then verify it independently.'],
      ['Built', 'Two plugins: software-design-skills from brief to build plan, and compact-change-skills from shape to verify, one change at a time.'],
      ['Proof', 'CI on Node 24 and plugin validation, with the source open on GitHub.'],
    ],
    stack: { label: 'Runs in', items: ['Claude Code', 'Codex'] },
    proof: ['CI on Node 24', 'Plugin validation'],
    meta: [['Runs in', 'Claude Code, Codex'], ['Rigor', 'CI on Node 24, plugin validation']],
    links: [{ label: 'Source', href: 'https://github.com/sue-btis/ChangeSmith' }],
    plugins: [
      {
        name: 'software-design-skills',
        version: '1.2.0',
        desc: 'From product brief to PRD, system design, design review and a build plan.',
        stages: ['brief', 'PRD', 'system design', 'design review', 'build plan'],
      },
      {
        name: 'compact-change-skills',
        version: '3.0.0',
        desc: 'Shape, audit, spec, plan, implement and verify one change at a time.',
        stages: ['shape', 'audit', 'spec', 'plan', 'implement', 'verify'],
        notes: { verify: 'independently' },
        tail: 'one change at a time',
      },
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

export const HERO = {
  line: 'Engineer who builds across the stack — web, data, AI and\u00a03D.',
  by: 'Started in mechatronics, still building things that work.',
  lead: "I'm Josue Escobar, a full-stack and AI engineer. Pick an area to see the site the way that work looks, or just scroll.",
  hint: 'Move your cursor — the object follows',
  hintTouch: 'Drag the object or tilt your phone',
}

export const WORK_NOTE = 'Each project carries its proof: code you can read and screens from the real thing. Pick a slot to load it.'

export const ABOUT_INTRO = [
  'I learned to build on machines before I built software: wiring, controllers, parts that have to fit. That habit stayed. I start from how the thing is used, then build the whole of it.',
  'Off the clock: sports and music.',
]

export const CLOSE_LINE = 'Have something that needs building?'
export const FOOTER = ['Josue Escobar', 'Dashed items have no link yet.']
