import type { Face } from '../useFace'

type Palette = { ink: string; ink2: string; signal: string; plate: string }
type CalmZone = { fixed: boolean; floor: number; x0: number; x1: number; y0: number; y1: number }
type Ripple = { x: number; y: number; t: number; a: number; sp: number; w: number }
type Draw = (t: number) => void

export type FieldApi = {
  setFace(face: Face, origin?: [number, number]): void
  setScroll(y: number): void
  measure(): void
  destroy(): void
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
const TAU = 6.283

/** Site-wide canvas dot field: one grammar per face, cursor/touch ripples, calm zones behind text. */
export function initField(cv: HTMLCanvasElement, startFace: Face, reduced: boolean): FieldApi {
  const ctx = cv.getContext('2d')!
  const root = document.documentElement
  const ac = new AbortController()
  const { signal } = ac

  let W = 0, H = 0, S = 28, cols = 0, rows = 0, sy = scrollY, dpr = 1
  let col: Palette = { ink: '#000', ink2: '#000', signal: '#000', plate: '#000' }
  let calm: CalmZone[] = []
  let mx = innerWidth * 0.7, my = innerHeight * 0.4, tx = mx, ty = my, energy = 0, trav = 0, ppx = 0, ppy = 0
  let rip: Ripple[] = []
  let asm = 0, asmStart = 0, mode: Face = startFace, raf = 0, last = 0, tick = 0, colUntil = 0
  let resizeTimer = 0, staticTimer = 0
  const pnow = () => performance.now() / 1000

  function readCol() {
    const cs = getComputedStyle(root)
    const g = (n: string) => cs.getPropertyValue(n).trim()
    col = { ink: g('--ink'), ink2: g('--ink-2'), signal: g('--signal'), plate: g('--plate') }
  }

  function measure() {
    calm = [...document.querySelectorAll<HTMLElement>('[data-calm]')].map((e) => {
      const r = e.getBoundingClientRect()
      return { fixed: false, floor: e.dataset.calm === 'soft' ? 0.45 : 0.14, x0: r.left - 24, x1: r.right + 24, y0: r.top + scrollY - 24, y1: r.bottom + scrollY + 24 }
    })
  }

  function calmAt(x: number, y: number) {
    let c = 1
    for (const r of calm) {
      const py = r.fixed ? y : y + sy
      const dx = Math.max(r.x0 - x, 0, x - r.x1), dy = Math.max(r.y0 - py, 0, py - r.y1)
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < 70) {
        const k = d / 70, v = r.floor + (1 - r.floor) * k * k * (3 - 2 * k)
        if (v < c) c = v
      }
    }
    return c
  }

  function resize() {
    const w = innerWidth, h = innerHeight
    if (w === W && Math.abs(h - H) < 120) return
    W = w; H = h; dpr = Math.min(devicePixelRatio || 1, 2)
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    const maxN = W < 700 ? 600 : 1800
    S = Math.max(24, Math.sqrt((W * H) / maxN))
    cols = Math.ceil(W / S) + 3; rows = Math.ceil(H / S) + 3
    measure()
    if (reduced) drawStatic()
  }

  function F(x: number, y: number, t: number) {
    let v = 0
    const dx = x - mx, dy = y - my
    v += energy * Math.exp(-(dx * dx + dy * dy) / 22000)
    for (const r of rip) {
      const age = t - r.t, d = Math.sqrt((x - r.x) ** 2 + (y - r.y) ** 2), k = (d - age * r.sp) / r.w
      v += r.a * Math.exp(-k * k) * Math.cos(k * 3) * Math.exp(-age * 1.4)
    }
    return v + 0.12 * Math.sin(x * 0.011 + t * 0.6) * Math.sin(y * 0.013 - t * 0.4)
  }

  function addRipple(x: number, y: number, a: number, sp = 420) {
    if (!reduced) rip.push({ x, y, t: pnow(), a, sp, w: 70 })
    if (rip.length > 8) rip.shift()
  }

  const scatter = (k: number): [number, number] => {
    const s = asm * asm * 320
    return [(hash(k) - 0.5) * s, (hash(k + 9) - 0.5) * s]
  }

  const DRAW: Record<Face, Draw> = {
    neutral(t) {
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = j * cols + i, [ox, oy] = scatter(k), x = (i - 1) * S + ox, y = (j - 1) * S + oy, f = F(x, y, t), m = Math.abs(f)
        const dx = x - mx, dy = y - my, d = Math.sqrt(dx * dx + dy * dy) + 1, push = f * 9
        ctx.globalAlpha = (0.22 + 0.55 * Math.min(1, m * 1.6)) * calmAt(x, y) * (1 - 0.5 * asm)
        ctx.fillStyle = m > 0.55 ? col.signal : col.ink
        ctx.beginPath(); ctx.arc(x + (dx / d) * push, y + (dy / d) * push, Math.min(5, 1.2 + m * 3.2), 0, TAU); ctx.fill()
      }
    },
    fullstack(t) {
      const b = S * 0.5
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = j * cols + i, [ox, oy] = scatter(k), x = (i - 1) * S + ox, y = (j - 1) * S + oy, f = F(x, y, t), c = calmAt(x, y) * (1 - 0.5 * asm)
        const lvl = f > 0.12 ? Math.min(3, Math.round(f * 3.2)) : 0, z = f < 0 ? b * (1 + f * 0.7) : b
        ctx.globalAlpha = 0.3 * c; ctx.fillStyle = col.plate; ctx.fillRect(x - z / 2, y - z / 2, z, z)
        for (let l = 1; l <= lvl; l++) {
          ctx.globalAlpha = 0.5 * c; ctx.fillStyle = l === lvl ? col.signal : col.plate
          ctx.fillRect(x - b / 2, y - l * (b + 3) - b / 2, b, b)
        }
      }
    },
    ai(t) {
      const st = S * 1.7, c = Math.ceil(W / st) + 3, r = Math.ceil(H / st) + 3
      const X = new Float32Array(c * r), Y = new Float32Array(c * r), V = new Float32Array(c * r)
      for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) {
        const k = j * c + i, [ox, oy] = scatter(k)
        X[k] = (i - 1) * st + (hash(k) - 0.5) * st * 0.7 + ox
        Y[k] = (j - 1) * st + (hash(k + 5) - 0.5) * st * 0.7 + oy
        V[k] = F(X[k], Y[k], t)
      }
      const hi = new Path2D(), lo = new Path2D(), lit: [number, number, number, number][] = []
      const reach = st * 3.2, base = 0.25 + energy
      const edge = (a: number, b: number) => {
        const mx2 = (X[a] + X[b]) / 2, my2 = (Y[a] + Y[b]) / 2, cc = calmAt(mx2, my2)
        const p = cc > 0.5 ? hi : lo
        p.moveTo(X[a], Y[a]); p.lineTo(X[b], Y[b])
        const l = clamp(Math.max(0, 1 - Math.hypot(mx2 - mx, my2 - my) / reach) * base + Math.max(0, (V[a] + V[b]) / 2) * 1.2, 0, 1)
        if (l > 0.12) lit.push([a, b, l, cc])
      }
      for (let j = 0; j < r - 1; j++) for (let i = 0; i < c - 1; i++) {
        const k = j * c + i
        edge(k, k + 1); edge(k, k + c)
        if (hash(k + 7) > 0.6) edge(k, k + c + 1)
      }
      ctx.strokeStyle = col.ink2; ctx.lineWidth = 1
      ctx.globalAlpha = 0.17 * (1 - 0.5 * asm); ctx.stroke(hi)
      ctx.globalAlpha = 0.035; ctx.stroke(lo)
      ctx.strokeStyle = col.signal; ctx.fillStyle = col.signal
      for (const [a, b, l, cc] of lit) {
        ctx.globalAlpha = clamp(l * 1.1, 0, 1) * Math.max(cc, 0.3); ctx.lineWidth = 1 + l * 1.6
        ctx.beginPath(); ctx.moveTo(X[a], Y[a]); ctx.lineTo(X[b], Y[b]); ctx.stroke()
        const da = Math.hypot(X[a] - mx, Y[a] - my), db = Math.hypot(X[b] - mx, Y[b] - my)
        const from = da > db ? a : b, to = from === a ? b : a, p = (t * 0.7 + hash(a * 3 + b)) % 1
        ctx.beginPath(); ctx.arc(X[from] + (X[to] - X[from]) * p, Y[from] + (Y[to] - Y[from]) * p, 2.2, 0, TAU); ctx.fill()
      }
      ctx.fillStyle = col.ink2
      for (let k = 0; k < c * r; k++) {
        ctx.globalAlpha = 0.4 * calmAt(X[k], Y[k]) * (1 - 0.5 * asm)
        ctx.beginPath(); ctx.arc(X[k], Y[k], 1.5 + Math.min(3, Math.abs(V[k]) * 3), 0, TAU); ctx.fill()
      }
    },
    data(t) {
      const n = Math.ceil(W / S) + 1, py = S * 0.55, base = H + 4
      const tops: [number, number][] = []
      ctx.fillStyle = col.ink2
      for (let i = 0; i < n; i++) {
        const x = i * S + S / 2, u = i / n
        let h = H * (0.1 + 0.2 * (0.5 + 0.5 * Math.sin(i * 0.5 + t * 0.6)) + 0.34 * Math.exp(-(((u - 0.5 - 0.18 * Math.sin(t * 0.15)) / 0.2) ** 2)))
        h += clamp(F(x, base - h, t), -0.3, 1) * H * 0.28
        h *= 1 - asm
        h = Math.max(py, Math.floor(h / py) * py)
        for (let y = base; y > base - h; y -= py) {
          ctx.globalAlpha = 0.4 * calmAt(x, y) * (1 - 0.4 * asm)
          ctx.fillRect(x - 1.6, y - 1.6, 3.2, 3.2)
        }
        tops.push([x, base - h + py])
      }
      ctx.fillStyle = col.signal
      for (const [x, y] of tops) { ctx.globalAlpha = 0.9 * calmAt(x, y); ctx.fillRect(x - 2.6, y - 2.6, 5.2, 5.2) }
    },
    design(t) {
      const G = W < 700 ? 24 : 40, ext = 0.85 * Math.hypot(W, H), sp = ext / G
      const yaw = 0.62 + 0.1 * Math.sin(t * 0.25) + (mx / W - 0.5) * 0.35, cs = Math.cos(yaw), sn = Math.sin(yaw), P = 0.8
      const X = new Float32Array(G * G), Y = new Float32Array(G * G), Z = new Float32Array(G * G)
      for (let b = 0; b < G; b++) for (let a = 0; a < G; a++) {
        const k = b * G + a, [ox, oy] = scatter(k), gx = (a - G / 2) * sp, gy = (b - G / 2) * sp
        const x = W / 2 + gx * cs - gy * sn + ox, y = H / 2 + (gx * sn + gy * cs) * P + oy, z = F(x, y, t) * sp * 1.5
        X[k] = x; Y[k] = y - z; Z[k] = z
      }
      const hi = new Path2D(), lo = new Path2D(), hot: [number, number, number, number][] = []
      const seg = (a: number, b: number) => {
        if ((X[a] < -50 && X[b] < -50) || (X[a] > W + 50 && X[b] > W + 50) || (Y[a] < -50 && Y[b] < -50) || (Y[a] > H + 50 && Y[b] > H + 50)) return
        const cc = calmAt((X[a] + X[b]) / 2, (Y[a] + Y[b]) / 2), p = cc > 0.5 ? hi : lo
        p.moveTo(X[a], Y[a]); p.lineTo(X[b], Y[b])
        const z = Math.max(Math.abs(Z[a]), Math.abs(Z[b])) / sp
        if (z > 0.35) hot.push([a, b, z, cc])
      }
      for (let b = 0; b < G; b++) for (let a = 0; a < G; a++) {
        const k = b * G + a
        if (a < G - 1) seg(k, k + 1)
        if (b < G - 1) seg(k, k + G)
      }
      ctx.strokeStyle = col.ink2; ctx.lineWidth = 1
      ctx.globalAlpha = 0.2 * (1 - 0.5 * asm); ctx.stroke(hi)
      ctx.globalAlpha = 0.04; ctx.stroke(lo)
      ctx.strokeStyle = col.signal
      for (const [a, b, z, cc] of hot) {
        ctx.globalAlpha = clamp(z, 0, 1) * Math.max(cc, 0.3); ctx.lineWidth = 1.4
        ctx.beginPath(); ctx.moveTo(X[a], Y[a]); ctx.lineTo(X[b], Y[b]); ctx.stroke()
      }
    },
  }

  function draw(t: number) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H)
    ctx.translate(-ppx * 10, -ppy * 8)
    DRAW[mode](t)
    ctx.globalAlpha = 1
  }
  function drawStatic() { energy = 0; rip = []; asm = 0; draw(2.3) }

  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    const t = now / 1000, dt = Math.min(0.05, t - last)
    last = t; tick++
    mx += (tx - mx) * Math.min(1, dt * 12); my += (ty - my) * Math.min(1, dt * 12)
    energy *= Math.pow(0.02, dt)
    ppx += ((tx / W - 0.5) * 2 - ppx) * Math.min(1, dt * 4); ppy += ((ty / H - 0.5) * 2 - ppy) * Math.min(1, dt * 4)
    if (now < colUntil) readCol()
    if (asm > 0 || asmStart) {
      const p = (now - asmStart) / 900
      if (p >= 1) { asm = 0; asmStart = 0 } else asm = 1 - (1 - Math.pow(1 - p, 3))
    }
    const pt = pnow()
    rip = rip.filter((r) => pt - r.t < 2.4)
    const idle = energy < 0.01 && !rip.length && !asmStart
    if (idle && tick & 1) return
    draw(pt)
  }
  function start() {
    if (reduced || raf || document.hidden) return
    last = performance.now() / 1000
    raf = requestAnimationFrame(frame)
  }
  function stop() { cancelAnimationFrame(raf); raf = 0 }

  if (!reduced) {
    addEventListener('pointermove', (e) => {
      const dx = e.clientX - tx, dy = e.clientY - ty, d = Math.hypot(dx, dy)
      tx = e.clientX; ty = e.clientY; energy = Math.min(1, energy + d / 220 + 0.08); trav += d
      if (trav > 130) { trav = 0; addRipple(tx, ty, 0.3, 360) }
    }, { passive: true, signal })
    addEventListener('pointerdown', (e) => {
      tx = mx = e.clientX; ty = my = e.clientY
      addRipple(tx, ty, 1, 520); energy = 1
    }, { passive: true, signal })
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()), { signal })
  addEventListener('blur', stop, { signal })
  addEventListener('focus', start, { signal })
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(resize, 120) }, { signal })

  readCol(); resize()
  if (reduced) staticTimer = window.setTimeout(() => { readCol(); drawStatic() }, 60)
  else start()

  return {
    setFace(next, origin) {
      mode = next
      readCol(); measure()
      if (reduced) {
        clearTimeout(staticTimer)
        staticTimer = window.setTimeout(() => { readCol(); drawStatic() }, 60)
        return
      }
      if (!origin) return
      asmStart = performance.now(); asm = 1; colUntil = asmStart + 1200
      addRipple(origin[0], origin[1], 1, 900)
    },
    setScroll(y) {
      sy = y
      if (reduced) drawStatic()
    },
    measure,
    destroy() {
      stop()
      clearTimeout(resizeTimer); clearTimeout(staticTimer)
      ac.abort()
    },
  }
}
