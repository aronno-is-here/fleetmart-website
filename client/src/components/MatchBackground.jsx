import { useEffect, useRef, useState } from 'react'

/**
 * MatchBackground — fullscreen looping football video as fixed background.
 * Falls back to animated particle canvas if the video source fails to load.
 * Respects prefers-reduced-motion. Pauses when tab hidden.
 */
export default function MatchBackground() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [sourceFailed, setSourceFailed] = useState(false)

  useEffect(() => {
    if (sourceFailed) return
    const video = videoRef.current
    if (!video) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const tryPlay = () => {
      video.play().catch(() => {})
    }

    const onVisibility = () => {
      if (document.hidden) {
        video.pause()
      } else {
        tryPlay()
      }
    }

    video.addEventListener('loadeddata', tryPlay)
    video.addEventListener('canplay', tryPlay)
    document.addEventListener('visibilitychange', onVisibility)
    tryPlay()

    return () => {
      video.removeEventListener('loadeddata', tryPlay)
      video.removeEventListener('canplay', tryPlay)
      document.removeEventListener('visibilitychange', onVisibility)
      video.pause()
    }
  }, [sourceFailed])

  useEffect(() => {
    if (!sourceFailed) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let Wpx = 0, Hpx = 0
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
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * (Wpx || 1920),
        y: Math.random() * (Hpx || 1080),
        r: 0.5 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.5,
        alpha: 0.1 + Math.random() * 0.3,
      })
    }

    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      ctx.clearRect(0, 0, Wpx, Hpx)

      const g = ctx.createRadialGradient(Wpx * 0.5, Hpx * 0.4, 0, Wpx * 0.5, Hpx * 0.4, Wpx * 0.6)
      g.addColorStop(0, 'rgba(17,25,35,0.95)')
      g.addColorStop(1, 'rgba(10,14,19,1)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, Wpx, Hpx)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.y < -10) { p.y = Hpx + 10; p.x = Math.random() * Wpx }
        ctx.fillStyle = `rgba(198,245,63,${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [sourceFailed])

  return (
    <>
      {!sourceFailed && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setSourceFailed(true)}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            pointerEvents: 'none',
            zIndex: 0,
            filter: 'brightness(0.5) saturate(0.6) contrast(1.1)',
          }}
        >
          <source src="/football-bg.mp4" type="video/mp4" />
        </video>
      )}
      {sourceFailed && (
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(180deg, rgba(10,14,19,0.4) 0%, transparent 50%, rgba(10,14,19,0.5) 100%)',
        }}
      />
    </>
  )
}
