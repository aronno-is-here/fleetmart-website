import { useEffect, useRef } from 'react'

const PW = 105
const PH = 68
const TAU = Math.PI * 2

const TEAM_COLORS = [
  { body: 'rgba(198,245,63,0.18)', edge: 'rgba(198,245,63,0.35)' },
  { body: 'rgba(63,169,245,0.16)', edge: 'rgba(63,169,245,0.32)' },
]

const KICKER_START = { x: 38, y: 34 }
const GOAL_CENTER_Y = 0
const PHASE = {
  IDLE: 0,
  RUN_UP: 1,
  KICK: 2,
  BALL_FLIGHT: 3,
  GK_DIVE: 4,
  GOAL: 5,
  CELEBRATE: 6,
  RESET: 7,
}

const TOTAL_DURATION = 7.5

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}
function easeOut(t) {
  return 1 - Math.pow(1 - t, 3)
}
function lerp(a, b, t) {
  return a + (b - a) * Math.min(1, Math.max(0, t))
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

function formation(team) {
  const anchors = [
    [52.5, 5],
    [18, 18], [52.5, 15], [87, 18],
    [30, 34], [52.5, 32], [75, 34],
    [35, 50], [70, 50],
  ]
  return anchors.map(([x, y], i) => {
    const py = team === 0 ? y : PH - y
    return {
      team,
      gk: i === 0,
      ax: x,
      ay: py,
      x: x + (Math.random() - 0.5) * 4,
      y: py + (Math.random() - 0.5) * 4,
      phase: Math.random() * TAU,
      flash: 0,
    }
  })
}

export default function MatchBackground() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let Wpx = 0, Hpx = 0
    let horizonY = 0, bottomY = 0, halfFar = 0, halfNear = 0

    const players = [...formation(0), ...formation(1)]
    const ball = { x: KICKER_START.x, y: KICKER_START.y, z: 0, vx: 0, vy: 0, vz: 0, carrier: null, hold: 1 }
    const kicker = players.find(p => p.team === 0 && !p.gk && dist(p, { x: 38, y: 34 }) < 10) || players[1]
    const goalkeeper = players.find(p => p.team === 1 && p.gk) || players[9]

    const cam = { x: PW / 2, y: PH / 2, zoom: 1 }
    let phase = PHASE.IDLE
    let phaseTime = 0
    let totalTime = 0
    let goalScored = false

    const gkDive = { active: false, offsetX: 0, offsetY: 0, progress: 0 }
    const particles = []

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      Wpx = window.innerWidth
      Hpx = window.innerHeight
      canvas.width = Math.round(Wpx * dpr)
      canvas.height = Math.round(Hpx * dpr)
      canvas.style.width = `${Wpx}px`
      canvas.style.height = `${Hpx}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      horizonY = Hpx * 0.13
      bottomY = Hpx * 1.08
      halfFar = Wpx * 0.32
      halfNear = Wpx * 0.92
    }
    resize()
    window.addEventListener('resize', resize)

    const kOf = (y) => Math.pow(clamp(y / PH, 0, 1), 1.55)

    function proj(x, y, z = 0) {
      const cx = cam.x + (x - cam.x) * cam.zoom
      const cy = cam.y + (y - cam.y) * cam.zoom
      const k = kOf(cy)
      const halfW = halfFar + (halfNear - halfFar) * k
      return {
        x: Wpx / 2 + ((cx - PW / 2) / (PW / 2)) * halfW,
        y: horizonY + k * (bottomY - horizonY) - z * (0.3 + 0.7 * k) * 10,
        s: (0.28 + 0.72 * k) * cam.zoom,
      }
    }

    function dist(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y)
    }

    function resetPositions() {
      for (const p of players) {
        p.x = p.ax + (Math.random() - 0.5) * 4
        p.y = p.ay + (Math.random() - 0.5) * 4
        p.flash = 0
      }
      ball.x = KICKER_START.x
      ball.y = KICKER_START.y
      ball.z = 0
      ball.vx = ball.vy = ball.vz = 0
      ball.carrier = null
      cam.x = PW / 2
      cam.y = PH / 2
      cam.zoom = 1
      gkDive.active = false
      gkDive.offsetX = 0
      gkDive.offsetY = 0
      gkDive.progress = 0
      goalScored = false
      particles.length = 0
      kicker.x = KICKER_START.x
      kicker.y = KICKER_START.y
    }

    function spawnGoalParticles() {
      const gp = proj(52.5, GOAL_CENTER_Y, 1.2)
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: gp.x + (Math.random() - 0.5) * 60,
          y: gp.y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 180,
          vy: -Math.random() * 220 - 40,
          life: 1,
          decay: 0.4 + Math.random() * 0.6,
          size: 1.5 + Math.random() * 3,
          color: Math.random() > 0.5 ? 'rgba(198,245,63,' : 'rgba(63,169,245,',
        })
      }
    }

    function updatePhase(dt) {
      phaseTime += dt
      totalTime += dt

      if (totalTime >= TOTAL_DURATION) {
        resetPositions()
        phase = PHASE.IDLE
        phaseTime = 0
        totalTime = 0
        return
      }

      switch (phase) {
        case PHASE.IDLE: {
          kicker.x = lerp(kicker.x, KICKER_START.x, dt * 2)
          kicker.y = lerp(kicker.y, KICKER_START.y, dt * 2)
          ball.x = kicker.x + 1.5
          ball.y = kicker.y
          ball.z = 0
          cam.x = lerp(cam.x, PW / 2, dt * 1.5)
          cam.y = lerp(cam.y, PH / 2, dt * 1.5)
          cam.zoom = lerp(cam.zoom, 1, dt * 1.5)
          if (phaseTime > 0.8) {
            phase = PHASE.RUN_UP
            phaseTime = 0
          }
          break
        }
        case PHASE.RUN_UP: {
          const t = clamp(phaseTime / 1.2, 0, 1)
          const eased = easeInOut(t)
          kicker.x = lerp(KICKER_START.x, 42, eased)
          kicker.y = lerp(KICKER_START.y, 36, eased)
          ball.x = kicker.x + 1.5
          ball.y = kicker.y
          ball.z = 0
          cam.x = lerp(cam.x, 48, dt * 3)
          cam.y = lerp(cam.y, 34, dt * 3)
          cam.zoom = lerp(cam.zoom, 1.08, dt * 2)
          if (t >= 1) {
            phase = PHASE.KICK
            phaseTime = 0
          }
          break
        }
        case PHASE.KICK: {
          const t = clamp(phaseTime / 0.4, 0, 1)
          kicker.flash = 1
          ball.x = lerp(kicker.x, 52.5, easeOut(t))
          ball.y = lerp(kicker.y, GOAL_CENTER_Y, easeOut(t))
          ball.z = 0
          ball.vx = 0
          ball.vy = 0
          ball.vz = 0
          if (t >= 1) {
            const angle = Math.atan2(GOAL_CENTER_Y - kicker.y, 52.5 - kicker.x)
            const power = 52
            ball.vx = Math.cos(angle) * power
            ball.vy = Math.sin(angle) * power
            ball.vz = 6
            ball.x = 52.5
            ball.y = GOAL_CENTER_Y
            ball.z = 0
            phase = PHASE.BALL_FLIGHT
            phaseTime = 0
          }
          break
        }
        case PHASE.BALL_FLIGHT: {
          const t = clamp(phaseTime / 1.4, 0, 1)
          ball.x += ball.vx * dt
          ball.y += ball.vy * dt
          ball.vz -= 14 * dt
          ball.z += ball.vz * dt
          if (ball.z < 0) { ball.z = 0; ball.vz = 0 }
          const lookAhead = 12
          cam.x = lerp(cam.x, ball.x + Math.cos(Math.atan2(ball.vy, ball.vx)) * lookAhead, dt * 5)
          cam.y = lerp(cam.y, ball.y + Math.sin(Math.atan2(ball.vy, ball.vx)) * lookAhead, dt * 5)
          cam.zoom = lerp(cam.zoom, 1.3, dt * 3)
          if (t > 0.3 && !gkDive.active) {
            gkDive.active = true
            gkDive.progress = 0
          }
          if (gkDive.active) {
            gkDive.progress = clamp(gkDive.progress + dt * 2.5, 0, 1)
            const diveAngle = Math.atan2(ball.y - goalkeeper.y, ball.x - goalkeeper.x)
            gkDive.offsetX = Math.cos(diveAngle + 0.4) * 8 * easeOut(gkDive.progress)
            gkDive.offsetY = Math.sin(diveAngle + 0.4) * 4 * easeOut(gkDive.progress)
          }
          if (t >= 1 || ball.y < -2) {
            goalScored = true
            spawnGoalParticles()
            phase = PHASE.GOAL
            phaseTime = 0
          }
          break
        }
        case PHASE.GOAL: {
          ball.z = lerp(ball.z, 0.3, dt * 2)
          cam.x = lerp(cam.x, 52.5, dt * 2)
          cam.y = lerp(cam.y, 5, dt * 2)
          cam.zoom = lerp(cam.zoom, 1.5, dt * 2)
          for (const p of particles) {
            p.x += p.vx * dt
            p.y += p.vy * dt
            p.vy += 350 * dt
            p.life -= p.decay * dt
          }
          for (let i = particles.length - 1; i >= 0; i--) {
            if (particles[i].life <= 0) particles.splice(i, 1)
          }
          if (phaseTime > 1.2) {
            phase = PHASE.CELEBRATE
            phaseTime = 0
          }
          break
        }
        case PHASE.CELEBRATE: {
          cam.x = lerp(cam.x, PW / 2, dt * 1.5)
          cam.y = lerp(cam.y, PH / 2, dt * 1.5)
          cam.zoom = lerp(cam.zoom, 1, dt * 1.5)
          for (const p of particles) {
            p.x += p.vx * dt * 0.3
            p.y += p.vy * dt * 0.3
            p.vy += 200 * dt
            p.life -= p.decay * dt * 0.5
          }
          for (let i = particles.length - 1; i >= 0; i--) {
            if (particles[i].life <= 0) particles.splice(i, 1)
          }
          kicker.flash = Math.max(0, kicker.flash - dt * 2)
          if (phaseTime > 1.5) {
            phase = PHASE.RESET
            phaseTime = 0
          }
          break
        }
        case PHASE.RESET: {
          const t = clamp(phaseTime / 1.2, 0, 1)
          const e = easeInOut(t)
          cam.zoom = lerp(cam.zoom, 1, dt * 2)
          for (const p of players) {
            p.x = lerp(p.x, p.ax + (Math.random() - 0.5) * 4, e * 0.1)
            p.y = lerp(p.y, p.ay + (Math.random() - 0.5) * 4, e * 0.1)
            p.flash *= 0.95
          }
          ball.x = lerp(ball.x, KICKER_START.x, e * 0.05)
          ball.y = lerp(ball.y, KICKER_START.y, e * 0.05)
          ball.z = lerp(ball.z, 0, e * 0.1)
          gkDive.offsetX *= 0.9
          gkDive.offsetY *= 0.9
          if (t >= 1) {
            resetPositions()
            phase = PHASE.IDLE
            phaseTime = 0
            totalTime = 0
          }
          break
        }
      }
    }

    function drawPitch() {
      for (const fx of [0.16, 0.84]) {
        const g = ctx.createRadialGradient(Wpx * fx, -Hpx * 0.15, 0, Wpx * fx, -Hpx * 0.15, Hpx * 0.75)
        g.addColorStop(0, 'rgba(237,241,245,0.045)')
        g.addColorStop(1, 'rgba(237,241,245,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, Wpx, Hpx)
      }

      const bands = 8
      for (let i = 0; i < bands; i++) {
        const y0 = (i / bands) * PH
        const y1 = ((i + 1) / bands) * PH
        const a = proj(0, y0)
        const b = proj(PW, y0)
        const c = proj(PW, y1)
        const d = proj(0, y1)
        ctx.fillStyle = i % 2 === 0 ? 'rgba(20,107,69,0.030)' : 'rgba(20,107,69,0.012)'
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.lineTo(c.x, c.y)
        ctx.lineTo(d.x, d.y)
        ctx.closePath()
        ctx.fill()
      }

      ctx.strokeStyle = 'rgba(237,241,245,0.055)'
      ctx.lineWidth = 1.4

      ctx.beginPath()
      const c1 = proj(0, 0), c2 = proj(PW, 0), c3 = proj(PW, PH), c4 = proj(0, PH)
      ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.lineTo(c4.x, c4.y)
      ctx.closePath()
      const m1 = proj(52.5, 0), m2 = proj(52.5, PH)
      ctx.moveTo(m1.x, m1.y); ctx.lineTo(m2.x, m2.y)
      ctx.stroke()

      ctx.beginPath()
      for (let i = 0; i <= 40; i++) {
        const ang = (i / 40) * TAU
        const p = proj(52.5 + Math.cos(ang) * 9.15, 34 + Math.sin(ang) * 9.15)
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()

      const rects = [
        [[32.34, 0], [72.66, 0], [72.66, 16.5], [32.34, 16.5]],
        [[43.34, 0], [61.66, 0], [61.66, 5.5], [43.34, 5.5]],
        [[32.34, PH], [72.66, PH], [72.66, PH - 16.5], [32.34, PH - 16.5]],
        [[43.34, PH], [61.66, PH], [61.66, PH - 5.5], [43.34, PH - 5.5]],
      ]
      for (const r of rects) {
        ctx.beginPath()
        r.forEach(([x, y], i) => {
          const p = proj(x, y)
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y)
        })
        ctx.closePath()
        ctx.stroke()
      }

      for (const gy of [0, PH]) {
        const a = proj(48.84, gy, 0), b = proj(48.84, gy, 2.44)
        const c = proj(56.16, gy, 0), d = proj(56.16, gy, 2.44)
        ctx.beginPath()
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
        ctx.lineTo(d.x, d.y)
        ctx.lineTo(c.x, c.y)
        ctx.stroke()
      }
    }

    function drawGoalNet() {
      if (!goalScored && phase !== PHASE.GOAL && phase !== PHASE.CELEBRATE) return
      const opacity = phase === PHASE.GOAL ? clamp(phaseTime / 0.3, 0, 0.25) : phase === PHASE.CELEBRATE ? Math.max(0, 0.25 - phaseTime * 0.15) : 0
      if (opacity <= 0) return

      const gA = proj(48.84, 0, 0)
      const gB = proj(56.16, 0, 0)
      const gC = proj(56.16, 0, 2.44)
      const gD = proj(48.84, 0, 2.44)

      ctx.strokeStyle = `rgba(237,241,245,${opacity})`
      ctx.lineWidth = 0.6

      const rows = 6
      const cols = 5
      for (let i = 0; i <= rows; i++) {
        const t = i / rows
        const sx = lerp(gA.x, gD.x, t)
        const sy = lerp(gA.y, gD.y, t)
        const ex = lerp(gB.x, gC.x, t)
        const ey = lerp(gB.y, gC.y, t)
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }
      for (let i = 0; i <= cols; i++) {
        const t = i / cols
        const sx = lerp(gA.x, gB.x, t)
        const sy = lerp(gA.y, gB.y, t)
        const ex = lerp(gD.x, gC.x, t)
        const ey = lerp(gD.y, gC.y, t)
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }
    }

    function drawSpeedLines() {
      if (phase !== PHASE.BALL_FLIGHT) return
      const intensity = clamp(phaseTime / 0.3, 0, 1) * (1 - clamp((phaseTime - 1) / 0.4, 0, 1))
      if (intensity <= 0) return

      const bg = proj(ball.x, ball.y, ball.z)
      ctx.save()
      ctx.globalAlpha = intensity * 0.3
      ctx.strokeStyle = 'rgba(198,245,63,0.5)'
      ctx.lineWidth = 1

      const angle = Math.atan2(ball.vy, ball.vx)
      for (let i = 0; i < 12; i++) {
        const offset = (i - 6) * 25
        const len = 40 + Math.random() * 60
        const sx = bg.x + Math.cos(angle + Math.PI / 2) * offset
        const sy = bg.y + Math.sin(angle + Math.PI / 2) * offset
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(sx - Math.cos(angle) * len, sy - Math.sin(angle) * len)
        ctx.stroke()
      }
      ctx.restore()
    }

    function drawPlayersAndBall() {
      const gkProj = proj(
        goalkeeper.x + gkDive.offsetX,
        goalkeeper.y + gkDive.offsetY,
        gkDive.active ? 0.5 * easeOut(gkDive.progress) : 0
      )

      const ents = []
      for (const p of players) {
        if (p === goalkeeper) continue
        ents.push({ y: p.y, kind: 'p', p })
      }
      ents.push({ y: goalkeeper.y, kind: 'gk' })
      ents.push({ y: ball.y, kind: 'b' })
      ents.sort((a, b) => a.y - b.y)

      for (const e of ents) {
        if (e.kind === 'p') {
          const p = e.p
          const g = proj(p.x, p.y, 0)
          const col = TEAM_COLORS[p.team]
          const h = 24 * g.s

          ctx.fillStyle = 'rgba(0,0,0,0.15)'
          ctx.beginPath()
          ctx.ellipse(g.x, g.y, 5.5 * g.s, 1.8 * g.s, 0, 0, TAU)
          ctx.fill()

          ctx.fillStyle = col.body
          ctx.beginPath()
          ctx.ellipse(g.x, g.y - h * 0.42, 4.4 * g.s, 7.5 * g.s, 0, 0, TAU)
          ctx.fill()

          ctx.fillStyle = 'rgba(237,241,245,0.20)'
          ctx.beginPath()
          ctx.ellipse(g.x, g.y - h * 0.95, 2.6 * g.s, 2.6 * g.s, 0, 0, TAU)
          ctx.fill()

          if (p.flash > 0.05) {
            ctx.strokeStyle = `rgba(198,245,63,${0.35 * p.flash})`
            ctx.beginPath()
            ctx.ellipse(g.x, g.y, 8 * g.s, 3 * g.s, 0, 0, TAU)
            ctx.stroke()
          }
        } else if (e.kind === 'gk') {
          const g = gkProj
          const col = TEAM_COLORS[1]
          const h = 24 * g.s

          ctx.fillStyle = 'rgba(0,0,0,0.15)'
          ctx.beginPath()
          ctx.ellipse(g.x, g.y, 5.5 * g.s, 1.8 * g.s, 0, 0, TAU)
          ctx.fill()

          if (gkDive.active && gkDive.progress > 0.3) {
            const diveAngle = Math.atan2(gkDive.offsetY, gkDive.offsetX)
            ctx.save()
            ctx.translate(g.x, g.y - h * 0.3)
            ctx.rotate(diveAngle * 0.5)
            ctx.fillStyle = col.body
            ctx.beginPath()
            ctx.ellipse(0, 0, 8 * g.s, 3.5 * g.s, 0, 0, TAU)
            ctx.fill()
            ctx.restore()
          } else {
            ctx.fillStyle = col.body
            ctx.beginPath()
            ctx.ellipse(g.x, g.y - h * 0.42, 4.4 * g.s, 7.5 * g.s, 0, 0, TAU)
            ctx.fill()
          }

          ctx.fillStyle = 'rgba(255,90,31,0.25)'
          ctx.beginPath()
          ctx.ellipse(g.x, g.y - h * 0.95, 2.8 * g.s, 2.8 * g.s, 0, 0, TAU)
          ctx.fill()
        } else {
          const g0 = proj(ball.x, ball.y, 0)
          const g = proj(ball.x, ball.y, ball.z)
          ctx.fillStyle = 'rgba(0,0,0,0.22)'
          ctx.beginPath()
          ctx.ellipse(g0.x, g0.y, 3.4 * g.s, 1.2 * g.s, 0, 0, TAU)
          ctx.fill()

          const r = (3 + ball.z * 0.5) * g.s
          ctx.fillStyle = 'rgba(245,247,244,0.65)'
          ctx.beginPath()
          ctx.arc(g.x, g.y, r, 0, TAU)
          ctx.fill()
          ctx.strokeStyle = 'rgba(198,245,63,0.5)'
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.lineWidth = 1.4
        }
      }
    }

    function drawParticles() {
      for (const p of particles) {
        ctx.fillStyle = p.color + clamp(p.life, 0, 1) + ')'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * clamp(p.life, 0.3, 1), 0, TAU)
        ctx.fill()
      }
    }

    function drawCinematicBars() {
      if (phase !== PHASE.BALL_FLIGHT && phase !== PHASE.GOAL) return
      const intensity = phase === PHASE.BALL_FLIGHT
        ? clamp(phaseTime / 0.3, 0, 1) * (1 - clamp((phaseTime - 1) / 0.4, 0, 1))
        : clamp(1 - phaseTime / 1.2, 0, 1)
      if (intensity <= 0) return

      const barH = 28 * intensity
      ctx.fillStyle = `rgba(10,14,19,${0.85 * intensity})`
      ctx.fillRect(0, 0, Wpx, barH)
      ctx.fillRect(0, Hpx - barH, Wpx, barH)

      ctx.fillStyle = `rgba(198,245,63,${0.12 * intensity})`
      ctx.fillRect(0, barH - 1, Wpx, 1)
      ctx.fillRect(0, Hpx - barH, Wpx, 1)
    }

    function drawVignette() {
      const g = ctx.createRadialGradient(Wpx / 2, Hpx / 2, Wpx * 0.25, Wpx / 2, Hpx / 2, Wpx * 0.75)
      g.addColorStop(0, 'rgba(10,14,19,0)')
      g.addColorStop(1, 'rgba(10,14,19,0.4)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, Wpx, Hpx)
    }

    const draw = () => {
      ctx.clearRect(0, 0, Wpx, Hpx)
      drawPitch()
      drawGoalNet()
      drawSpeedLines()
      drawPlayersAndBall()
      drawParticles()
      drawCinematicBars()
      drawVignette()
    }

    let raf = 0
    let last = 0

    const loop = (ts) => {
      raf = requestAnimationFrame(loop)
      if (ts - last < 33) return
      const dt = Math.min(0.05, (ts - last) / 1000 || 0.016)
      last = ts
      updatePhase(dt)
      draw()
    }

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!raf && !reduced) {
        last = 0
        raf = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    if (reduced) {
      resetPositions()
      draw()
    } else {
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />
}
