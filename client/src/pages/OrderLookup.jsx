import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Package, ChevronRight } from 'lucide-react'
import { fmt } from '../lib/format'
import api from '../lib/api'

const ORDER_STAGES = ['processing', 'confirmed', 'shipped', 'delivered']

export default function OrderLookup() {
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLookup = async (e) => {
    e.preventDefault()
    setError('')
    setOrder(null)
    setLoading(true)
    try {
      const { data } = await api.post('/orders/guest-lookup', { orderId: orderId.trim(), email: email.trim() })
      setOrder(data.order)
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found')
    } finally {
      setLoading(false)
    }
  }

  const stage = order ? ORDER_STAGES.indexOf(order.orderStatus) : -1

  return (
    <div className="container-fm py-10">
      <p className="eyebrow mb-2">Track order</p>
      <h1 className="font-display text-5xl uppercase tracking-wide text-chalk">Order Lookup</h1>
      <p className="mt-2 text-muted text-sm">Enter your Order ID and email to check your order status.</p>

      <form onSubmit={handleLookup} className="mt-8 max-w-lg border border-line bg-pitch p-6 space-y-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Order ID</label>
          <input
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            placeholder="FM-XXXXXXXX-XXXXXX"
            required
            className="input-fm font-head uppercase tracking-widest"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="input-fm"
          />
        </div>
        {error && <p className="text-xs text-ember">{error}</p>}
        <button type="submit" disabled={loading} className="btn-volt w-full !text-xs">
          <Search size={14} /> {loading ? 'Looking up...' : 'Find Order'}
        </button>
      </form>

      {order && (
        <div className="mt-8 max-w-lg space-y-6">
          <div className="border border-line bg-pitch p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-head text-lg font-semibold uppercase tracking-wide text-chalk">#{order.orderId}</p>
                <p className="text-xs text-muted">Placed {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-muted">Total</p>
                <p className="font-head text-xl font-semibold text-volt">{fmt(order.total)}</p>
              </div>
            </div>

            <div className="flex items-center mb-4">
              {ORDER_STAGES.map((s, i) => (
                <div key={s} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className={`grid h-8 w-8 place-items-center rounded-full border-2 text-xs ${
                      i < stage ? 'border-volt bg-volt text-night' : i === stage ? 'border-volt text-volt' : 'border-line text-muted'
                    }`}>
                      {i < stage ? '✓' : i + 1}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-widest ${i <= stage ? 'text-volt' : 'text-muted'}`}>{s}</span>
                  </div>
                  {i < ORDER_STAGES.length - 1 && <span className={`mx-1 h-0.5 flex-1 ${i < stage ? 'bg-volt' : 'bg-line'}`} />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm border-t border-line pt-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted mb-1">Payment</p>
                <p className="text-chalk capitalize">{order.paymentType} Payment</p>
                <p className="text-muted">Method: {order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted mb-1">Status</p>
                <p className="text-chalk capitalize">{order.orderStatus?.replace('_', ' ')}</p>
                {order.paymentStatus === 'partial' && <p className="text-ember text-xs">Remaining: {fmt(order.remainingAmount)}</p>}
              </div>
            </div>
          </div>

          <div className="border border-line bg-pitch p-6">
            <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk mb-3">Items</p>
            <div className="divide-y divide-line">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <span className="text-chalk">{item.name}</span>
                    {item.size && <span className="text-muted ml-2">({item.size})</span>}
                    <span className="text-muted ml-2">× {item.qty}</span>
                    {item.customization?.name && <span className="text-volt ml-2">#{item.customization.name} {item.customization.number}</span>}
                  </div>
                  <span className="text-chalk font-head">{fmt(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          {order.shippingAddress && (
            <div className="border border-line bg-pitch p-6">
              <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk mb-2">Shipping Address</p>
              <p className="text-sm text-muted leading-relaxed">
                {order.shippingAddress.name && <><strong className="text-chalk">{order.shippingAddress.name}</strong><br /></>}
                {order.shippingAddress.street && <>{order.shippingAddress.street}<br /></>}
                {order.shippingAddress.city && <>{order.shippingAddress.city}{order.shippingAddress.district ? `, ${order.shippingAddress.district}` : ''} {order.shippingAddress.zip}</>}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link to="/shop" className="btn-ghost !text-xs">Back to Shop</Link>
      </div>
    </div>
  )
}
