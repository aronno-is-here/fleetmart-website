import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { ProductArt } from '../components/ProductArt'
import { toggleWishlist } from '../features/wishlistSlice'
import { addToCart } from '../features/cartSlice'
import { toast } from '../features/uiSlice'
import { fmt, discounted } from '../lib/format'
import api from '../lib/api'

export default function Wishlist() {
  const dispatch = useDispatch()
  const wish = useSelector((s) => s.wishlist)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!wish.length) { setItems([]); setLoading(false); return }
    setLoading(true)
    const slugs = wish.map(w => w.slug).filter(Boolean)
    if (!slugs.length) { setItems([]); setLoading(false); return }
    Promise.all(slugs.map(s => api.get(`/products/${s}`).then(r => r.data.product).catch(() => null)))
      .then(products => setItems(products.filter(Boolean)))
      .finally(() => setLoading(false))
  }, [wish])

  return (
    <div className="container-fm py-10">
      <p className="eyebrow mb-2">Saved for later</p>
      <h1 className="mb-8 font-display text-5xl uppercase tracking-wide text-chalk">Wishlist</h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-5 border border-line bg-pitch p-4">
              <div className="h-20 w-20 shrink-0 bg-pitch2 animate-pulse rounded" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="grid place-items-center border border-dashed border-line py-28 text-center">
          <div>
            <Heart size={44} className="mx-auto text-line" />
            <p className="mt-4 font-display text-4xl uppercase tracking-wide text-muted">Nothing saved yet</p>
            <p className="mt-2 text-sm text-muted">Tap the heart on any kit to keep it on the bench.</p>
            <Link to="/shop" className="btn-volt mt-6 !text-xs">Discover Gear</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <div key={p._id} className="flex flex-wrap items-center gap-5 border border-line bg-pitch p-4">
              <Link to={`/product/${p.slug}`} className="h-20 w-20 shrink-0 border border-line bg-night overflow-hidden">
                {p.images?.[0] ? (
                  <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <ProductArt product={p} />
                )}
              </Link>
              <div className="min-w-40 flex-1">
                <Link to={`/product/${p.slug}`} className="font-head text-base font-semibold uppercase tracking-wide text-chalk hover:text-volt">{p.name}</Link>
                <p className="mt-1 font-head text-lg font-semibold text-chalk">{fmt(discounted(p))}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const size = Object.keys(p.stock).find((s) => p.stock[s] > 0) || 'M'
                    dispatch(addToCart({ id: p._id, slug: p.slug, name: p.name, price: discounted(p), art: p.artColors || null, size, customization: null }))
                    dispatch(toast({ type: 'success', message: `Moved ${p.name} to bag` }))
                  }}
                  className="btn-volt !px-4 !py-2.5 !text-xs"
                >
                  <ShoppingBag size={14} /> Move to Bag
                </button>
                <button
                  onClick={() => {
                    dispatch(toggleWishlist({ id: p._id }))
                    dispatch(toast({ type: 'wishlist', message: 'Removed from wishlist' }))
                  }}
                  aria-label="Remove from wishlist"
                  className="grid h-10 w-10 place-items-center border border-line text-muted transition-colors hover:border-ember hover:text-ember"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          <p className="pt-4 text-sm text-muted">Want to compare side by side? {items.length >= 2 && 'Open any two products in tabs.'}</p>
        </div>
      )}
    </div>
  )
}
