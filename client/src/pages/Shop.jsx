import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { PRODUCTS, CATEGORIES, BRANDS, TEAMS, SIZES, BOOT_SIZES } from '../data/products'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import { fmt, totalStock } from '../lib/format'

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price: Low → High' },
  { id: 'price-desc', label: 'Price: High → Low' },
  { id: 'rating', label: 'Top Rated' },
]

function FilterGroup({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line py-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between font-head text-sm font-semibold uppercase tracking-widest text-chalk">
        {title}
        <span className={`text-volt transition-transform ${open ? '' : '-rotate-90'}`}>▾</span>
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  )
}

function CheckRow({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted transition-colors hover:text-chalk">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-[#C6F53F]" />
      <span className="flex-1">{label}</span>
      {hint && <span className="text-xs text-muted/70">{hint}</span>}
    </label>
  )
}

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const cat = params.get('category') || ''
  const brand = params.get('brand') || ''
  const team = params.get('team') || ''
  const size = params.get('size') || ''
  const customizable = params.get('customizable') === '1'
  const maxPrice = Number(params.get('maxPrice')) || 13000
  const sort = params.get('sort') || 'featured'
  const q = params.get('q') || ''

  useEffect(() => {
    setLoading(true)
    const id = setTimeout(() => setLoading(false), 450)
    return () => clearTimeout(id)
  }, [params])

  const setParam = (key, val) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const results = useMemo(() => {
    let list = PRODUCTS.filter((p) => {
      if (cat && p.category !== cat) return false
      if (brand && p.brand !== brand) return false
      if (team && p.team !== team) return false
      if (customizable && !p.customizable) return false
      if (size && !p.sizes.includes(size)) return false
      if (p.price > maxPrice) return false
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
    switch (sort) {
      case 'price-asc': list = [...list].sort((a, b) => a.price - b.price); break
      case 'price-desc': list = [...list].sort((a, b) => b.price - a.price); break
      case 'rating': list = [...list].sort((a, b) => b.rating - a.rating); break
      case 'newest': list = [...list].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break
      default: list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }
    return list
  }, [cat, brand, team, size, customizable, maxPrice, sort, q])

  const activeCat = CATEGORIES.find((c) => c.id === cat)
  const sizeOptions = cat === 'boots' ? BOOT_SIZES : [...new Set([...SIZES, ...BOOT_SIZES])]

  const clearAll = () => setParams(new URLSearchParams(), { replace: true })
  const activeCount = [cat, brand, team, size, customizable ? '1' : '', q].filter(Boolean).length + (maxPrice < 13000 ? 1 : 0)

  const filterPanel = (
    <div>
      <FilterGroup title="Category">
        <CheckRow checked={!cat} onChange={() => setParam('category', '')} label="All Categories" />
        {CATEGORIES.map((c) => (
          <CheckRow key={c.id} checked={cat === c.id} onChange={() => setParam('category', c.id)} label={c.name} />
        ))}
      </FilterGroup>
      <FilterGroup title="Brand">
        {BRANDS.map((b) => (
          <CheckRow key={b} checked={brand === b} onChange={() => setParam('brand', brand === b ? '' : b)} label={b} />
        ))}
      </FilterGroup>
      <FilterGroup title="Team / Nation">
        <CheckRow checked={!team} onChange={() => setParam('team', '')} label="All Teams" />
        {Object.entries(TEAMS).map(([id, t]) => (
          <CheckRow key={id} checked={team === id} onChange={() => setParam('team', team === id ? '' : id)} label={t.name} />
        ))}
      </FilterGroup>
      <FilterGroup title="Size" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((s) => (
            <button
              key={s}
              onClick={() => setParam('size', size === s ? '' : s)}
              className={`border px-3 py-1.5 font-head text-xs uppercase tracking-wide transition-colors ${
                size === s ? 'border-volt bg-volt text-night' : 'border-line text-muted hover:border-volt hover:text-chalk'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Max Price">
        <input
          type="range"
          min={500}
          max={13000}
          step={500}
          value={maxPrice}
          onChange={(e) => setParam('maxPrice', e.target.value)}
          className="w-full accent-[#C6F53F]"
        />
        <p className="text-sm text-volt">Up to {fmt(maxPrice)}</p>
      </FilterGroup>
      <FilterGroup title="Options">
        <CheckRow checked={customizable} onChange={() => setParam('customizable', customizable ? '' : '1')} label="Customizable (name & number)" />
      </FilterGroup>
    </div>
  )

  return (
    <div className="container-fm py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-2">{q ? `Results for "${q}"` : 'Browse everything'}</p>
          <h1 className="font-display text-5xl uppercase tracking-wide text-chalk sm:text-6xl">{activeCat ? activeCat.name : 'Catalog'}</h1>
          <p className="mt-2 text-sm text-muted">{results.length} products</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setFiltersOpen(true)} className="btn-ghost !px-4 !py-2.5 !text-xs lg:hidden">
            <SlidersHorizontal size={14} /> Filters {activeCount > 0 && `(${activeCount})`}
          </button>
          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value === 'featured' ? '' : e.target.value)}
            className="input-fm !w-auto cursor-pointer !py-2.5 font-head text-xs uppercase tracking-widest"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden self-start lg:sticky lg:top-32 lg:block">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-head text-sm font-semibold uppercase tracking-[0.2em] text-chalk">Filters</p>
            {activeCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs text-ember hover:underline">
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          {filterPanel}
        </aside>

        {/* Grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <div className="grid place-items-center border border-dashed border-line py-24 text-center">
              <div>
                <p className="font-display text-4xl uppercase tracking-wide text-muted">No gear found</p>
                <p className="mt-2 text-sm text-muted">Try loosening the filters.</p>
                <button onClick={clearAll} className="btn-volt mt-6 !text-xs">Reset Filters</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {results.map((p) => <ProductCard key={p.id} product={p} hideArt />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div className={`fixed inset-0 z-[70] lg:hidden ${filtersOpen ? '' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${filtersOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setFiltersOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto border-l border-line bg-pitch p-5 transition-transform duration-250 ${filtersOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-2xl tracking-wide text-chalk">FILTERS</p>
            <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="text-muted hover:text-chalk"><X size={20} /></button>
          </div>
          {filterPanel}
          <button onClick={() => setFiltersOpen(false)} className="btn-volt mt-6 w-full justify-center !text-xs">Show {results.length} Results</button>
        </div>
      </div>
    </div>
  )
}
