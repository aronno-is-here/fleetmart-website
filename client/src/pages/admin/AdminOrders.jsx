import { useEffect, useState, useCallback } from 'react'
import { X, Eye, Search } from 'lucide-react'
import api from '../../lib/api'

const fmt = (n) => `৳${Number(n).toLocaleString()}`

const STATUS = ['processing', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned']
const PAYMENT_STATUS = ['pending', 'partial', 'paid', 'failed', 'cancelled', 'refund_requested', 'refund_failed', 'refunded']
const statusColors = {
  processing: 'bg-gold/20 text-gold',
  confirmed: 'bg-azure/20 text-azure',
  shipped: 'bg-volt/20 text-volt',
  out_for_delivery: 'bg-volt/20 text-volt',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-ember/20 text-ember',
  returned: 'bg-ember/20 text-ember',
}
const paymentStatusColors = {
  pending: 'bg-gold/20 text-gold',
  partial: 'bg-orange-500/20 text-orange-400',
  paid: 'bg-green-500/20 text-green-400',
  failed: 'bg-ember/20 text-ember',
  cancelled: 'bg-ember/20 text-ember',
  refund_requested: 'bg-orange-500/20 text-orange-400',
  refund_failed: 'bg-ember/20 text-ember',
  refunded: 'bg-green-500/20 text-green-400',
}

function OrderPreview({ order, onClose }) {
  if (!order) return null
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-pitch border border-line w-full max-w-2xl mx-4 mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-lg font-display tracking-wider text-chalk">Order #{order.orderId}</h2>
          <button onClick={onClose} className="text-muted hover:text-chalk"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-1">Customer</p>
              <p className="text-chalk">{order.user?.name || order.guestName || 'Guest'}</p>
              <p className="text-muted">{order.user?.email || order.guestEmail}</p>
              {order.shippingAddress?.phone && <p className="text-muted">{order.shippingAddress.phone}</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-1">Order Info</p>
              <p className="text-chalk">Placed: {new Date(order.createdAt).toLocaleString()}</p>
              {order.paymentVerifiedAt && <p className="text-muted">Paid: {new Date(order.paymentVerifiedAt).toLocaleString()}</p>}
              {order.transactionId && <p className="text-muted">Txn: {order.transactionId}</p>}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-2">Items</p>
            <div className="border border-line divide-y divide-line">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <span className="text-chalk">{item.name}</span>
                    {item.size && <span className="text-muted ml-2">({item.size})</span>}
                    <span className="text-muted ml-2">× {item.qty}</span>
                    {item.customization?.name && (
                      <span className="text-volt ml-2">#{item.customization.name} {item.customization.number}</span>
                    )}
                  </div>
                  <span className="text-chalk font-head">{fmt(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-2">Shipping Address</p>
              <div className="text-sm text-muted leading-relaxed">
                {order.shippingAddress?.name && <p className="text-chalk">{order.shippingAddress.name}</p>}
                {order.shippingAddress?.street && <p>{order.shippingAddress.street}</p>}
                {order.shippingAddress?.city && <p>{order.shippingAddress.city}{order.shippingAddress.district ? `, ${order.shippingAddress.district}` : ''} {order.shippingAddress.zip}</p>}
                {order.shippingAddress?.country && <p>{order.shippingAddress.country}</p>}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-2">Payment Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="text-chalk">{fmt(order.subtotal)}</span></div>
                {order.shippingFee > 0 && <div className="flex justify-between"><span className="text-muted">Shipping</span><span className="text-chalk">{fmt(order.shippingFee)}</span></div>}
                {order.discount > 0 && <div className="flex justify-between"><span className="text-muted">Discount</span><span className="text-volt">-{fmt(order.discount)}</span></div>}
                <div className="flex justify-between border-t border-line pt-1"><span className="text-chalk font-semibold">Total</span><span className="text-volt font-head font-semibold">{fmt(order.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Paid</span><span className="text-green-400 font-semibold">{fmt(order.amountPaid)}</span></div>
                {order.remainingAmount > 0 && <div className="flex justify-between"><span className="text-muted">Remaining</span><span className="text-ember font-semibold">{fmt(order.remainingAmount)}</span></div>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-1">Payment Status</p>
              <span className={`text-[10px] font-head uppercase px-2 py-0.5 ${paymentStatusColors[order.paymentStatus] || ''}`}>{order.paymentStatus}</span>
              {order.paymentGatewayMethod && <span className="text-muted ml-2">via {order.paymentGatewayMethod}</span>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-1">Order Status</p>
              <span className={`text-[10px] font-head uppercase px-2 py-0.5 ${statusColors[order.orderStatus] || ''}`}>{order.orderStatus?.replace('_', ' ')}</span>
            </div>
          </div>

          {order.statusHistory?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-2">Status History</p>
              <div className="space-y-1">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span className="text-muted shrink-0">{new Date(h.timestamp).toLocaleString()}</span>
                    <span className="text-chalk capitalize">{h.status?.replace('_', ' ')}</span>
                    {h.note && <span className="text-muted">— {h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.note && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-1">Order Note</p>
              <p className="text-sm text-muted">{order.note}</p>
            </div>
          )}

          {(order.refundAmount || order.refundTransactionId) && (
            <div className="border border-ember/30 bg-ember/5 p-4 text-sm">
              <p className="text-xs uppercase tracking-widest text-ember mb-1">Refund Info</p>
              {order.refundAmount && <p className="text-muted">Amount: {fmt(order.refundAmount)}</p>}
              {order.refundTransactionId && <p className="text-muted">Refund Txn: {order.refundTransactionId}</p>}
              {order.refundReason && <p className="text-muted">Reason: {order.refundReason}</p>}
              {order.refundedAt && <p className="text-muted">Refunded: {new Date(order.refundedAt).toLocaleString()}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [updating, setUpdating] = useState(null)
  const [preview, setPreview] = useState(null)

  const load = useCallback((p = 1) => {
    setLoading(true)
    const params = { page: p, limit: 20 }
    if (filter) params.status = filter
    if (search) params.search = search
    api.get('/orders', { params }).then(res => {
      setOrders(res.data.orders)
      setPages(res.data.pages)
      setPage(p)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [filter, search])

  useEffect(() => { load() }, [filter, search, load])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const updateStatus = async (id, status) => {
    setUpdating(id)
    await api.put(`/orders/${id}/status`, { status })
    load(page)
    setUpdating(null)
  }

  const updatePayment = async (id, paymentStatus) => {
    setUpdating(id)
    await api.put(`/orders/${id}/status`, { paymentStatus })
    load(page)
    setUpdating(null)
  }

  const openPreview = async (orderId) => {
    try {
      const { data } = await api.get(`/orders/${orderId}`)
      setPreview(data.order)
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-display tracking-wider text-chalk">Orders</h1>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex">
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search order ID, name, email..."
              className="input-fm !py-2 !text-xs w-56"
            />
            <button type="submit" className="bg-pitch2 border border-l-0 border-line px-3 text-muted hover:text-chalk">
              <Search size={14} />
            </button>
          </form>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="input-fm !py-2 !text-xs max-w-[160px]">
            <option value="">All Status</option>
            {STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-pitch border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Order ID</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Customer</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Items</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Total</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Payment Type</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Paid</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Remaining</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Payment</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Status</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id} className="border-b border-line hover:bg-pitch2/50">
                <td className="px-4 py-3">
                  <button onClick={() => openPreview(o.orderId)} className="font-head text-volt hover:underline cursor-pointer">{o.orderId}</button>
                </td>
                <td className="px-4 py-3">
                  <div className="text-chalk">{o.user?.name || o.guestName || 'Guest'}</div>
                  <div className="text-xs text-muted">{o.user?.email || o.guestEmail}</div>
                </td>
                <td className="px-4 py-3 text-muted">{o.items?.length || 0}</td>
                <td className="px-4 py-3 text-chalk">{fmt(o.total)}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-head uppercase px-2 py-0.5 ${o.paymentType === 'full' ? 'bg-azure/20 text-azure' : 'bg-orange-500/20 text-orange-400'}`}>
                    {o.paymentType === 'full' ? 'Full' : `Partial (${fmt(o.amountPaid || 0)})`}
                  </span>
                </td>
                <td className="px-4 py-3 text-volt font-semibold">{fmt(o.amountPaid || 0)}</td>
                <td className="px-4 py-3 text-muted">{fmt(o.remainingAmount || 0)}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.paymentStatus}
                    onChange={e => updatePayment(o._id, e.target.value)}
                    disabled={updating === o._id}
                    className={`bg-pitch2 border border-line px-2 py-1 text-xs text-chalk ${paymentStatusColors[o.paymentStatus] || ''}`}
                  >
                    {PAYMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-head uppercase px-2 py-0.5 ${statusColors[o.orderStatus] || ''}`}>
                    {o.orderStatus?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={o.orderStatus}
                      onChange={e => updateStatus(o._id, e.target.value)}
                      disabled={updating === o._id}
                      className="bg-pitch2 border border-line px-2 py-1 text-xs text-chalk"
                    >
                      {STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                    <button onClick={() => openPreview(o.orderId)} className="text-muted hover:text-volt" title="Preview">
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => load(p)} className={`px-3 py-1 text-sm font-head ${p === page ? 'bg-volt text-night' : 'bg-pitch2 text-muted hover:text-chalk'}`}>{p}</button>
          ))}
        </div>
      )}

      {preview && <OrderPreview order={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
