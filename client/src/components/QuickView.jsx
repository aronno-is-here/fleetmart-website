import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { X, ShoppingBag, Heart } from 'lucide-react'
import { setQuickView, toast } from '../features/uiSlice'
import { addToCart } from '../features/cartSlice'
import { toggleWishlist } from '../features/wishlistSlice'
import { ProductArt } from './ProductArt'
import Rating from './ui/Rating'
import { fmt, discounted, discountPct, totalStock } from '../lib/format'

export default function QuickView() {
  const dispatch = useDispatch()
  const product = useSelector((s) => s.ui.quickView)
  const [size, setSize] = useState(null)
  const [view, setView] = useState('front')

  if (!product) return null

  const price = discounted(product)
  const pct = discountPct(product)
  const stockEntries = Object.entries(product.stock)
  const inStock = totalStock(product) > 0

  const close = () => {
    dispatch(setQuickView(null))
    setSize(null)
    setView('front')
  }

  const add = () => {
    const chosen = size || stockEntries.find(([, q]) => q > 0)?.[0]
    if (!chosen) return
    dispatch(
      addToCart({
        id: product._id, slug: product.slug, name: product.name, price,
        art: product.artColors || null, size: chosen,
        customization: product.customizable ? { name: 'FLEET', number: '10' } : null,
      })
    )
    dispatch(toast({ type: 'success', message: `${product.name} · ${chosen} added to bag` }))
    close()
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-night/90 p-4 backdrop-blur-md" onClick={close}>
        <div className="relative grid w-full max-w-3xl border border-line bg-pitch shadow-card animate-fadeUp md:grid-cols-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} aria-label="Close quick view" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center border border-line bg-night/70 text-muted backdrop-blur hover:text-chalk">
          <X size={16} />
        </button>

        <div className="relative aspect-square cursor-pointer bg-night" onClick={() => setView(view === 'front' ? 'back' : 'front')}>
          <ProductArt product={product} view={view} />
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 border border-line bg-night/80 px-3 py-1 text-[10px] uppercase tracking-widest text-muted backdrop-blur">
            Click to flip · {view === 'front' ? 'Front' : 'Back'}
          </span>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div>
            <p className="eyebrow mb-1">{product.brand}</p>
            <h3 className="font-display text-3xl uppercase leading-none tracking-wide text-chalk">{product.name}</h3>
            <div className="mt-2"><Rating value={product.rating} count={product.numReviews} /></div>
          </div>

          <p className="flex items-baseline gap-3">
            <span className="font-head text-2xl font-semibold text-chalk">{fmt(price)}</span>
            {pct > 0 && (
              <>
                <span className="text-sm text-muted line-through">{fmt(product.price)}</span>
                <span className="bg-ember px-2 py-0.5 font-head text-xs font-semibold text-white">-{pct}%</span>
              </>
            )}
          </p>

          <p className="line-clamp-3 text-sm leading-relaxed text-muted">{product.description}</p>

          <div>
            <p className="mb-2 font-head text-xs font-semibold uppercase tracking-[0.2em] text-muted">Select size</p>
            <div className="flex flex-wrap gap-2">
              {stockEntries.map(([s, q]) => (
                <button
                  key={s}
                  disabled={q === 0}
                  onClick={() => setSize(s)}
                  className={`min-w-11 border px-3 py-2 font-head text-sm uppercase tracking-wide transition-colors ${
                    q === 0
                      ? 'cursor-not-allowed border-line text-muted/40 line-through'
                      : size === s
                      ? 'border-volt bg-volt font-semibold text-night'
                      : 'border-line text-chalk hover:border-volt'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex gap-2">
            <button onClick={add} disabled={!inStock} className="btn-volt flex-1 !text-xs">
              <ShoppingBag size={15} /> Add to Bag
            </button>
            <button
              onClick={() => {
                dispatch(toggleWishlist({ id: product._id, slug: product.slug, name: product.name }))
                dispatch(toast({ type: 'wishlist', message: 'Wishlist updated' }))
              }}
              aria-label="Wishlist"
              className="grid w-11 place-items-center border border-line text-muted transition-colors hover:border-ember hover:text-ember"
            >
              <Heart size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
