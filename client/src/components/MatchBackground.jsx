import { useEffect, useRef } from 'react'

const PW = 105 // pitch width (m)
const PH = 68 // pitch height (m)
const TAU = Math.PI * 2

const TEAM_COLORS = [
  { body: 'rgba(198,245,63,0.15)', edge: 'rgba(198,245,63,0.30)' },
  { body: 'rgba(63,169,245,0.14)', edge: 'rgba(63,169,245,0.28)' },
]

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
      x: x + (Math.random() - 0.5) * 6,
      y: py + (Math.random() - 0.5) * 6,
      phase: Math.random() * Math.PI * 2,
      flash: 0,
    }
  })
}

/**
 * MatchBackground — a very light pseudo-3D football match rendered on a fixed
 * canvas behind all page content. Perspective pitch, two AI teams passing,
 * ball with 3D arc + shadow. ~30fps, pauses when tab hidden, honors
 * prefers-reduced-motion (renders a single static frame).
 */
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
    const ball = { x: PW / 2, y: PH / 2, z: 0, vx: 0, vy: 0, vz: 0, carrier: null, hold: 1 }

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

    const kOf = (y) => Math.pow(Math.min(1, Math.max(0, y / PH)), 1.55)
    const proj = (x, y, z = 0) => {
      const k = kOf(y)
      const halfW = halfFar + (halfNear - halfFar) * k
      return {
        x: Wpx / 2 + ((x - PW / 2) / (PW / 2)) * halfW,
        y: horizonY + k * (bottomY - horizonY) - z * (0.3 + 0.7 * k) * 10,
        s: 0.28 + 0.72 * k,
      }
    }

    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

    function pass(p) {
      const mates = players.filter((q) => q.team === p.team && q !== p)
      const target = mates[Math.floor(Math.random() * mates.length)]
      const d = Math.max(1, dist(p, target))
      const speed = 15 + Math.random() * 12
      ball.vx = ((target.x - p.x) / d) * speed
      ball.vy = ((target.y - p.y) / d) * speed
      ball.vz = 3.5 + Math.random() * 5
      ball.carrier = null
      p.flash = 1
    }

    function step(dt, t) {
      // who chases the ball (2 per team)
      const chase = [new Set(), new Set()]
      for (let tm = 0; tm < 2; tm++) {
        players
          .filter((p) => p.team === tm && !p.gk)
          .sort((a, b) => dist(a, ball) - dist(b, ball))
          .slice(0, 2)
          .forEach((p) => chase[tm].add(p))
      }

      for (const p of players) {
        let tx, ty, sp
        if (ball.carrier === p) {
          const dir = p.team === 0 ? 1 : -1
          tx = p.x + (Math.random() - 0.35) * 6
          ty = p.y + dir * 9
          sp = 4.6
        } else if (!p.gk && chase[p.team].has(p)) {
          tx = ball.x + ball.vx * 0.25
          ty = ball.y + ball.vy * 0.25
          sp = 7.4
        } else if (!p.gk) {
          tx = p.ax + Math.sin(t * 0.35 + p.phase) * 6
          ty = p.ay + Math.sin(t * 0.27 + p.phase * 1.7) * 4 + (ball.y - p.ay) * 0.12
          sp = 2.6
        } else {
          tx = p.ax
          ty = p.ay
          sp = 2
        }
        const dx = tx - p.x
        const dy = ty - p.y
        const d = Math.hypot(dx, dy)
        if (d > 0.15) {
          const m = Math.min(d, sp * dt)
          p.x += (dx / d) * m
          p.y += (dy / d) * m
        }
        p.x = Math.max(1, Math.min(PW - 1, p.x))
        p.y = Math.max(1, Math.min(PH - 1, p.y))
        p.flash *= Math.max(0, 1 - 3 * dt)
      }

      if (ball.carrier) {
        const c = ball.carrier
        const dir = c.team === 0 ? 1 : -1
        ball.x = c.x + dir * 1.1
        ball.y = c.y + dir * 0.4
        ball.z = 0
        ball.vx = ball.vy = ball.vz = 0
        ball.hold -= dt
        if (ball.hold <= 0) pass(c)
      } else {
        ball.x += ball.vx * dt
        ball.y += ball.vy * dt
        ball.vz -= 16 * dt
        ball.z += ball.vz * dt
        if (ball.z <= 0) {
          ball.z = 0
          ball.vz = Math.abs(ball.vz) > 2 ? -ball.vz * 0.45 : 0
        }
        if (ball.z === 0) {
          const f = Math.max(0, 1 - 1.2 * dt)
          ball.vx *= f
          ball.vy *= f
        }
        if (ball.x < 0.5 || ball.x > PW - 0.5 || ball.y < 0.5 || ball.y > PH - 0.5) {
          ball.x = Math.max(0.5, Math.min(PW - 0.5, ball.x))
          ball.y = Math.max(0.5, Math.min(PH - 0.5, ball.y))
          ball.vx *= -0.5
          ball.vy *= -0.5
        }
        if (Math.hypot(ball.vx, ball.vy) < 24) {
          let best = null
          let bd = 2.2
          for (const p of players) {
            const d = dist(p, ball)
            if (d < bd && ball.z < 1.8) {
              bd = d
              best = p
            }
          }
          if (best) {
            ball.carrier = best
            ball.hold = 0.7 + Math.random() * 1.3
          }
        }
      }
    }

    function drawPitch() {
      // floodlight ambience
      for (const fx of [0.16, 0.84]) {
        const g = ctx.createRadialGradient(Wpx * fx, -Hpx * 0.15, 0, Wpx * fx, -Hpx * 0.15, Hpx * 0.75)
        g.addColorStop(0, 'rgba(237,241,245,0.045)')
        g.addColorStop(1, 'rgba(237,241,245,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, Wpx, Hpx)
      }

      // mow stripes
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

      // outline + halfway line
      ctx.beginPath()
      const c1 = proj(0, 0), c2 = proj(PW, 0), c3 = proj(PW, PH), c4 = proj(0, PH)
      ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.lineTo(c4.x, c4.y)
      ctx.closePath()
      const m1 = proj(52.5, 0), m2 = proj(52.5, PH)
      ctx.moveTo(m1.x, m1.y); ctx.lineTo(m2.x, m2.y)
      ctx.stroke()

      // center circle
      ctx.beginPath()
      for (let i = 0; i <= 40; i++) {
        const ang = (i / 40) * TAU
        const p = proj(52.5 + Math.cos(ang) * 9.15, 34 + Math.sin(ang) * 9.15)
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()

      // boxes (both ends)
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

      // goals (posts + crossbar)
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

    function drawPlayersAndBall() {
      const ents = players.map((p) => ({ y: p.y, kind: 'p', p }))
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
        } else {
          const g0 = proj(ball.x, ball.y, 0)
          const g = proj(ball.x, ball.y, ball.z)
          ctx.fillStyle = 'rgba(0,0,0,0.22)'
          ctx.beginPath()
          ctx.ellipse(g0.x, g0.y, 3.4 * g.s, 1.2 * g.s, 0, 0, TAU)
          ctx.fill()
          const r = (3 + ball.z * 0.5) * g.s
          ctx.fillStyle = 'rgba(245,247,244,0.55)'
          ctx.beginPath()
          ctx.arc(g.x, g.y, r, 0, TAU)
          ctx.fill()
          ctx.strokeStyle = 'rgba(198,245,63,0.45)'
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.lineWidth = 1.4
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, Wpx, Hpx)
      drawPitch()
      drawPlayersAndBall()
    }

    let raf = 0
    let last = 0
    let time = 0

    const loop = (ts) => {
      raf = requestAnimationFrame(loop)
      if (ts - last < 33) return
      const dt = Math.min(0.05, (ts - last) / 1000 || 0.016)
      last = ts
      time += dt
      step(dt, time)
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
