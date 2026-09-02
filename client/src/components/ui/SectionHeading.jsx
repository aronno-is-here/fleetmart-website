import { Link } from 'react-router-dom'

export default function SectionHeading({ eyebrow, title, action, to }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="font-display text-4xl uppercase leading-none tracking-wide text-chalk dark:text-chalk text-gray-900 sm:text-5xl">{title}</h2>
      </div>
      {action &&
        (to ? (
          <Link to={to} className="group hidden items-center gap-2 font-head text-sm font-semibold uppercase tracking-widest text-volt sm:inline-flex">
            {action}
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        ) : (
          <button className="group hidden items-center gap-2 font-head text-sm font-semibold uppercase tracking-widest text-volt sm:inline-flex">
            {action}
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>
        ))}
    </div>
  )
}
