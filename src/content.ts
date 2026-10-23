import today from './assets/trainlog/today.webp'
import importReview from './assets/trainlog/import-review.webp'
import progress from './assets/trainlog/progress.webp'
import exerciseHistory from './assets/trainlog/exercise-history.webp'
import reactor from './assets/pieces/reactor.webp'
import arcade from './assets/pieces/arcade.webp'
import neuralNetwork from './assets/pieces/neural-network.webp'
import dataTower from './assets/pieces/data-tower.webp'
import v8Engine from './assets/pieces/v8-engine.webp'
import v8Exploded from './assets/pieces/v8-exploded.webp'

export type AreaId = 'fullstack' | 'ai' | 'data' | 'design'

export type Area = {
  id: AreaId
  name: string
  /** The area's palette, shown as the card's edge strip. */
  edge: string[]
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
  /** Images for the carousel; `wide` frames them as landscape renders instead of phone screens. */
  shots?: { src: string; alt: string }[]
  wide?: boolean
  /** Plugins for the terminal. */
  plugins?: Plugin[]
}

export const EMAIL = 'josuee152@gmail.com'
export const GITHUB = 'https://github.com/sue-btis'
export const LINKEDIN = 'https://mx.linkedin.com/in/escobarjosue'

const AREA_DEFS: Area[] = [
  { id: 'fullstack', name: 'Full-stack & Product', edge: ['#B23850', '#3B8BEB', '#E7E3D4', '#C4DBF6', '#8590AA'] },
  { id: 'ai', name: 'AI & Agents', edge: ['#304C64', '#26788E', '#631B08', '#A4CCD4', '#E2480C'] },
  { id: 'data', name: 'Data & Analytics', edge: ['#3D52A0', '#7091E6', '#8697C4', '#ADBBDA', '#EDE8F5'] },
  { id: 'design', name: '3D & Engineering design', edge: ['#141414', '#273DB4', '#C50900', '#F95CA4', '#ED7845'] },
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
  {
    id: 'pieces',
    area: 'design',
    title: 'Hero pieces',
    pitch: 'The five 3D objects on this site, generated entirely from code.',
    steps: [
      ['Built', 'A Python script run headless in Blender 5.2 defines every part, its material role and its exploded position. The 3D & Engineering piece is a cross-plane V8 whose pistons and rods move with the crank angle.'],
      ['Baked', 'Ambient occlusion is baked per vertex in Cycles, then each piece is exported as a Draco-compressed GLB.'],
      ['Shipped', 'three.js loads them on demand: they are the hero object, and they come apart and reassemble when you change area.'],
    ],
    stack: { label: 'Pipeline', items: ['Blender 5.2', 'Python', 'Cycles', 'Draco GLB', 'three.js'] },
    proof: ['5 pieces', '20 to 38 parts each', '23k to 31k triangles each'],
    meta: [['Pipeline', 'Blender 5.2, Python'], ['Output', '5 Draco GLBs']],
    links: [],
    wide: true,
    shots: [
      { src: v8Engine, alt: 'V8 engine piece, assembled' },
      { src: v8Exploded, alt: 'The same V8 engine, exploded into its parts' },
      { src: reactor, alt: 'Reactor piece, the home object' },
      { src: arcade, alt: 'Arcade cabinet piece, for Full-stack' },
      { src: neuralNetwork, alt: 'Neural network piece, for AI' },
      { src: dataTower, alt: 'Data tower piece, for Data' },
    ],
  },
]

/** Areas shown on the site: an area appears once it has a project, so adding one brings it back. */
export const AREAS: Area[] = AREA_DEFS.filter((a) => PROJECTS.some((p) => p.area === a.id))

export const TIMELINE: { when: string; what: string; where?: string }[] = [
  { when: '2018', what: 'Mechatronics technician', where: 'CBTis 122' },
  { when: '2024', what: 'Biomedical engineer', where: 'UACH' },
  { when: '2024', what: 'QA data analysis intern', where: 'Teleflex' },
  { when: '2025', what: 'Data scientist', where: "Waldo's" },
  { when: 'Now', what: 'Ecosat' },
]

export const HERO = {
  line: 'Engineer who builds across the stack — web, data, AI and\u00a03D.',
  by: 'Started in mechatronics, still building things that work.',
  lead: "I'm Josue Escobar, a full-stack and AI engineer. Pick an area to see the site the way that work looks, or just scroll.",
  hint: 'Move your cursor — the object follows',
}

export const WORK_NOTE = 'Each project carries its proof: code you can read and the real thing on screen.'

export const ABOUT_INTRO = [
  'I learned to build on machines before I built software: wiring, controllers, parts that have to fit. That habit stayed. I start from how the thing is used, then build the whole of it.',
  'Off the clock: sports and music.',
]

export const OWNER = 'Josue Escobar'
export const CLOSE_LINE = 'Have something that needs building?'
