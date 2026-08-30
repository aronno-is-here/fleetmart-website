import { Star, StarHalf } from 'lucide-react'

export default function Rating({ value = 0, count = 0, size = 14, showValue = true }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < full)
            return <Star key={i} size={size} className="fill-gold text-gold" />
          if (i === full && half)
            return (
              <span key={i} className="relative inline-flex">
                <Star size={size} className="text-line" />
                <StarHalf size={size} className="absolute inset-0 fill-gold text-gold" />
              </span>
            )
          return <Star key={i} size={size} className="text-line" />
        })}
      </span>
      {showValue && (
        <span className="text-xs text-muted">
          {value.toFixed(1)} {count > 0 && `(${count})`}
        </span>
      )}
    </span>
  )
}
