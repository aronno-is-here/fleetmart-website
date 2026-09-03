import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Search, X, ArrowRight } from 'lucide-react'
import { CATEGORIES } from '../data/products'
import { setSearchOpen } from '../features/uiSlice'
import { fmt, discounted } from '../lib/format'
import api from '../lib/api'

export default function SearchOverlay() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const open = useSelector((s) => s.ui.searchOpen)
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && dispatch(setSearchOpen(false))
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  useEffect(() => {
    const term = q.trim()
    if (!term) { setResults([]); return }
    const t = setTimeout(() => {
      api.get('/products', { params: { search: term, limit: 6 } })
        .then(({ data }) => setResults(data.products))
        .catch(() => setResults([]))
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const go = (slug) => {
    dispatch(setSearchOpen(false))
    setQ('')
    navigate(`/product/${slug}`)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-night/90 px-4 pt-24 backdrop-blur-md" onClick={() => dispatch(setSearchOpen(false))}>
      <div className="w-full max-w-2xl border border-line bg-pitch shadow-card animate-fadeUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Search size={20} className="text-volt" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) go(results[0].slug)
            }}
            placeholder="Search jerseys, boots, clubs…"
            className="w-full bg-transparent text-lg text-chalk outline-none placeholder:text-muted"
          />
          <button onClick={() => dispatch(setSearchOpen(false))} aria-label="Close search" className="text-muted hover:text-chalk">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {results.length > 0 ? (
            <ul className="divide-y divide-line">
              {results.map((p) => (
                <li key={p._id}>
                  <button onClick={() => go(p.slug)} className="group flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-pitch2">
                    <span className="h-12 w-12 shrink-0 border border-line bg-night flex items-center justify-center overflow-hidden">
                      {p.images?.[0] ? (
                        <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-muted font-head">IMG</span>
                      )}
                    </span>
                    <span className="flex-1">
                      <span className="block font-head text-sm font-semibold uppercase tracking-wide text-chalk group-hover:text-volt">{p.name}</span>
                      <span className="text-xs uppercase tracking-widest text-muted">{p.brand} · {p.category}</span>
                    </span>
                    <span className="font-head font-semibold text-chalk">{fmt(discounted(p))}</span>
                    <ArrowRight size={16} className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-volt" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-6">
              <p className="eyebrow mb-3">{q ? 'No matches — try these' : 'Popular searches'}</p>
              <div className="flex flex-wrap gap-2">
                {['Jersey', 'Volt Armada', 'Boots', 'Bangladesh', 'Retro', 'Turf'].map((t) => (
                  <button key={t} onClick={() => setQ(t)} className="border border-line px-3 py-1.5 text-xs uppercase tracking-widest text-muted transition-colors hover:border-volt hover:text-volt">
                    {t}
                  </button>
                ))}
              </div>
              <p className="eyebrow mb-3 mt-6">Browse</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      dispatch(setSearchOpen(false))
                      navigate(`/shop?category=${c.id}`)
                    }}
                    className="border border-line px-3 py-1.5 text-xs uppercase tracking-widest text-chalk/80 transition-colors hover:border-volt hover:text-volt"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
