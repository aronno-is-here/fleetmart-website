import { useState, useRef, useCallback, useEffect } from 'react'
import { fmt } from '../lib/format'

const PRICE_MIN = 0
const PRICE_MAX = 15000
const STEP = 100

export default function PriceRange({ min, max, onChange }) {
  const [localMin, setLocalMin] = useState(min)
  const [localMax, setLocalMax] = useState(max)
  const [dragging, setDragging] = useState(null)
  const [inputMin, setInputMin] = useState(String(min))
  const [inputMax, setInputMax] = useState(String(max))
  const trackRef = useRef(null)

  useEffect(() => {
    setLocalMin(min)
    setLocalMax(max)
    setInputMin(String(min))
    setInputMax(String(max))
  }, [min, max])

  const clamp = (v) => Math.round(Math.max(PRICE_MIN, Math.min(PRICE_MAX, v)) / STEP) * STEP

  const pct = (v) => ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100

  const valFromX = useCallback((clientX) => {
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return clamp(PRICE_MIN + ratio * (PRICE_MAX - PRICE_MIN))
  }, [])

  const onPointerDown = useCallback((handle, e) => {
    e.preventDefault()
    setDragging(handle)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const v = valFromX(e.clientX || e.touches?.[0]?.clientX)
      if (dragging === 'min') {
        const clamped = Math.min(v, localMax - STEP)
        setLocalMin(clamped)
        setInputMin(String(clamped))
      } else {
        const clamped = Math.max(v, localMin + STEP)
        setLocalMax(clamped)
        setInputMax(String(clamped))
      }
    }
    const onUp = () => {
      setDragging(null)
      onChange(localMin, localMax)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, localMin, localMax, valFromX, onChange])

  const commitMin = () => {
    let v = parseInt(inputMin, 10)
    if (isNaN(v)) v = PRICE_MIN
    v = clamp(v)
    if (v >= localMax) v = localMax - STEP
    setLocalMin(v)
    setInputMin(String(v))
    onChange(v, localMax)
  }

  const commitMax = () => {
    let v = parseInt(inputMax, 10)
    if (isNaN(v)) v = PRICE_MAX
    v = clamp(v)
    if (v <= localMin) v = localMin + STEP
    setLocalMax(v)
    setInputMax(String(v))
    onChange(localMin, v)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted">Min</label>
          <input
            type="number"
            min={PRICE_MIN}
            max={localMax - STEP}
            step={STEP}
            value={inputMin}
            onChange={(e) => setInputMin(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={commitMin}
            onKeyDown={(e) => { if (e.key === 'Enter') commitMin() }}
            className="input-fm !py-2 !px-3 text-center font-head text-sm"
          />
        </div>
        <span className="mt-5 text-muted">–</span>
        <div className="flex-1">
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted">Max</label>
          <input
            type="number"
            min={localMin + STEP}
            max={PRICE_MAX}
            step={STEP}
            value={inputMax}
            onChange={(e) => setInputMax(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={commitMax}
            onKeyDown={(e) => { if (e.key === 'Enter') commitMax() }}
            className="input-fm !py-2 !px-3 text-center font-head text-sm"
          />
        </div>
      </div>

      <div className="relative h-6 select-none" ref={trackRef}>
        <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 rounded bg-pitch2">
          <div
            className="absolute h-full bg-volt rounded"
            style={{ left: `${pct(localMin)}%`, right: `${100 - pct(localMax)}%` }}
          />
        </div>
        <button
          onPointerDown={(e) => onPointerDown('min', e)}
          aria-label={`Minimum price: ${fmt(localMin)}`}
          className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-volt bg-night transition-shadow hover:shadow-volt focus:outline-none focus:ring-2 focus:ring-volt/50"
          style={{ left: `${pct(localMin)}%` }}
        />
        <button
          onPointerDown={(e) => onPointerDown('max', e)}
          aria-label={`Maximum price: ${fmt(localMax)}`}
          className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-volt bg-night transition-shadow hover:shadow-volt focus:outline-none focus:ring-2 focus:ring-volt/50"
          style={{ left: `${pct(localMax)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted">
        <span>{fmt(PRICE_MIN)}</span>
        <span className="text-volt font-head">{fmt(localMin)} – {fmt(localMax)}</span>
        <span>{fmt(PRICE_MAX)}</span>
      </div>
    </div>
  )
}
