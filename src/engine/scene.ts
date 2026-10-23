import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Face } from '../useFace'

export type SceneApi = {
  setFace(face: Face): void
  /** Starts fetching a face's piece without showing it, for when the visitor signals they may pick it. */
  prefetch(face: Face): void
  setHeroProgress(p: number): void
  destroy(): void
}

// Imported through Vite so each GLB gets a content-hashed URL and a re-export busts the long cache.
const MODEL_URLS = import.meta.glob<string>('../assets/models/*.glb', { query: '?url', import: 'default', eager: true })

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2)
const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]

const ROLES = ['cuerpo', 'secundario', 'metal', 'acento', 'vidrio'] as const
type Role = (typeof ROLES)[number]

// Duplicated from the CSS tokens: during the face switch computed styles are mid-transition.
const PAL: Record<Face, { plate: string; ink: string; signal: string }> = {
  neutral: { plate: '#77A6F7', ink: '#1B2A4A', signal: '#00887A' },
  fullstack: { plate: '#3B8BEB', ink: '#14264A', signal: '#B23850' },
  ai: { plate: '#26788E', ink: '#26425A', signal: '#E2480C' },
  data: { plate: '#ADBBDA', ink: '#26346B', signal: '#7091E6' },
  design: { plate: '#273DB4', ink: '#1E1E1E', signal: '#ED7845' },
}

const TARGET_RADIUS = 2.7
const EXPLODE = 0.85
const STAGGER = 0.45
const OUT_SECONDS = 0.5
const IN_SECONDS = 0.8
// The incoming piece starts assembling once every other piece is this far into leaving.
const GATE = 0.55
const PACKETS = 8

/** Idle life of a part. Waves are [amplitude, angular speed, phase]; bob and slide amplitudes are fractions of the piece radius. */
type Motion = {
  spin?: number
  axis?: THREE.Vector3
  tumble?: [axis: THREE.Vector3, speed: number]
  bob?: Wave
  pulse?: Wave
  slide?: Wave
  /** Slider-crank: the part moves along `stroke` with the crank angle and, for a rod, swings about `swing`. */
  crank?: { stroke: THREE.Vector3; phase: number; swing?: THREE.Vector3; ratio?: number }
  play?: Play
}
/** Arcade cabinet behaviours, all driven by glTF extras (see arcadeMotion). */
type Play =
  | { kind: 'tilt'; a: THREE.Vector3; b: THREE.Vector3; amp: number; ph: number }
  | { kind: 'press'; move: THREE.Vector3; ph: number }
  | { kind: 'invaders'; side: THREE.Vector3; drop: THREE.Vector3 }
  | { kind: 'ship'; side: THREE.Vector3; ph: number }
  | { kind: 'shot'; up: THREE.Vector3; side: THREE.Vector3; ph: number }
type Wave = [amp: number, w: number, ph: number]
type Part = {
  node: THREE.Object3D
  base: THREE.Vector3
  q0: THREE.Quaternion
  offset: THREE.Vector3
  dir: THREE.Vector3
  delay: number
  twist: number
  motion: Motion
}
type Edge = { a: Part; b: Part }
type Packets = { update(dt: number, k: number): void; dispose(): void }
type Bars = { update(t: number, life: number): void }
type Piece = {
  face: Face
  wrap: THREE.Group
  spinner: THREE.Group
  parts: Part[]
  k: number
  turn: number
  radius: number
  packets: Packets | null
  bars: Bars | null
}

const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)
const X = new THREE.Vector3(1, 0, 0)
const XZ = new THREE.Vector3(1, 0, 1).normalize()
const WHITE = new THREE.Color(1, 1, 1)
const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qc = new THREE.Quaternion()

function roleOf(name: string): Role {
  return ROLES.find((r) => name.startsWith(r)) ?? 'cuerpo'
}

/** The glTF `explota` extra comes out of Blender in Z-up axes, while the node transforms are already Y-up. */
function explodeOffset(v: number[] | undefined) {
  return v ? new THREE.Vector3(v[0], v[2], -v[1]) : new THREE.Vector3()
}

const num = (name: string) => Number(name.match(/_(\d+)$/)?.[1] ?? 0)
const alt = (name: string) => (num(name) % 2 ? 1 : -1)

/** What each part does while the piece is assembled, so pieces read as working machines rather than statues. */
function motionFor(face: Face, part: string, extras: Record<string, unknown>): Motion {
  const n = num(part)
  switch (face) {
    case 'neutral':
      // Gyroscope: each orbit tumbles about a different axis while it also spins in its own plane.
      if (part.startsWith('anillo')) return { spin: [0.5, -0.38, 0.27][n - 1] ?? 0.3, tumble: [[X, Z, XZ][n - 1] ?? X, [0.42, -0.34, 0.28][n - 1] ?? 0.3] }
      if (part === 'corazon') return { pulse: [0.07, 2.4, 0] }
      if (part.startsWith('bobina')) return { pulse: [0.06, 3.1, n * 1.4] }
      if (part.startsWith('inyector')) return { bob: [0.012, 1.6, part.endsWith('superior') ? 0 : Math.PI] }
      if (part === 'tapa') return { spin: 0.12, bob: [0.006, 1.2, 0.5] }
      return {}
    case 'fullstack': {
      const play = arcadeMotion(extras)
      return part === 'pantalla_hud' || part === 'rotulo' ? { ...play, pulse: [0.012, 2.4, 0] } : play
    }
    case 'ai':
      if (part.startsWith('nodo')) return { pulse: [0.12, 2.6, n * 0.8], bob: [0.006, 1.4, n] }
      if (part.startsWith('marco')) return { bob: [0.005, 0.9, n * 1.3] }
      return {}
    case 'data':
      if (part.startsWith('aro')) return { spin: 0.45 * alt(part) }
      if (part.startsWith('disco')) return { spin: -0.25 * alt(part) }
      if (part === 'cursor') return { bob: [0.06, 0.7, 0] }
      if (part === 'faro') return { spin: 2.2, pulse: [0.1, 3, 0] }
      if (part === 'corona') return { spin: 0.3 }
      return {}
    case 'design':
      // The V8 is driven entirely by its glTF extras (see engineMotion).
      return {}
  }
}

// Crank speed of the V8 in rad/s: slow enough that the pistons read.
const CRANK = 2.6
const blender = (v: unknown) => (Array.isArray(v) ? explodeOffset(v as number[]) : undefined)

/**
 * The V8 exports its kinematics as extras (Blender axes, see modelos/README.md): `giro` + `relacion` for everything
 * the crank turns, `carrera` + `fase` for pistons and rods, `oscila` + `balanceo` for the rods' swing.
 */
function engineMotion(data: Record<string, unknown>): Motion {
  const giro = blender(data.giro), carrera = blender(data.carrera)
  if (giro) return { tumble: [giro.normalize(), CRANK * Number(data.relacion ?? 1)] }
  if (carrera) {
    const swing = blender(data.oscila)
    return { crank: { stroke: carrera, phase: Number(data.fase ?? 0), swing: swing?.normalize(), ratio: Number(data.balanceo ?? 0) } }
  }
  return {}
}

const STEP_RATE = 2.2
const STEPS = 6
const SHIP_SPEED = 0.9
const SHOT_PERIOD = 1.1
const TAP_SPEED = 5

/**
 * The arcade exports its play as extras (Blender axes, see modelos/README.md): `inclina` + `inclina_b` + `amplitud` for
 * the joysticks, `presiona` for button caps, `desliza` (+ `baja` for the invader block, + `dispara` for shots) for the screen layers.
 */
function arcadeMotion(data: Record<string, unknown>): Motion {
  const ph = Number(data.fase ?? 0)
  const tilt = blender(data.inclina), tiltB = blender(data.inclina_b)
  if (tilt && tiltB) return { play: { kind: 'tilt', a: tilt.normalize(), b: tiltB.normalize(), amp: Number(data.amplitud ?? 0.3), ph } }
  const press = blender(data.presiona)
  if (press) return { play: { kind: 'press', move: press, ph } }
  const side = blender(data.desliza), drop = blender(data.baja), up = blender(data.dispara)
  if (side && up) return { play: { kind: 'shot', up, side, ph } }
  if (side && drop) return { play: { kind: 'invaders', side, drop } }
  if (side) return { play: { kind: 'ship', side, ph } }
  return {}
}

/** Position part of the arcade play; `life` fades it out while the part flies apart. */
function playMove(g: Play, t: number, life: number, n: THREE.Object3D) {
  switch (g.kind) {
    case 'press':
      n.position.addScaledVector(g.move, Math.max(0, Math.sin(TAP_SPEED * t + g.ph)) ** 4 * life)
      break
    case 'invaders': {
      // Classic march: whole-step jumps, one row down on the way back.
      const c = Math.floor(t * STEP_RATE) % (2 * STEPS)
      const u = c < STEPS ? c : 2 * STEPS - c
      n.position.addScaledVector(g.side, (2 * u / STEPS - 1) * life).addScaledVector(g.drop, (c >= STEPS ? 1 : 0) * life)
      break
    }
    case 'ship':
      n.position.addScaledVector(g.side, Math.sin(SHIP_SPEED * t + g.ph) * life)
      break
    case 'shot': {
      const f = (t / SHOT_PERIOD + g.ph / (2 * Math.PI)) % 1
      // The bullet keeps the column its ship had when it was fired.
      const fired = t - f * SHOT_PERIOD
      n.position.addScaledVector(g.side, Math.sin(SHIP_SPEED * fired + g.ph) * life).addScaledVector(g.up, f * life)
      // Scaling would shrink it towards the part origin (the screen centre), so it vanishes by hiding instead.
      n.visible = life < 0.02 || f < 0.9
      break
    }
  }
}

/**
 * The data tower's bars rise and fall one by one like a live chart. Each `barras_N` mesh holds a whole ring of bars,
 * so bars are found as connected components (vertices welded by position, since flat shading splits them per face)
 * and their heights are rewritten on the CPU each frame.
 */
function createBars(g: THREE.Object3D): Bars | null {
  type Bar = { idx: number[]; bottom: number; w: number; ph: number }
  const sets: { attr: THREE.BufferAttribute; y0: Float32Array; bars: Bar[] }[] = []
  g.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || !/data__barras_/.test(o.name + o.parent?.name)) return
    const attr = o.geometry.getAttribute('position') as THREE.BufferAttribute
    const index = o.geometry.getIndex()
    const n = attr.count
    const parent = Int32Array.from({ length: n }, (_, i) => i)
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
    const join = (a: number, b: number) => { parent[find(a)] = find(b) }
    const at = new Map<string, number>()
    for (let i = 0; i < n; i++) {
      const key = `${attr.getX(i).toFixed(4)},${attr.getY(i).toFixed(4)},${attr.getZ(i).toFixed(4)}`
      const first = at.get(key)
      if (first === undefined) at.set(key, i)
      else join(i, first)
    }
    const tri = (k: number) => (index ? index.getX(k) : k)
    const count = index ? index.count : n
    for (let k = 0; k < count; k += 3) { join(tri(k), tri(k + 1)); join(tri(k), tri(k + 2)) }
    const groups = new Map<number, number[]>()
    for (let i = 0; i < n; i++) { const r = find(i); groups.set(r, [...(groups.get(r) ?? []), i]) }
    const y0 = Float32Array.from({ length: n }, (_, i) => attr.getY(i))
    let seed = sets.length * 97 + 13
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const bars = [...groups.values()].map((idx) => ({
      idx, bottom: Math.min(...idx.map((i) => y0[i])), w: 1.1 + rand() * 1.6, ph: rand() * Math.PI * 2,
    }))
    attr.setUsage(THREE.DynamicDrawUsage)
    sets.push({ attr, y0, bars })
  })
  if (!sets.length) return null
  return {
    update(t, life) {
      for (const { attr, y0, bars } of sets) {
        for (const b of bars) {
          const s = 1 - life * 0.6 * (0.5 + 0.5 * Math.sin(b.w * t + b.ph))
          for (const i of b.idx) attr.setY(i, b.bottom + (y0[i] - b.bottom) * s)
        }
        attr.needsUpdate = true
      }
    },
  }
}

/** Glowing packets that walk the AI piece's edges layer by layer, following the nodes' current positions. */
function createPackets(parts: Part[], g: THREE.Object3D, accent: THREE.Color): Packets {
  const byName = new Map(parts.map((p) => [p.node.name, p]))
  const outgoing = new Map<Part, Edge[]>()
  const entries: Edge[] = []
  for (const p of parts) {
    const spec = p.node.userData.arista as string | undefined
    if (!spec) continue
    const [a, b] = spec.split('>').map((n) => byName.get(`ai__${n}`))
    if (!a || !b) continue
    outgoing.set(a, [...(outgoing.get(a) ?? []), { a, b }])
    if (a.node.userData.capa === 1) entries.push({ a, b })
  }

  const geo = new THREE.SphereGeometry(1, 12, 8)
  const core = new THREE.MeshBasicMaterial({ toneMapped: false })
  const halo = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  const coreMesh = new THREE.InstancedMesh(geo, core, PACKETS)
  const haloMesh = new THREE.InstancedMesh(geo, halo, PACKETS)
  for (const m of [coreMesh, haloMesh]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; g.add(m) }

  const walkers = Array.from({ length: PACKETS }, (_, i) => ({ edge: null as Edge | null, f: 0, wait: i * 0.35, speed: 0.9 }))
  const M = new THREE.Matrix4(), pos = new THREE.Vector3()

  return {
    update(dt, k) {
      core.color.copy(accent).lerp(WHITE, 0.55)
      halo.color.copy(accent)
      walkers.forEach((w, i) => {
        let s = 0
        if (w.edge) {
          w.f += dt * w.speed
          if (w.f >= 1) {
            const next = outgoing.get(w.edge.b)
            w.edge = next ? pick(next) : null
            w.f = 0
            if (!w.edge) w.wait = 0.4 + Math.random() * 0.8
          }
        } else if ((w.wait -= dt) <= 0) {
          w.edge = pick(entries)
          w.f = 0
          w.speed = 0.75 + Math.random() * 0.35
        }
        if (w.edge) {
          pos.lerpVectors(w.edge.a.node.position, w.edge.b.node.position, w.f)
          s = Math.min(1, w.f * 5, (1 - w.f) * 5) * (1 - k) * 0.075
        }
        M.makeScale(s, s, s).setPosition(pos)
        coreMesh.setMatrixAt(i, M)
        M.makeScale(s * 1.9, s * 1.9, s * 1.9).setPosition(pos)
        haloMesh.setMatrixAt(i, M)
      })
      coreMesh.instanceMatrix.needsUpdate = true
      haloMesh.instanceMatrix.needsUpdate = true
    },
    dispose() {
      g.remove(coreMesh, haloMesh)
      geo.dispose(); core.dispose(); halo.dispose()
      coreMesh.dispose(); haloMesh.dispose()
    },
  }
}

/** The hero object: one baked GLB piece per face that comes apart and reassembles on change, and follows the cursor, tilt or drag. Pauses offscreen and when hidden. */
export async function initScene(stage: HTMLElement, startFace: Face, coarse: boolean): Promise<SceneApi> {
  const ac = new AbortController()
  const { signal } = ac
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  stage.prepend(renderer.domElement)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60)
  camera.position.set(0, 0.3, 9.6); camera.lookAt(0, 0, 0)

  // Baked AO carries the depth, so the lighting stays flat and soft; the environment only feeds metal reflections.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8890a0, 1.5))
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(3, 5, 6); scene.add(key)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const envMap = pmrem.fromScene(room, 0.04)
  scene.environment = envMap.texture
  scene.environmentIntensity = 0.45
  room.dispose()

  const rig = new THREE.Group(); scene.add(rig)

  const mats: Record<Role, THREE.MeshStandardMaterial> = {
    cuerpo: new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0, vertexColors: true }),
    secundario: new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.15, vertexColors: true }),
    metal: new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.8, vertexColors: true }),
    acento: new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0, vertexColors: true, emissiveIntensity: 0.6 }),
    vidrio: new THREE.MeshPhysicalMaterial({ roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, depthWrite: false }),
  }
  const targets = Object.fromEntries(ROLES.map((r) => [r, new THREE.Color()])) as Record<Role, THREE.Color>
  function paint(face: Face, k: number) {
    const { plate, ink, signal } = PAL[face]
    targets.cuerpo.set(plate); targets.secundario.set(ink); targets.acento.set(signal)
    targets.metal.set('#C9CDD3').lerp(targets.cuerpo, 0.15)
    targets.vidrio.set('#DCEBF5')
    for (const r of ROLES) mats[r].color.lerp(targets[r], k)
    mats.acento.emissive.copy(mats.acento.color)
  }

  const waveGeo = new THREE.RingGeometry(0.96, 1, 64)
  const waveMat = new THREE.MeshBasicMaterial({ color: PAL[startFace].signal, transparent: true, opacity: 0, depthWrite: false })
  const wave = new THREE.Mesh(waveGeo, waveMat)
  wave.rotation.x = -Math.PI / 2; wave.position.y = -1.9; scene.add(wave)

  const draco = new DRACOLoader()
    .setDecoderPath(`${import.meta.env.BASE_URL}draco/`)
    .setDecoderConfig({ type: 'wasm' })
    .setWorkerLimit(1)
  const loader = new GLTFLoader().setDRACOLoader(draco)

  const pieces = new Map<Face, Piece>()
  const loading = new Map<Face, Promise<Piece>>()
  let dead = false

  function disposePiece(p: Piece) {
    p.packets?.dispose()
    p.wrap.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose() })
    rig.remove(p.wrap)
  }

  async function build(face: Face): Promise<Piece> {
    const gltf = await loader.loadAsync(MODEL_URLS[`../assets/models/${face}.glb`])
    const g = gltf.scene
    const nodes = [...g.children]
    g.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      const old = o.material as THREE.Material
      o.material = mats[roleOf(old.name)]
      o.frustumCulled = false
      old.dispose()
    })

    g.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(g)
    const radius = box.getBoundingSphere(new THREE.Sphere()).radius
    g.position.copy(box.getCenter(new THREE.Vector3())).negate()

    const offsets = nodes.map((n) => explodeOffset(n.userData.explota))
    const heights = nodes.map((n, i) => n.position.y + offsets[i].y)
    const rank = new Map([...heights.keys()].sort((a, b) => heights[a] - heights[b]).map((idx, r) => [idx, r]))
    const parts: Part[] = nodes.map((node, i) => ({
      node,
      base: node.position.clone(),
      q0: node.quaternion.clone(),
      offset: offsets[i],
      // Low parts get the largest delay: they seat first on assembly and leave last on disassembly.
      delay: 1 - (rank.get(i) ?? 0) / Math.max(1, nodes.length - 1),
      twist: (i % 2 ? -1 : 1) * (0.25 + (0.2 * ((i * 7) % 5)) / 4),
      dir: offsets[i].lengthSq() > 1e-8 ? offsets[i].clone().normalize() : Y.clone(),
      motion: face === 'design' ? engineMotion(node.userData) : motionFor(face, node.name.slice(face.length + 2), node.userData),
    }))

    const spinner = new THREE.Group()
    spinner.scale.setScalar(TARGET_RADIUS / radius)
    spinner.add(g)
    const wrap = new THREE.Group()
    wrap.add(spinner)
    wrap.visible = false
    rig.add(wrap)
    const piece: Piece = {
      face, wrap, spinner, parts, k: 1, turn: face === 'data' ? 0.14 : 0, radius,
      packets: face === 'ai' ? createPackets(parts, g, mats.acento.color) : null,
      bars: face === 'data' ? createBars(g) : null,
    }
    pieces.set(face, piece)
    if (dead) disposePiece(piece)
    return piece
  }

  function ensure(face: Face) {
    let p = loading.get(face)
    if (!p) {
      p = build(face)
      p.catch(() => loading.delete(face))
      loading.set(face, p)
    }
    return p
  }

  function teardown() {
    dead = true
    pieces.forEach(disposePiece)
    Object.values(mats).forEach((m) => m.dispose())
    waveGeo.dispose(); waveMat.dispose()
    draco.dispose(); envMap.dispose(); pmrem.dispose()
    renderer.dispose(); renderer.forceContextLoss()
    renderer.domElement.remove()
  }

  try {
    const first = await ensure(startFace)
    // Compiling in parallel keeps the first render from blocking on shader linking. Invisible objects are skipped,
    // and without the extension compileAsync only logs a warning.
    if (renderer.extensions.has('KHR_parallel_shader_compile')) {
      first.wrap.visible = true
      await renderer.compileAsync(scene, camera)
    }
  } catch (err) {
    teardown()
    throw err
  }

  const st = { face: startFace, shown: startFace, heroP: 0, punch: 0, pv: 0, wave: 0, snap: true, fit: 1 }
  let t = 0, last = performance.now(), yaw = 0, pitch = 0, drag = 0, dragging = false, dragX = 0, tx = 0, ty = 0, nx = 0, ny = 0

  addEventListener('pointermove', (e) => { nx = (e.clientX / innerWidth) * 2 - 1; ny = (e.clientY / innerHeight) * 2 - 1 }, { passive: true, signal })
  stage.addEventListener('pointerdown', (e) => { dragging = true; dragX = e.clientX }, { signal })
  addEventListener('pointerup', () => { dragging = false }, { signal })
  addEventListener('pointercancel', () => { dragging = false }, { signal })
  stage.addEventListener('pointermove', (e) => {
    if (dragging) { drag = clamp(drag + (e.clientX - dragX) * 0.012, -1.6, 1.6); dragX = e.clientX }
  }, { signal })
  if (coarse) {
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma != null && e.beta != null) { tx = clamp(e.gamma / 30, -1, 1); ty = clamp((e.beta - 45) / 30, -1, 1) }
    }
    // iOS gates tilt behind a permission that must be requested from a gesture.
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DOE.requestPermission === 'function') {
      stage.addEventListener('pointerdown', () => {
        DOE.requestPermission!().then((r) => { if (r === 'granted') addEventListener('deviceorientation', onTilt, { signal }) }).catch(() => {})
      }, { once: true, signal })
    } else addEventListener('deviceorientation', onTilt, { signal })
  }

  function resizeScene() {
    const w = stage.clientWidth, h = stage.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h)
    camera.aspect = w / h; camera.updateProjectionMatrix()
    st.fit = clamp(Math.min(1, camera.aspect * 0.95), 0.55, 1)
    camera.position.x = coarse || innerWidth < 760 ? 0 : -0.6
  }
  const ro = new ResizeObserver(resizeScene)
  ro.observe(stage); resizeScene()

  function pose(p: Piece) {
    for (const part of p.parts) {
      const l = easeInOut(clamp((p.k - part.delay * STAGGER) / (1 - STAGGER), 0, 1))
      const n = part.node, m = part.motion
      // Idle motion fades out while the part flies apart, so the explode reads cleanly.
      const life = 1 - l
      n.position.copy(part.base).addScaledVector(part.offset, l * EXPLODE)
      if (m.bob) n.position.y += m.bob[0] * p.radius * Math.sin(m.bob[1] * t + m.bob[2]) * life
      if (m.slide) n.position.addScaledVector(part.dir, m.slide[0] * p.radius * (0.5 + 0.5 * Math.sin(m.slide[1] * t + m.slide[2])) * life)
      // The exported pose is crank angle 0, so motion is measured from there.
      const theta = CRANK * t
      if (m.crank) n.position.addScaledVector(m.crank.stroke, (Math.cos(theta - m.crank.phase) - Math.cos(m.crank.phase)) * life)
      if (m.play) playMove(m.play, t, life, n)
      n.quaternion.copy(qa.setFromAxisAngle(Y, part.twist * l))
      if (m.play?.kind === 'tilt') {
        const { a, b, amp, ph } = m.play
        n.quaternion.multiply(qc.setFromAxisAngle(a, amp * Math.sin(2.1 * t + ph) * life)).multiply(qc.setFromAxisAngle(b, amp * Math.sin(2.9 * t + ph + 1) * life))
      }
      if (m.tumble) n.quaternion.multiply(qc.setFromAxisAngle(m.tumble[0], m.tumble[1] * t))
      if (m.crank?.swing && m.crank.ratio) {
        const r = m.crank.ratio
        n.quaternion.multiply(qc.setFromAxisAngle(m.crank.swing, (Math.asin(r * Math.sin(theta - m.crank.phase)) - Math.asin(r * Math.sin(-m.crank.phase))) * life))
      }
      n.quaternion.multiply(part.q0)
      if (m.spin) n.quaternion.multiply(qb.setFromAxisAngle(m.axis ?? Y, m.spin * t))
      const pulse = m.pulse ? 1 + m.pulse[0] * Math.sin(m.pulse[1] * t + m.pulse[2]) * life : 1
      n.scale.setScalar(Math.max(1 - l * l * l, 1e-4) * pulse)
    }
  }

  function frame3(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now; t += dt
    const snap = st.snap
    st.snap = false
    paint(st.face, snap ? 1 : 1 - Math.exp(-4 * dt))
    mats.acento.emissiveIntensity = 0.55 + 0.25 * Math.sin(t * 2.2)
    const loaded = [...pieces.values()]
    for (const p of loaded) {
      const open = p.face === st.shown && loaded.every((o) => o === p || o.k >= GATE)
      p.k = clamp(p.k + (open ? -dt / IN_SECONDS : dt / OUT_SECONDS), 0, 1)
      p.wrap.visible = p.k < 1
      if (!p.wrap.visible) continue
      pose(p)
      p.spinner.rotation.y = p.turn * t
      p.packets?.update(dt, p.k)
      p.bars?.update(t, 1 - p.k)
    }

    const ptX = coarse ? tx : nx, ptY = coarse ? ty : ny
    const ky = snap ? 1 : 1 - Math.exp(-3.2 * dt)
    yaw += (ptX * 0.7 + drag - yaw) * ky; pitch += (ptY * 0.38 - pitch) * ky
    if (!dragging) drag *= Math.exp(-0.7 * dt)
    rig.rotation.y = yaw + Math.sin(t * 0.25) * 0.18 + st.heroP * 1.1
    rig.rotation.x = pitch
    st.pv += (-st.punch * 70 - st.pv * 9) * dt; st.punch += st.pv * dt
    rig.scale.setScalar(st.fit * (1 + st.punch))
    rig.position.y = st.heroP * 1.4
    key.position.set(3 + ptX * 3, 5 - ptY * 2, 6)

    if (st.wave > 0) {
      st.wave = Math.max(0, st.wave - dt * 1.15)
      const p = 1 - st.wave
      wave.scale.setScalar(0.3 + p * 3); waveMat.opacity = st.wave * 0.8
    } else waveMat.opacity = 0
    renderer.render(scene, camera)
  }

  let r3 = 0, visible = true
  const loop = (now: number) => { r3 = requestAnimationFrame(loop); frame3(now) }
  const run = () => {
    const on = visible && !document.hidden
    if (on && !r3) { last = performance.now(); r3 = requestAnimationFrame(loop) }
    else if (!on && r3) { cancelAnimationFrame(r3); r3 = 0 }
  }
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; run() }, { threshold: 0 })
  io.observe(stage)
  document.addEventListener('visibilitychange', run, { signal })
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); stage.classList.remove('live'); cancelAnimationFrame(r3); r3 = 0
  }, { signal })
  frame3(performance.now())
  stage.classList.add('live')
  run()

  return {
    prefetch(face) {
      if (!dead) ensure(face).catch(() => {})
    },
    setFace(next) {
      st.face = next; st.punch = -0.2; st.pv = 0; st.wave = 1
      waveMat.color.set(PAL[next].signal)
      ensure(next).then(() => { if (st.face === next) st.shown = next }).catch((err) => console.warn(`3D piece "${next}" failed to load:`, err))
    },
    setHeroProgress(p) { st.heroP = p },
    destroy() {
      cancelAnimationFrame(r3); r3 = 0
      ac.abort(); io.disconnect(); ro.disconnect()
      stage.classList.remove('live')
      teardown()
    },
  }
}
