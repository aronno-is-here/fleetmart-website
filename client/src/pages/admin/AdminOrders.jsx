import { useEffect, useState } from 'react'
import api from '../../lib/api'

const fmt = (n) => `৳${Number(n).toLocaleString()}`

const STATUS = ['processing', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned']
const statusColors = {
  processing: 'bg-gold/20 text-gold',
  confirmed: 'bg-azure/20 text-azure',
  shipped: 'bg-volt/20 text-volt',
  out_for_delivery: 'bg-volt/20 text-volt',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-ember/20 text-ember',
  returned: 'bg-ember/20 text-ember',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [filter, setFilter] = useState('')
  const [updating, setUpdating] = useState(null)

  const load = (p = 1) => {
    setLoading(true)
    const params = { page: p, limit: 20 }
    if (filter) params.status = filter
    api.get('/orders', { params }).then(res => {
      setOrders(res.data.orders)
      setPages(res.data.pages)
      setPage(p)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    await api.put(`/orders/${id}/status`, { status })
    load(page)
    setUpdating(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display tracking-wider text-chalk">Orders</h1>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input-fm max-w-xs">
          <option value="">All Status</option>
          {STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="bg-pitch border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Order ID</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Customer</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Items</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Total</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Payment</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Status</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id} className="border-b border-line hover:bg-pitch2/50">
                <td className="px-4 py-3 font-head text-chalk">{o.orderId}</td>
                <td className="px-4 py-3">
                  <div className="text-chalk">{o.user?.name}</div>
                  <div className="text-xs text-muted">{o.user?.email}</div>
                </td>
                <td className="px-4 py-3 text-muted">{o.items?.length || 0}</td>
                <td className="px-4 py-3 text-chalk">{fmt(o.total)}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-head uppercase px-2 py-0.5 rounded ${o.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-gold/20 text-gold'}`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-head uppercase px-2 py-0.5 rounded ${statusColors[o.orderStatus] || ''}`}>
                    {o.orderStatus?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={o.orderStatus}
                    onChange={e => updateStatus(o._id, e.target.value)}
                    disabled={updating === o._id}
                    className="bg-pitch2 border border-line px-2 py-1 text-xs text-chalk"
                  >
                    {STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
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
    </div>
  )
}
