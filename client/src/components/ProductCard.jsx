import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Heart, Eye, ShoppingBag } from 'lucide-react'
import { ProductArt } from './ProductArt'
import Rating from './ui/Rating'
import { fmt, discounted, discountPct, totalStock } from '../lib/format'
import { addToCart } from '../features/cartSlice'
import { toggleWishlist, inWishlist } from '../features/wishlistSlice'
import { setQuickView, toast } from '../features/uiSlice'

export function ProductCardSkeleton() {
  return (
    <div className="card group overflow-hidden">
      <div className="skeleton aspect-square w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
      </div>
    </div>
  )
}

export default function ProductCard({ product }) {
  const dispatch = useDispatch()
  const wished = useSelector(inWishlist(product.id))
  const price = discounted(product)
  const pct = discountPct(product)
  const stock = totalStock(product)
  const lowStock = stock > 0 && stock <= 12

  const defaultSize = () => {
    const order = ['M', 'L', 'S', 'XL', 'XXL']
    const sizes = Object.entries(product.stock).filter(([, q]) => q > 0).map(([s]) => s)
    return sizes.sort((a, b) => order.indexOf(a) - order.indexOf(b))[0] || sizes[0]
  }

  const quickAdd = (e) => {
    e.preventDefault()
    const size = defaultSize()
    dispatch(
      addToCart({
        id: product.id, slug: product.slug, name: product.name, price,
        art: product.artColors || null, size,
        customization: product.customizable ? { name: 'FLEET', number: '10' } : null,
      })
    )
    dispatch(toast({ type: 'success', message: `${product.name} · ${size} added to bag` }))
  }

  const quickView = (e) => {
    e.preventDefault()
    dispatch(setQuickView(product))
  }

  const wish = (e) => {
    e.preventDefault()
    dispatch(toggleWishlist({ id: product.id, slug: product.slug, name: product.name }))
    dispatch(toast({ type: 'wishlist', message: wished ? 'Removed from wishlist' : 'Saved to wishlist' }))
  }

  return (
    <Link to={`/product/${product.slug}`} className="card group relative block overflow-hidden transition-all duration-200 hover:border-volt/40 hover:shadow-card">
      <div className="relative aspect-square overflow-hidden bg-night">
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-[1.04]">
          <ProductArt product={product} view="front" />
        </div>
        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <ProductArt product={product} view={product.category === 'jersey' ? 'back' : 'front'} />
        </div>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {pct > 0 && (
            <span className="bg-ember px-2 py-1 font-head text-xs font-semibold uppercase tracking-widest text-white">-{pct}%</span>
          )}
          {product.isNew && (
            <span className="bg-volt px-2 py-1 font-head text-xs font-semibold uppercase tracking-widest text-night">New</span>
          )}
        </div>

        <button
          onClick={wish}
          aria-label="Toggle wishlist"
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center border border-line bg-night/70 backdrop-blur transition-colors ${wished ? 'text-ember' : 'text-muted hover:text-chalk'}`}
        >
          <Heart size={16} className={wished ? 'fill-ember' : ''} />
        </button>

        <div className="absolute inset-x-3 bottom-3 flex translate-y-14 gap-2 opacity-0 transition-all duration-250 group-hover:translate-y-0 group-hover:opacity-100">
          <button onClick={quickAdd} className="btn-volt flex-1 !px-3 !py-2.5 !text-xs">
            <ShoppingBag size={15} /> Quick Add
          </button>
          <button onClick={quickView} aria-label="Quick view" className="grid h-10 w-10 place-items-center border border-line bg-night/80 text-chalk backdrop-blur transition-colors hover:border-volt hover:text-volt">
            <Eye size={16} />
          </button>
        </div>

        {lowStock && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-night/85 px-2 py-1 text-[11px] font-medium text-ember backdrop-blur group-hover:bottom-14 transition-all">
            <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-ember" />
            Only {stock} left
          </span>
        )}
      </div>

      <div className="space-y-1.5 p-4">
        <p className="font-head text-[11px] font-medium uppercase tracking-[0.2em] text-muted">{product.brand}</p>
        <h3 className="font-head text-[15px] font-semibold uppercase leading-snug tracking-wide text-chalk transition-colors group-hover:text-volt">
          {product.name}
        </h3>
        <div className="flex items-center justify-between pt-1">
          <p className="flex items-baseline gap-2">
            <span className="font-head text-lg font-semibold text-chalk">{fmt(price)}</span>
            {pct > 0 && <span className="text-xs text-muted line-through">{fmt(product.price)}</span>}
          </p>
          <Rating value={product.rating} size={12} showValue={false} />
        </div>
      </div>
    </Link>
  )
}
