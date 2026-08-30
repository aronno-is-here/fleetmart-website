import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { PRODUCTS } from '../data/products'
import { ProductArt } from '../components/ProductArt'
import { toggleWishlist } from '../features/wishlistSlice'
import { addToCart } from '../features/cartSlice'
import { toast } from '../features/uiSlice'
import { fmt, discounted } from '../lib/format'

export default function Wishlist() {
  const dispatch = useDispatch()
  const wish = useSelector((s) => s.wishlist)
  const items = wish.map((w) => PRODUCTS.find((p) => p.id === w.id)).filter(Boolean)

  return (
    <div className="container-fm py-10">
      <p className="eyebrow mb-2">Saved for later</p>
      <h1 className="mb-8 font-display text-5xl uppercase tracking-wide text-chalk">Wishlist</h1>

      {items.length === 0 ? (
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
            <div key={p.id} className="flex flex-wrap items-center gap-5 border border-line bg-pitch p-4">
              <Link to={`/product/${p.slug}`} className="h-20 w-20 shrink-0 border border-line bg-night"><ProductArt product={p} /></Link>
              <div className="min-w-40 flex-1">
                <Link to={`/product/${p.slug}`} className="font-head text-base font-semibold uppercase tracking-wide text-chalk hover:text-volt">{p.name}</Link>
                <p className="mt-1 font-head text-lg font-semibold text-chalk">{fmt(discounted(p))}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const size = Object.keys(p.stock).find((s) => p.stock[s] > 0) || 'M'
                    dispatch(addToCart({ id: p.id, slug: p.slug, name: p.name, price: discounted(p), art: p.artColors || null, size, customization: null }))
                    dispatch(toast({ type: 'success', message: `Moved ${p.name} to bag` }))
                  }}
                  className="btn-volt !px-4 !py-2.5 !text-xs"
                >
                  <ShoppingBag size={14} /> Move to Bag
                </button>
                <button
                  onClick={() => {
                    dispatch(toggleWishlist({ id: p.id }))
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