import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Trash2, Plus, Minus, Tag, X, ArrowRight } from 'lucide-react'
import { removeFromCart, setQty, cartTotal } from '../features/cartSlice'
import { toast } from '../features/uiSlice'
import { fmt } from '../lib/format'

const COUPONS = { GEARUP10: 10, MATCHDAY5: 5 }

export default function Cart() {
  const dispatch = useDispatch()
  const items = useSelector((s) => s.cart)
  const total = useSelector(cartTotal)
  const [code, setCode] = useState('')
  const [applied, setApplied] = useState(null) // { code, pct }

  const discount = applied ? Math.round((total * applied.pct) / 100) : 0
  const shipping = total >= 3000 || total === 0 ? 0 : 80
  const grand = total - discount + shipping

  const applyCoupon = () => {
    const c = code.trim().toUpperCase()
    if (COUPONS[c]) {
      setApplied({ code: c, pct: COUPONS[c] })
      dispatch(toast({ type: 'success', message: `Coupon ${c} applied — ${COUPONS[c]}% off` }))
      setCode('')
    } else {
      dispatch(toast({ type: 'error', message: 'Invalid or expired coupon' }))
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-fm grid place-items-center py-32 text-center">
        <div>
          <p className="font-display text-6xl uppercase tracking-wide text-chalk">Your bag is empty</p>
          <p className="mt-3 text-muted">The pitch is waiting. Grab your kit.</p>
          <Link to="/shop" className="btn-volt mt-8">Shop Now <ArrowRight size={16} /></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fm py-10">
      <p className="eyebrow mb-2">Almost there</p>
      <h1 className="mb-8 font-display text-5xl uppercase tracking-wide text-chalk">Shopping Bag</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-line border border-line bg-pitch">
          {items.map((item) => (
            <div key={item.key} className="flex gap-5 p-5">
              <Link to={`/product/${item.slug}`} className="h-24 w-24 shrink-0 bg-gradient-to-br from-pitch2 to-night border border-line" />
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link to={`/product/${item.slug}`} className="font-head text-base font-semibold uppercase tracking-wide text-chalk hover:text-volt">{item.name}</Link>
                    <p className="mt-1 text-xs text-muted">
                      Size {item.size}
                      {item.customization && ` · Custom: ${item.customization.name} #${item.customization.number}`}
                    </p>
                  </div>
                  <button onClick={() => dispatch(removeFromCart(item.key))} aria-label="Remove item" className="text-muted transition-colors hover:text-ember">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center border border-line">
                    <button onClick={() => dispatch(setQty({ key: item.key, qty: item.qty - 1 }))} className="grid h-8 w-8 place-items-center text-muted hover:text-volt" aria-label="Decrease"><Minus size={14} /></button>
                    <span className="w-9 text-center text-sm">{item.qty}</span>
                    <button onClick={() => dispatch(setQty({ key: item.key, qty: item.qty + 1 }))} className="grid h-8 w-8 place-items-center text-muted hover:text-volt" aria-label="Increase"><Plus size={14} /></button>
                  </div>
                  <p className="font-head text-lg font-semibold text-chalk">{fmt(item.price * item.qty)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit border border-line bg-pitch p-6 lg:sticky lg:top-32">
          <p className="font-head text-sm font-semibold uppercase tracking-[0.2em] text-chalk">Order Summary</p>

          <div className="mt-5">
            <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted"><Tag size={13} /> Coupon code</p>
            {applied ? (
              <div className="flex items-center justify-between border border-volt/40 bg-volt/10 px-3 py-2.5">
                <span className="font-head text-sm font-semibold uppercase tracking-widest text-volt">{applied.code} · −{applied.pct}%</span>
                <button onClick={() => setApplied(null)} aria-label="Remove coupon" className="text-muted hover:text-ember"><X size={14} /></button>
              </div>
            ) : (
              <div className="flex">
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GEARUP10" className="input-fm !border-r-0 uppercase" />
                <button onClick={applyCoupon} className="btn-volt !px-4">Apply</button>
              </div>
            )}
          </div>

          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="text-chalk">{fmt(total)}</dd></div>
            {discount > 0 && <div className="flex justify-between"><dt className="text-muted">Coupon discount</dt><dd className="text-volt">−{fmt(discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-chalk">{shipping === 0 ? <span className="text-volt">FREE</span> : fmt(shipping)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-head font-semibold uppercase tracking-widest text-chalk">Total</dt>
              <dd className="font-head text-xl font-semibold text-volt">{fmt(grand)}</dd>
            </div>
          </dl>

          <Link to="/checkout" state={{ discount, shipping, grand }} className="btn-volt mt-6 w-full justify-center">Proceed to Checkout</Link>
          <Link to="/shop" className="mt-3 block text-center text-xs uppercase tracking-widest text-muted hover:text-volt">Continue shopping</Link>
        </aside>
      </div>
    </div>
  )
}