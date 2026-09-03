import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { ChevronRight, Minus, Plus, ShoppingBag, Heart, Truck, RefreshCcw, BadgeCheck, Ruler, Printer, Star, Send } from 'lucide-react'
import { TEAMS } from '../data/products'
import { ProductArt } from '../components/ProductArt'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import Rating from '../components/ui/Rating'
import SectionHeading from '../components/ui/SectionHeading'
import SEO from '../components/SEO'
import { fmt, discounted, discountPct } from '../lib/format'
import { addToCart } from '../features/cartSlice'
import { toggleWishlist, inWishlist } from '../features/wishlistSlice'
import { setCartOpen, toast, pushRecentlyViewed } from '../features/uiSlice'
import api from '../lib/api'

const CUSTOM_FEE = 150

function Accordion({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left">
        <span className="flex items-center gap-2 font-head text-sm font-semibold uppercase tracking-widest text-chalk">{icon}{title}</span>
        <span className={`text-volt transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="pb-5 text-sm leading-relaxed text-muted">{children}</div>}
    </div>
  )
}

export default function ProductDetails() {
  const { slug } = useParams()
  const dispatch = useDispatch()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [related, setRelated] = useState([])
  const wished = useSelector(inWishlist(product?._id))

  const [view, setView] = useState('front')
  const [size, setSize] = useState(null)
  const [qty, setQty] = useState(1)
  const [custom, setCustom] = useState({ name: '', number: '' })

  const [reviewEligibility, setReviewEligibility] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', orderId: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  const auth = useSelector((s) => s.auth)

  useEffect(() => {
    setLoading(true)
    setProduct(null)
    setReviews([])
    setRelated([])
    setView('front')
    setSize(null)
    setQty(1)
    setCustom({ name: '', number: '' })
    window.scrollTo(0, 0)

    api.get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data.product)
        dispatch(pushRecentlyViewed({ id: data.product._id, slug: data.product.slug }))
        return api.get('/products', { params: { category: data.product.category, limit: 4 } })
      })
      .then(({ data }) => {
        setRelated(data.products.filter(p => p.slug !== slug).slice(0, 4))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, dispatch])

  useEffect(() => {
    if (!product) return
    api.get(`/reviews/${product._id}`)
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => {})

    if (auth?.token) {
      api.get(`/reviews/eligibility/${product._id}`)
        .then(({ data }) => setReviewEligibility(data))
        .catch(() => setReviewEligibility({ eligible: false, hasReviewed: false }))
    }
  }, [product, auth?.token])

  if (loading) {
    return (
      <div className="container-fm py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-square bg-pitch border border-line animate-pulse" />
          <div className="space-y-4">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-10 w-2/3" />
            <div className="skeleton h-6 w-1/4" />
            <div className="skeleton h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-fm grid place-items-center py-32 text-center">
        <div>
          <p className="font-display text-6xl uppercase text-chalk">Foul Play</p>
          <p className="mt-3 text-muted">This product has left the pitch.</p>
          <Link to="/shop" className="btn-volt mt-8 !text-xs">Back to Shop</Link>
        </div>
      </div>
    )
  }

  const price = discounted(product)
  const pct = discountPct(product)
  const isCustomizing = product.customizable && (custom.name.trim() || custom.number.trim())
  const unitPrice = price + (isCustomizing ? CUSTOM_FEE : 0)
  const sizeStock = size != null ? product.stock[size] : null

  const team = product.team ? TEAMS[product.team] : null
  const artCustom = team
    ? {}
    : {
        primary: custom.primaryColor || product.artColors?.primary,
        number: custom.number || '10',
        name: (custom.name || 'FLEET').toUpperCase(),
      }
  const jerseyCustom = team
    ? { primary: team.primary, secondary: team.secondary, number: custom.number || '10', name: (custom.name || 'FLEET').toUpperCase(), view }
    : { ...product.artColors, number: custom.number || '10', name: (custom.name || 'FLEET').toUpperCase(), view }

  const addNow = (buyNow = false) => {
    const chosen = size || Object.keys(product.stock).find((s) => product.stock[s] > 0)
    if (!chosen) {
      dispatch(toast({ type: 'error', message: 'Out of stock' }))
      return
    }
    dispatch(
      addToCart({
        id: product._id, slug: product.slug, name: product.name,
        price: unitPrice, art: product.artColors || null, size: chosen, qty,
        customization: isCustomizing ? { name: custom.name.toUpperCase().slice(0, 12), number: custom.number.slice(0, 2) } : null,
      })
    )
    dispatch(toast({ type: 'success', message: `${product.name} · ${chosen} added to bag` }))
    if (buyNow) {
      dispatch(setCartOpen(false))
      window.location.href = '/checkout'
    } else {
      dispatch(setCartOpen(true))
    }
  }

  const submitReview = async () => {
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      dispatch(toast({ type: 'error', message: 'Please select a rating' }))
      return
    }
    setSubmittingReview(true)
    try {
      await api.post('/reviews', {
        product: product._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        orderId: reviewForm.orderId || undefined,
      })
      dispatch(toast({ type: 'success', message: 'Review submitted!' }))
      setReviewSubmitted(true)
      setShowReviewForm(false)
      const { data } = await api.get(`/reviews/${product._id}`)
      setReviews(data.reviews || [])
      setReviewEligibility(prev => ({ ...prev, hasReviewed: true }))
    } catch (err) {
      dispatch(toast({ type: 'error', message: err.response?.data?.message || 'Failed to submit review' }))
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <div className="pb-20">
      <SEO
        title={product.name}
        description={product.description || `${product.name} - ${product.brand} football gear. ${fmt(product.discountPrice || product.price)}`}
        image={product.images?.[0]?.url}
        url={`/product/${product.slug}`}
        type="product"
        product={{
          name: product.name,
          description: product.description,
          brand: product.brand,
          price: product.price,
          discountPrice: product.discountPrice,
          images: product.images,
          rating: product.rating,
          numReviews: product.numReviews,
          totalStock: Object.values(product.stock || {}).reduce((a, b) => a + b, 0),
        }}
      />
      <div className="border-b border-line bg-pitch/40">
        <div className="container-fm flex items-center gap-2 py-3 text-xs uppercase tracking-widest text-muted">
          <Link to="/" className="hover:text-volt">Home</Link>
          <ChevronRight size={12} />
          <Link to={`/shop?category=${product.category}`} className="hover:text-volt">{product.category}</Link>
          <ChevronRight size={12} />
          <span className="text-chalk">{product.name}</span>
        </div>
      </div>

      <div className="container-fm grid gap-10 py-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative aspect-square cursor-pointer overflow-hidden border border-line bg-night"
            onClick={() => setView(view === 'front' ? 'back' : 'front')}
          >
            {product.images?.length > 0 ? (
              <img src={product.images[0].url} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <ProductArt product={product} view={view} custom={product.category === 'jersey' ? jerseyCustom : artCustom} />
            )}
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {pct > 0 && <span className="bg-ember px-2 py-1 font-head text-xs font-semibold uppercase tracking-widest text-white">-{pct}%</span>}
              {product.isNew && <span className="bg-volt px-2 py-1 font-head text-xs font-semibold uppercase tracking-widest text-night">New</span>}
            </div>
            {product.images?.length > 1 && (
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 border border-line bg-night/80 px-3 py-1 text-[10px] uppercase tracking-widest text-muted backdrop-blur">
                Tap to flip · {view}
              </span>
            )}
          </motion.div>
          {product.images?.length > 1 && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setView(i === 0 ? 'front' : 'back')}
                  className={`aspect-[16/10] border bg-night transition-colors overflow-hidden ${view === (i === 0 ? 'front' : 'back') ? 'border-volt' : 'border-line hover:border-volt/50'}`}
                >
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="eyebrow mb-2">{product.brand} · {product.category}</p>
          <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-chalk">{product.name}</h1>
          <div className="mt-3 flex items-center gap-4">
            <Rating value={product.rating} count={product.numReviews} />
            {product.team && TEAMS[product.team] && <span className="border border-line px-2 py-0.5 text-[11px] uppercase tracking-widest text-muted">{TEAMS[product.team].name}</span>}
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-head text-3xl font-semibold text-chalk">{fmt(price)}</span>
            {pct > 0 && <span className="text-lg text-muted line-through">{fmt(product.price)}</span>}
            {pct > 0 && <span className="bg-ember px-2 py-0.5 font-head text-sm font-semibold text-white">Save {pct}%</span>}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted">{product.description}</p>

          {/* Sizes */}
          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-head text-xs font-semibold uppercase tracking-[0.2em] text-muted">Select size</p>
              <span className="flex items-center gap-1.5 text-xs text-muted"><Ruler size={13} /> Size guide</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(product.stock).map(([s, q]) => (
                <button
                  key={s}
                  disabled={q === 0}
                  onClick={() => setSize(s)}
                  className={`relative min-w-12 border px-3.5 py-2.5 font-head text-sm uppercase tracking-wide transition-colors ${
                    q === 0
                      ? 'cursor-not-allowed border-line text-muted/40 line-through'
                      : size === s
                      ? 'border-volt bg-volt font-semibold text-night'
                      : 'border-line text-chalk hover:border-volt'
                  }`}
                >
                  {s}
                  {q > 0 && q <= 4 && (
                    <span className={`absolute -right-1 -top-1 h-2 w-2 rounded-full ${size === s ? 'bg-night ring-2 ring-ember' : 'bg-ember animate-pulseDot'}`} />
                  )}
                </button>
              ))}
            </div>
            {size && sizeStock != null && sizeStock <= 4 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ember">
                <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-ember" /> Hurry — only {sizeStock} left in {size}
              </p>
            )}
          </div>

          {/* Jersey customizer */}
          {product.customizable && (
            <div className="mt-7 border border-volt/30 bg-volt/5 p-5">
              <p className="flex items-center gap-2 font-head text-sm font-semibold uppercase tracking-widest text-volt">
                <Printer size={16} /> Customize — Name & Number <span className="text-muted">(+{fmt(CUSTOM_FEE)})</span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Player name</label>
                  <input
                    value={custom.name}
                    maxLength={12}
                    onChange={(e) => setCustom({ ...custom, name: e.target.value.replace(/[^a-zA-Z ]/g, '').toUpperCase() })}
                    placeholder="E.g. TAMIM"
                    className="input-fm !py-2.5 font-head uppercase tracking-widest"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Number</label>
                  <input
                    value={custom.number}
                    maxLength={2}
                    onChange={(e) => setCustom({ ...custom, number: e.target.value.replace(/\D/g, '') })}
                    placeholder="10"
                    className="input-fm !py-2.5 font-head tracking-widest"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">Live preview updates on the kit image. Printed with pro-grade vinyl — wash-proof.</p>
            </div>
          )}

          {/* Qty + CTA */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center border border-line">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-12 w-11 place-items-center text-muted hover:text-volt" aria-label="Decrease"><Minus size={15} /></button>
              <span className="w-10 text-center font-head">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="grid h-12 w-11 place-items-center text-muted hover:text-volt" aria-label="Increase"><Plus size={15} /></button>
            </div>
            <button onClick={() => addNow(false)} className="btn-volt flex-1 !py-3.5">
              <ShoppingBag size={17} /> Add to Bag — {fmt(unitPrice * qty)}
            </button>
            <button onClick={() => addNow(true)} className="btn-ghost !py-3.5">Buy Now</button>
            <button
              onClick={() => {
                dispatch(toggleWishlist({ id: product._id, slug: product.slug, name: product.name }))
                dispatch(toast({ type: 'wishlist', message: wished ? 'Removed from wishlist' : 'Saved to wishlist' }))
              }}
              aria-label="Wishlist"
              className={`grid h-12 w-12 place-items-center border transition-colors ${wished ? 'border-ember text-ember' : 'border-line text-muted hover:border-ember hover:text-ember'}`}
            >
              <Heart size={17} className={wished ? 'fill-ember' : ''} />
            </button>
          </div>

          {/* trust */}
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-line pt-6 text-center">
            {[
              { icon: <Truck size={18} className="text-volt" />, label: 'Free over ৳3,000' },
              { icon: <RefreshCcw size={18} className="text-volt" />, label: '7-day returns' },
              { icon: <BadgeCheck size={18} className="text-volt" />, label: 'Authentic gear' },
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1.5 text-xs text-muted">{t.icon}{t.label}</div>
            ))}
          </div>

          <div className="mt-6">
            <Accordion title="Details & Fabric" defaultOpen>
              {product.description}
            </Accordion>
            <Accordion title="Size Chart">
              <div className="overflow-hidden border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-pitch2 font-head uppercase tracking-widest text-chalk">
                    <tr><th className="p-2.5">Size</th><th className="p-2.5">Chest (in)</th><th className="p-2.5">Length (in)</th></tr>
                  </thead>
                  <tbody className="text-muted">
                    {[['S', '36-38', '26'], ['M', '38-40', '27'], ['L', '40-42', '28'], ['XL', '42-44', '29'], ['XXL', '44-46', '30']].map((r) => (
                      <tr key={r[0]} className="border-t border-line"><td className="p-2.5">{r[0]}</td><td className="p-2.5">{r[1]}</td><td className="p-2.5">{r[2]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Accordion>
            <Accordion title="Delivery & Returns">
              Dhaka: 24–48 hours · Outside Dhaka: 2–4 days. Free delivery over ৳3,000. 7-day easy return on unworn items with tags.
            </Accordion>
          </div>
        </motion.div>
      </div>

      {/* Reviews */}
      <section className="border-t border-line bg-pitch/40 py-14">
        <div className="container-fm grid gap-10 lg:grid-cols-[300px_1fr]">
          <div>
            <SectionHeading eyebrow="Verified buyers" title="Reviews" />
            <div className="border border-line bg-night p-6 text-center">
              <p className="font-display text-6xl text-volt">{product.rating.toFixed(1)}</p>
              <div className="mt-2 flex justify-center"><Rating value={product.rating} showValue={false} /></div>
              <p className="mt-1 text-xs text-muted">{product.numReviews} verified reviews</p>
            </div>

            {reviewEligibility?.eligible && !reviewEligibility?.hasReviewed && !reviewSubmitted && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="btn-volt w-full mt-4 !text-xs"
              >
                <Star size={14} /> Write a Review
              </button>
            )}
            {reviewEligibility?.hasReviewed && (
              <div className="mt-4 border border-volt/30 bg-volt/5 p-4 text-center">
                <p className="text-xs text-volt font-head uppercase tracking-widest">You've reviewed this product</p>
              </div>
            )}
            {reviewSubmitted && (
              <div className="mt-4 border border-green-500/30 bg-green-500/5 p-4 text-center">
                <p className="text-xs text-green-400 font-head uppercase tracking-widest">Review submitted!</p>
              </div>
            )}
            {!reviewEligibility?.eligible && reviewEligibility !== null && !reviewEligibility?.hasReviewed && (
              <div className="mt-4 border border-line bg-pitch p-4 text-center">
                <p className="text-xs text-muted">Purchase and receive this product to leave a review.</p>
              </div>
            )}
          </div>

          <div>
            {showReviewForm && (
              <div className="mb-6 border border-volt/30 bg-volt/5 p-6">
                <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk mb-4">Write Your Review</p>
                <div className="mb-4">
                  <label className="mb-2 block text-xs uppercase tracking-widest text-muted">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="text-2xl transition-colors"
                      >
                        <Star
                          size={28}
                          className={star <= reviewForm.rating ? 'fill-gold text-gold' : 'text-line'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                {reviewEligibility?.deliveredOrders?.length > 1 && (
                  <div className="mb-4">
                    <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Which order?</label>
                    <select
                      value={reviewForm.orderId}
                      onChange={(e) => setReviewForm({ ...reviewForm, orderId: e.target.value })}
                      className="input-fm"
                    >
                      <option value="">Select an order (optional)</option>
                      {reviewEligibility.deliveredOrders.map((o) => (
                        <option key={o._id} value={o._id}>#{o.orderId}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="mb-4">
                  <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Your Review</label>
                  <textarea
                    rows={4}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Tell others what you think about this product..."
                    className="input-fm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={submitReview}
                    disabled={submittingReview || reviewForm.rating < 1}
                    className="btn-volt !text-xs"
                  >
                    <Send size={14} /> {submittingReview ? 'Submitting…' : 'Submit Review'}
                  </button>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="btn-ghost !text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <ul className="space-y-4">
              {reviews.length === 0 ? (
                <li className="border border-dashed border-line bg-pitch p-8 text-center text-sm text-muted">No reviews yet — be the first to review this product.</li>
              ) : (
                reviews.map((r) => (
                  <li key={r._id} className="border border-line bg-pitch p-5">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center bg-volt/15 font-display text-volt">{r.reviewerName?.[5] || '?'}</span>
                        <span>
                          <span className="block font-head text-sm font-semibold uppercase tracking-wide text-chalk">{r.reviewerName || 'Anonymous'}</span>
                          <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </span>
                      </p>
                      <Rating value={r.rating} size={13} showValue={false} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{r.comment}</p>
                    {r.verifiedPurchase && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-azure"><BadgeCheck size={12} /> Verified Purchase</p>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="container-fm py-14">
          <SectionHeading eyebrow="Complete the kit" title="You Might Also Like" action="Shop all" to="/shop" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
