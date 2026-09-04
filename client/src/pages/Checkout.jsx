import { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Check, ChevronRight, CreditCard, Truck, Wallet, ShoppingCart, Clock } from 'lucide-react'
import { cartTotal, clearCart } from '../features/cartSlice'
import { toast } from '../features/uiSlice'
import { fmt } from '../lib/format'
import api from '../lib/api'

const STEPS = ['Address', 'Shipping', 'Payment', 'Review']
const PARTIAL_PAYMENT_AMOUNT = 300

export default function Checkout() {
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const items = useSelector((s) => s.cart)
  const total = useSelector(cartTotal)
  const passed = location.state || {}
  const discount = passed.discount ?? 0
  const shipping = passed.shipping ?? (total >= 3000 ? 0 : 80)
  const grand = passed.grand ?? total + shipping

  const [step, setStep] = useState(0)
  const [method, setMethod] = useState('uddoktapay')
  const [paymentType, setPaymentType] = useState('full')
  const [ship, setShip] = useState('standard')
  const [done, setDone] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [addr, setAddr] = useState({ name: '', phone: '', email: '', street: '', city: 'Dhaka', zip: '' })
  const [timer, setTimer] = useState(null)

  const { token, user } = useSelector((s) => s.auth)

  const paymentStatus = searchParams.get('payment')
  const paymentAttempt = searchParams.get('attemptId')

  useEffect(() => {
    if (paymentStatus === 'error' || paymentStatus === 'failed') {
      dispatch(toast({ type: 'error', message: 'Payment failed. Please try again.' }))
    } else if (paymentStatus === 'cancelled') {
      dispatch(toast({ type: 'info', message: 'Payment was cancelled.' }))
    } else if (paymentStatus === 'expired') {
      dispatch(toast({ type: 'error', message: 'Payment session expired. Please try again.' }))
    }
  }, [paymentStatus, dispatch])

  useEffect(() => {
    if (token && user) {
      setAddr(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
      }))
    }
  }, [token, user])

  const shipFee = ship === 'express' ? 150 : shipping
  const finalTotal = grand - shipping + shipFee
  const amountToPay = paymentType === 'partial' ? PARTIAL_PAYMENT_AMOUNT : finalTotal

  const canNext = () => {
    if (step === 0) {
      return addr.name && addr.phone && addr.street && (token || addr.email)
    }
    return true
  }

  const placeOrder = async () => {
    setPlacing(true)
    try {
      const { data } = await api.post('/payment/initiate', {
        items: items.map((i) => ({
          product: i.id,
          name: i.name,
          size: i.size,
          qty: i.qty,
          price: i.price,
          artColors: i.artColors,
        })),
        shipping: {
          name: addr.name,
          phone: addr.phone,
          street: addr.street,
          city: addr.city,
          zip: addr.zip,
          country: 'Bangladesh',
        },
        paymentType,
        shippingMethod: ship,
        couponCode: passed.couponCode || '',
        totals: { subtotal: total, discount, shipping: shipFee, grand: finalTotal },
        note: '',
        guestInfo: !token ? { name: addr.name, email: addr.email, phone: addr.phone } : undefined,
      })

      if (data.gatewayUrl) {
        window.location.href = data.gatewayUrl
      } else if (data.attemptId) {
        dispatch(toast({ type: 'info', message: data.message || 'Payment gateway unavailable. Try again.' }))
      } else {
        dispatch(toast({ type: 'error', message: 'Failed to initiate payment' }))
      }
    } catch (err) {
      dispatch(toast({ type: 'error', message: err.response?.data?.message || 'Failed to place order' }))
    } finally {
      setPlacing(false)
    }
  }

  if (done) {
    return (
      <div className="container-fm grid place-items-center py-24 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid h-20 w-20 place-items-center border-2 border-volt"><Check size={40} className="text-volt" /></span>
          <h1 className="mt-6 font-display text-6xl uppercase tracking-wide text-chalk">Order Placed!</h1>
          <p className="mt-3 text-muted">Order <span className="font-semibold text-volt">#{orderId || 'FM-PENDING'}</span> is confirmed. A tracking link is on its way to your inbox.</p>
          {paymentType === 'partial' && (
            <div className="mt-4 border border-line bg-pitch p-4 text-sm">
              <p className="text-chalk">Amount paid: <span className="text-volt">{fmt(PARTIAL_PAYMENT_AMOUNT)}</span></p>
              <p className="text-muted">Remaining: {fmt(finalTotal - PARTIAL_PAYMENT_AMOUNT)} (to be paid on delivery)</p>
            </div>
          )}
          <div className="mt-8 flex justify-center gap-3">
            {token && <Link to="/account/orders" className="btn-volt !text-xs">Track Order</Link>}
            <Link to="/shop" className="btn-ghost !text-xs">Keep Shopping</Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0 && !done) {
    return (
      <div className="container-fm grid place-items-center py-32 text-center">
        <div>
          <p className="font-display text-5xl uppercase tracking-wide text-muted">Nothing to check out</p>
          <Link to="/shop" className="btn-volt mt-8 !text-xs">Back to Shop</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fm py-10">
      <p className="eyebrow mb-2">Secure checkout</p>
      <h1 className="mb-8 font-display text-5xl uppercase tracking-wide text-chalk">Checkout</h1>

      {!token && (
        <div className="mb-6 border border-volt/30 bg-volt/5 p-4 text-sm text-muted flex items-center justify-between">
          <span>Already have an account? <Link to="/login" state={{ from: '/checkout' }} className="text-volt font-semibold hover:underline">Log in</Link> for faster checkout and order tracking.</span>
        </div>
      )}

      {/* stepper */}
      <ol className="mb-10 flex items-center gap-2 overflow-x-auto">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 whitespace-nowrap font-head text-xs font-semibold uppercase tracking-widest ${i <= step ? 'text-volt' : 'text-muted'}`}
            >
              <span className={`grid h-7 w-7 place-items-center border text-xs ${i < step ? 'border-volt bg-volt text-night' : i === step ? 'border-volt text-volt' : 'border-line text-muted'}`}>
                {i < step ? <Check size={13} /> : i + 1}
              </span>
              {s}
            </button>
            {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < step ? 'bg-volt' : 'bg-line'}`} />}
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="border border-line bg-pitch p-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk sm:col-span-2">Delivery Address</p>
              <input placeholder="Full name" value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} className="input-fm" />
              <input placeholder="Phone (01XXXXXXXXX)" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} className="input-fm" />
              {!token && (
                <input type="email" placeholder="Email (for receipt)" value={addr.email} onChange={(e) => setAddr({ ...addr, email: e.target.value })} className="input-fm sm:col-span-2" />
              )}
              <input placeholder="Street / House / Road" value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} className="input-fm sm:col-span-2" />
              <select value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className="input-fm">
                {['Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Rajshahi', 'Barishal', 'Rangpur', 'Mymensingh'].map((c) => <option key={c}>{c}</option>)}
              </select>
              <input placeholder="Area / Post code" value={addr.zip} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} className="input-fm" />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">Delivery Speed</p>
              {[
                { id: 'standard', icon: <Truck size={18} />, title: 'Standard · 2–4 days', sub: 'Dhaka 24–48h inside city', fee: shipping },
                { id: 'express', icon: <Truck size={18} />, title: 'Express · Next day (Dhaka only)', fee: 150 },
              ].map((o) => (
                <button key={o.id} onClick={() => setShip(o.id)} className={`flex w-full items-center gap-4 border p-4 text-left transition-colors ${ship === o.id ? 'border-volt bg-volt/5' : 'border-line hover:border-volt/50'}`}>
                  <span className="text-volt">{o.icon}</span>
                  <span className="flex-1">
                    <span className="block font-head text-sm font-semibold uppercase tracking-wide text-chalk">{o.title}</span>
                    <span className="text-xs text-muted">Tracked to your door</span>
                  </span>
                  <span className="font-head font-semibold text-chalk">{o.fee === 0 ? <span className="text-volt">FREE</span> : fmt(o.fee)}</span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">Payment Type</p>
                {[
                  { id: 'partial', title: `Partial Payment — ${fmt(PARTIAL_PAYMENT_AMOUNT)}`, sub: `Pay ${fmt(PARTIAL_PAYMENT_AMOUNT)} now via bKash/Nagad, rest on delivery`, amount: PARTIAL_PAYMENT_AMOUNT },
                  { id: 'full', title: `Full Payment — ${fmt(finalTotal)}`, sub: 'Pay the full amount now via bKash/Nagad', amount: finalTotal },
                ].map((o) => (
                  <button key={o.id} onClick={() => setPaymentType(o.id)} className={`flex w-full items-center gap-4 border p-4 text-left transition-colors ${paymentType === o.id ? 'border-volt bg-volt/5' : 'border-line hover:border-volt/50'}`}>
                    <span className="text-volt">{o.id === 'partial' ? <Wallet size={18} /> : <CreditCard size={18} />}</span>
                    <span className="flex-1">
                      <span className="block font-head text-sm font-semibold uppercase tracking-wide text-chalk">{o.title}</span>
                      <span className="text-xs text-muted">{o.sub}</span>
                    </span>
                    <span className={`grid h-5 w-5 place-items-center rounded-full border ${paymentType === o.id ? 'border-volt bg-volt' : 'border-line'}`}>
                      {paymentType === o.id && <Check size={12} className="text-night" />}
                    </span>
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted">Payments are processed securely via UddoktaPay. bKash and Nagad are available at checkout.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">Review Order</p>
              <ul className="divide-y divide-line border border-line">
                {items.map((i) => (
                  <li key={i.key || i._id} className="flex items-center justify-between p-3 text-sm">
                    <span className="text-chalk">{i.qty}× {i.name} <span className="text-muted">({i.size})</span></span>
                    <span className="font-head text-chalk">{fmt(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="grid gap-2 text-sm text-muted sm:grid-cols-2">
                <p><span className="uppercase tracking-widest text-xs block text-muted">Ship to</span>{addr.name || '—'} · {addr.phone}<br />{addr.street}, {addr.city}</p>
                <p><span className="uppercase tracking-widest text-xs block text-muted">Method</span>{ship === 'express' ? 'Express delivery' : 'Standard delivery'}<br />Paying via UddoktaPay ({paymentType === 'partial' ? 'Partial' : 'Full'})</p>
              </div>
              {paymentType === 'partial' && (
                <div className="border border-volt/30 bg-volt/5 p-4 text-sm">
                  <p className="text-chalk">Now: <span className="text-volt font-semibold">{fmt(300)}</span></p>
                  <p className="text-muted">Remaining on delivery: {fmt(finalTotal - 300)}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="btn-ghost !py-2.5 !text-xs disabled:opacity-30">Back</button>
            {step < 3 ? (
              <button onClick={() => (canNext() ? setStep(step + 1) : dispatch(toast({ type: 'error', message: 'Fill the required fields' })))} className="btn-volt !py-2.5 !text-xs">
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button onClick={placeOrder} disabled={placing} className="btn-volt !py-2.5 !text-xs">
                {placing ? 'Processing…' : `Pay ${fmt(amountToPay)}`}
              </button>
            )}
          </div>
        </div>

        <aside className="h-fit border border-line bg-pitch p-6 lg:sticky lg:top-32">
          <p className="font-head text-sm font-semibold uppercase tracking-[0.2em] text-chalk">Order Summary</p>
          <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Items ({items.reduce((a, i) => a + i.qty, 0)})</dt><dd className="text-chalk">{fmt(total)}</dd></div>
            {discount > 0 && <div className="flex justify-between"><dt className="text-muted">Coupon</dt><dd className="text-volt">-{fmt(discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-chalk">{shipFee === 0 ? <span className="text-volt">FREE</span> : fmt(shipFee)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3">
              <dt className="font-head font-semibold uppercase tracking-widest text-chalk">Total</dt>
              <dd className="font-head text-xl font-semibold text-volt">{fmt(finalTotal)}</dd>
            </div>
            {paymentType === 'partial' && (
              <div className="flex justify-between border-t border-line pt-3">
                <dt className="font-head text-xs uppercase tracking-widest text-muted">Pay Now</dt>
                <dd className="font-head text-lg font-semibold text-volt">{fmt(PARTIAL_PAYMENT_AMOUNT)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-5 border border-line bg-night p-3 text-xs leading-relaxed text-muted">
            100% secure payment · 7-day returns · Authenticity guaranteed
          </div>
        </aside>
      </div>
    </div>
  )
}
