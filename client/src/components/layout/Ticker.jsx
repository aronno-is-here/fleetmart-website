const ITEMS = [
  'FREE DELIVERY OVER ৳3,000',
  'JERSEY CUSTOMIZATION — NAME + NUMBER ৳250',
  'NEW SEASON KITS JUST DROPPED',
  'CASH ON DELIVERY AVAILABLE',
  '10% OFF FIRST ORDER — CODE: GEARUP10',
]

export default function Ticker() {
  const row = [...ITEMS, ...ITEMS]
  return (
    <div className="relative overflow-hidden border-b border-line bg-volt py-1.5">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {[0, 1].map((half) => (
          <div key={half} className="flex gap-10">
            {row.map((item, i) => (
              <span key={`${half}-${i}`} className="flex items-center gap-10 font-head text-xs font-semibold uppercase tracking-[0.2em] text-night">
                {item} <span className="text-night/40">⚡</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
