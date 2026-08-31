import { useEffect, useState } from 'react'
import { Package, ShoppingCart, Users, DollarSign, Tag, Star } from 'lucide-react'
import api from '../../lib/api'

const fmt = (n) => `৳${Number(n).toLocaleString()}`

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard').then(res => {
      setData(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-muted">Loading dashboard...</div>
  if (!data) return <div className="text-ember">Failed to load dashboard</div>

  const { stats, recentOrders, lowStock, ordersByStatus } = data

  const cards = [
    { label: 'Revenue', value: fmt(stats.totalRevenue), icon: DollarSign, color: 'text-volt' },
    { label: 'Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-azure' },
    { label: 'Products', value: stats.totalProducts, icon: Package, color: 'text-gold' },
    { label: 'Users', value: stats.totalUsers, icon: Users, color: 'text-chalk' },
    { label: 'Reviews', value: stats.totalReviews, icon: Star, color: 'text-volt' },
    { label: 'Coupons', value: stats.totalCoupons, icon: Tag, color: 'text-ember' },
  ]

  const statusColors = {
    processing: 'bg-gold/20 text-gold',
    confirmed: 'bg-azure/20 text-azure',
    shipped: 'bg-volt/20 text-volt',
    out_for_delivery: 'bg-volt/20 text-volt',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-ember/20 text-ember',
    returned: 'bg-ember/20 text-ember',
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display tracking-wider text-chalk">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-pitch border border-line p-4">
            <Icon size={20} className={`${color} mb-2`} />
            <div className="text-xl font-display text-chalk">{value}</div>
            <div className="text-xs font-head text-muted uppercase tracking-widest">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-pitch border border-line p-6">
          <h2 className="text-lg font-display tracking-wider text-chalk mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {recentOrders.map(order => (
              <div key={order._id} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                <div>
                  <div className="text-sm font-head text-chalk">{order.orderId}</div>
                  <div className="text-xs text-muted">{order.user?.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-head text-chalk">{fmt(order.total)}</div>
                  <span className={`text-[10px] font-head uppercase px-2 py-0.5 rounded ${statusColors[order.orderStatus] || 'bg-muted/20 text-muted'}`}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && <div className="text-sm text-muted">No orders yet</div>}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-pitch border border-line p-6">
          <h2 className="text-lg font-display tracking-wider text-chalk mb-4">Low Stock Alert</h2>
          <div className="space-y-3">
            {lowStock.map(p => (
              <div key={p._id} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                <div>
                  <div className="text-sm font-head text-chalk">{p.name}</div>
                  <div className="text-xs text-muted">{p.category} · {p.brand}</div>
                </div>
                <div className="text-right">
                  {p.lowSizes.length > 0 ? (
                    p.lowSizes.map(s => (
                      <span key={s.size} className="text-[10px] font-head bg-ember/20 text-ember px-1.5 py-0.5 rounded ml-1">
                        {s.size}: {s.qty}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gold">Total: {p.totalStock}</span>
                  )}
                </div>
              </div>
            ))}
            {lowStock.length === 0 && <div className="text-sm text-muted">All products well-stocked</div>}
          </div>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="bg-pitch border border-line p-6">
        <h2 className="text-lg font-display tracking-wider text-chalk mb-4">Orders by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ordersByStatus.map(({ _id, count }) => (
            <div key={_id} className="bg-pitch2 border border-line p-3 text-center">
              <div className="text-lg font-display text-chalk">{count}</div>
              <span className={`text-[10px] font-head uppercase px-2 py-0.5 rounded ${statusColors[_id] || 'bg-muted/20 text-muted'}`}>
                {_id}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
