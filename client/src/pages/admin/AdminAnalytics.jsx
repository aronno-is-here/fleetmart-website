import { useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users,
  Package, BarChart3, Target, Percent, Download, RefreshCw,
} from 'lucide-react'
import api from '../../lib/api'

const fmt = (n) => `৳${Number(n).toLocaleString()}`
const pct = (n) => `${Number(n).toFixed(1)}%`

const RANGES = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: '1y', label: '1 Year' },
]

function MetricCard({ label, value, icon: Icon, color = 'text-volt', sub }) {
  return (
    <div className="bg-pitch border border-line p-4">
      <Icon size={20} className={`${color} mb-2`} />
      <div className="text-xl font-display text-chalk">{value}</div>
      <div className="text-[10px] font-head uppercase tracking-widest text-muted">{label}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  )
}

function BarChart({ data, labelKey, valueKey, maxValue, color = 'bg-volt' }) {
  const max = maxValue || Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-24 text-xs text-muted truncate" title={d[labelKey]}>{d[labelKey]}</div>
          <div className="flex-1 h-5 bg-pitch2 rounded overflow-hidden">
            <div className={`h-full ${color} rounded transition-all`} style={{ width: `${(d[valueKey] / max) * 100}%` }} />
          </div>
          <div className="w-16 text-right text-xs font-head text-chalk">{fmt(d[valueKey])}</div>
        </div>
      ))}
    </div>
  )
}

function MiniBarChart({ data, labelKey, valueKey }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative w-full bg-volt/80 rounded-t transition-all hover:bg-volt"
            style={{ height: `${(d[valueKey] / max) * 100}%`, minHeight: d[valueKey] > 0 ? 2 : 0 }} />
          <div className="text-[8px] text-muted group-hover:text-chalk transition-colors">
            {d[labelKey]?.slice(5) || ''}
          </div>
        </div>
      ))}
    </div>
  )
}

function DataTable({ columns, data, emptyText = 'No data' }) {
  if (!data.length) return <div className="text-sm text-muted py-4">{emptyText}</div>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((c, i) => (
              <th key={i} className={`py-2 px-3 text-[10px] font-head uppercase tracking-widest text-muted ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-line/50 hover:bg-pitch2/50 transition-colors">
              {columns.map((c, j) => (
                <td key={j} className={`py-2 px-3 ${c.align === 'right' ? 'text-right font-head' : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminAnalytics() {
  const [range, setRange] = useState('30d')
  const [tab, setTab] = useState('sales')
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState(null)
  const [products, setProducts] = useState(null)
  const [customers, setCustomers] = useState(null)
  const [forecasts, setForecasts] = useState(null)
  const [coupons, setCoupons] = useState(null)

  const fetchAll = () => {
    setLoading(true)
    const params = { range }
    Promise.all([
      api.get('/admin/analytics/sales', { params }),
      api.get('/admin/analytics/products', { params }),
      api.get('/admin/analytics/customers', { params }),
      api.get('/admin/analytics/forecasts'),
      api.get('/admin/analytics/coupons', { params }),
    ]).then(([s, p, c, f, cp]) => {
      setSales(s.data)
      setProducts(p.data)
      setCustomers(c.data)
      setForecasts(f.data)
      setCoupons(cp.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [range])

  const tabs = [
    { id: 'sales', label: 'Sales', icon: DollarSign },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'forecasts', label: 'Forecasts', icon: Target },
    { id: 'coupons', label: 'Coupons', icon: Percent },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display tracking-wider text-chalk">Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-pitch border border-line rounded overflow-hidden">
            {RANGES.map(r => (
              <button key={r.id} onClick={() => setRange(r.id)}
                className={`px-3 py-1.5 text-[10px] font-head uppercase tracking-widest transition-colors ${range === r.id ? 'bg-volt text-night' : 'text-muted hover:text-chalk'}`}>
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={fetchAll} className="p-2 text-muted hover:text-chalk transition-colors" title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-head uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-px ${tab === t.id ? 'border-volt text-volt' : 'border-transparent text-muted hover:text-chalk'}`}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {loading && !sales ? (
        <div className="text-muted py-12 text-center">Loading analytics...</div>
      ) : (
        <>
          {/* Sales Tab */}
          {tab === 'sales' && sales && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard label="Total Revenue" value={fmt(sales.summary.totalRevenue)} icon={DollarSign} />
                <MetricCard label="Total Orders" value={sales.summary.totalOrders} icon={ShoppingCart} color="text-azure" />
                <MetricCard label="Avg Order Value" value={fmt(Math.round(sales.summary.avgOrderValue))} icon={TrendingUp} color="text-gold" />
                <MetricCard label="Total Discounts" value={fmt(sales.summary.totalDiscount)} icon={Percent} color="text-ember" />
                <MetricCard label="Shipping Revenue" value={fmt(sales.summary.totalShipping)} icon={DollarSign} color="text-chalk" />
              </div>

              {/* Daily Trend */}
              <div className="bg-pitch border border-line p-6">
                <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-4">Daily Revenue Trend</h2>
                {sales.daily.length > 0 ? (
                  <MiniBarChart data={sales.daily} labelKey="_id" valueKey="revenue" />
                ) : (
                  <div className="text-sm text-muted py-4">No data for this period</div>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Payment Methods */}
                <div className="bg-pitch border border-line p-6">
                  <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-4">Revenue by Payment Method</h2>
                  <BarChart
                    data={sales.byPayment.map(p => ({ label: p._id || 'Unknown', value: p.revenue }))}
                    labelKey="label" valueKey="value"
                  />
                </div>

                {/* Status Breakdown */}
                <div className="bg-pitch border border-line p-6">
                  <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-4">Orders by Status</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {sales.byStatus.map(s => (
                      <div key={s._id} className="bg-pitch2 border border-line p-3 text-center">
                        <div className="text-lg font-display text-chalk">{s.count}</div>
                        <div className="text-[10px] font-head uppercase tracking-widest text-muted">{s._id}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {tab === 'products' && products && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Total Units in Stock" value={products.stockSummary.totalUnits.toLocaleString()} icon={Package} />
                <MetricCard label="Active Products" value={products.stockSummary.totalProducts} icon={Package} color="text-azure" />
                <MetricCard label="Out of Stock" value={products.stockSummary.outOfStock} icon={TrendingDown} color="text-ember" />
                <MetricCard label="Low Stock (<5)" value={products.stockSummary.lowStock} icon={TrendingDown} color="text-gold" />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-pitch border border-line p-6">
                  <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-4">Top Selling Products</h2>
                  <DataTable
                    columns={[
                      { label: 'Product', render: (r) => <span className="text-chalk">{r.name}</span> },
                      { label: 'Qty Sold', key: 'totalQty', align: 'right', render: (r) => <span className="text-chalk">{r.totalQty}</span> },
                      { label: 'Revenue', key: 'totalRevenue', align: 'right', render: (r) => <span className="text-volt">{fmt(r.totalRevenue)}</span> },
                    ]}
                    data={products.topSelling}
                  />
                </div>

                {/* Slow Movers */}
                <div className="bg-pitch border border-line p-6">
                  <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-4">Slow Moving Stock</h2>
                  <DataTable
                    columns={[
                      { label: 'Product', render: (r) => <span className="text-chalk">{r.name}</span> },
                      { label: 'Stock', key: 'totalStock', align: 'right', render: (r) => <span className="text-chalk">{r.totalStock}</span> },
                      { label: 'Price', key: 'price', align: 'right', render: (r) => <span className="text-muted">{fmt(r.price)}</span> },
                    ]}
                    data={products.slowMovers}
                    emptyText="All products have recent orders"
                  />
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Category Revenue */}
                <div className="bg-pitch border border-line p-6">
                  <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-4">Revenue by Category</h2>
                  <BarChart
                    data={products.categoryRevenue.map(c => ({ label: c._id, value: c.revenue }))}
                    labelKey="label" valueKey="value"
                  />
                </div>

                {/* Brand Revenue */}
                <div className="bg-pitch border border-line p-6">
                  <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-4">Revenue by Brand</h2>
                  <BarChart
                    data={products.brandRevenue.map(b => ({ label: b._id, value: b.revenue }))}
                    labelKey="label" valueKey="value" color="bg-azure"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {tab === 'customers' && customers && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Unique Customers" value={customers.summary.uniqueCustomers} icon={Users} />
                <MetricCard label="Guest Orders" value={customers.summary.totalGuestOrders} icon={Users} color="text-azure" />
                <MetricCard label="Registered Orders" value={customers.summary.totalRegisteredOrders} icon={Users} color="text-gold" />
                <MetricCard label="Repeat Purchase Rate" value={pct(customers.repeatRate.repeatRate)} icon={TrendingUp} color="text-volt" />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Customers */}
                <div className="bg-pitch border border-line p-6">
                  <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-4">Top Customers by Spend</h2>
                  <DataTable
                    columns={[
                      { label: 'Customer', render: (r) => <div><div className="text-chalk">{r.name}</div><div className="text-[10px] text-muted">{r.email}</div></div> },
                      { label: 'Orders', key: 'orderCount', align: 'right', render: (r) => <span className="text-chalk">{r.orderCount}</span> },
                      { label: 'Total Spent', key: 'totalSpent', align: 'right', render: (r) => <span className="text-volt">{fmt(r.totalSpent)}</span> },
                    ]}
                    data={customers.topCustomers}
                    emptyText="No registered customer orders yet"
                  />
                </div>

                {/* Repeat Rate */}
                <div className="bg-pitch border border-line p-6">
                  <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-4">Customer Retention</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Single Purchase</span>
                      <span className="text-sm font-head text-chalk">{customers.repeatRate.singlePurchase} customers</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Repeat Buyers (2+)</span>
                      <span className="text-sm font-head text-volt">{customers.repeatRate.repeatPurchase} customers</span>
                    </div>
                    <div className="w-full h-3 bg-pitch2 rounded overflow-hidden">
                      <div className="h-full bg-volt rounded" style={{ width: `${customers.repeatRate.repeatRate}%` }} />
                    </div>
                    <div className="text-center text-lg font-display text-volt">
                      {pct(customers.repeatRate.repeatRate)} Repeat Rate
                    </div>
                  </div>

                  {/* New Users Trend */}
                  {customers.newUsers.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-line">
                      <h3 className="text-xs font-head uppercase tracking-widest text-muted mb-3">New User Registrations</h3>
                      <MiniBarChart data={customers.newUsers} labelKey="_id" valueKey="newUsers" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Forecasts Tab */}
          {tab === 'forecasts' && forecasts && (
            <div className="space-y-6">
              {/* Demand Forecast */}
              <div className="bg-pitch border border-line p-6">
                <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-4">Demand Forecast</h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-pitch2 border border-line p-4 text-center">
                    <div className="text-lg font-display text-chalk">{forecasts.demand.avgDailyDemand}</div>
                    <div className="text-[10px] font-head uppercase tracking-widest text-muted">Avg Daily Units</div>
                  </div>
                  <div className="bg-pitch2 border border-line p-4 text-center">
                    <div className="text-lg font-display text-volt">{forecasts.demand.forecast7d}</div>
                    <div className="text-[10px] font-head uppercase tracking-widest text-muted">7-Day Forecast</div>
                  </div>
                  <div className="bg-pitch2 border border-line p-4 text-center">
                    <div className="text-lg font-display text-azure">{forecasts.demand.forecast30d}</div>
                    <div className="text-[10px] font-head uppercase tracking-widest text-muted">30-Day Forecast</div>
                  </div>
                </div>
                {forecasts.demand.trend.length > 0 && (
                  <MiniBarChart data={forecasts.demand.trend} labelKey="_id" valueKey="totalQty" />
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* EOQ */}
                <div className="bg-pitch border border-line p-6">
                  <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-2">Economic Order Quantity (EOQ)</h2>
                  <p className="text-xs text-muted mb-4">Optimal order quantities to minimize inventory costs</p>
                  <DataTable
                    columns={[
                      { label: 'Product', render: (r) => <span className="text-chalk">{r.name}</span> },
                      { label: 'Monthly Demand', align: 'right', render: (r) => <span className="text-chalk">{r.monthlyDemand}</span> },
                      { label: 'EOQ', align: 'right', render: (r) => <span className="text-volt font-bold">{r.eoq}</span> },
                      { label: 'Reorder Pt', align: 'right', render: (r) => <span className="text-gold">{r.reorderPoint}</span> },
                      { label: 'Stock', align: 'right', render: (r) => <span className={r.currentStock < r.reorderPoint ? 'text-ember' : 'text-chalk'}>{r.currentStock}</span> },
                    ]}
                    data={forecasts.eoq}
                  />
                </div>

                {/* Break-Even */}
                <div className="bg-pitch border border-line p-6">
                  <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-2">Break-Even Analysis</h2>
                  <p className="text-xs text-muted mb-4">Monthly cost structure and profitability</p>
                  <div className="space-y-3">
                    <div className="flex justify-between py-1 border-b border-line/50">
                      <span className="text-sm text-muted">Fixed Costs (monthly)</span>
                      <span className="text-sm font-head text-chalk">{fmt(forecasts.breakEven.fixedCosts)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-line/50">
                      <span className="text-sm text-muted">Variable Cost Ratio</span>
                      <span className="text-sm font-head text-chalk">{pct(forecasts.breakEven.variableCostRatio * 100)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-line/50">
                      <span className="text-sm text-muted">Avg Revenue / Order</span>
                      <span className="text-sm font-head text-chalk">{fmt(forecasts.breakEven.avgRevenuePerOrder)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-line/50">
                      <span className="text-sm text-muted">Contribution Margin</span>
                      <span className="text-sm font-head text-volt">{fmt(forecasts.breakEven.contributionMargin)}</span>
                    </div>
                    <div className="h-px bg-line my-2" />
                    <div className="flex justify-between py-1 border-b border-line/50">
                      <span className="text-sm text-muted">Break-Even Orders</span>
                      <span className="text-sm font-head text-gold">{forecasts.breakEven.breakEvenOrders}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-line/50">
                      <span className="text-sm text-muted">Break-Even Revenue</span>
                      <span className="text-sm font-head text-gold">{fmt(forecasts.breakEven.breakEvenRevenue)}</span>
                    </div>
                    <div className="h-px bg-line my-2" />
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-muted">Current Monthly Revenue</span>
                      <span className="text-sm font-head text-chalk">{fmt(forecasts.breakEven.currentMonthlyRevenue)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-sm font-semibold text-chalk">Status</span>
                      <span className={`text-sm font-head font-bold ${forecasts.breakEven.isProfitable ? 'text-volt' : 'text-ember'}`}>
                        {forecasts.breakEven.isProfitable ? 'PROFITABLE' : 'BELOW BREAK-EVEN'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coupons Tab */}
          {tab === 'coupons' && coupons && (
            <div className="space-y-6">
              <div className="bg-pitch border border-line p-6">
                <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-4">Coupon Performance</h2>
                <DataTable
                  columns={[
                    { label: 'Coupon', render: (r) => <span className="text-volt font-head">{r._id}</span> },
                    { label: 'Orders', align: 'right', render: (r) => <span className="text-chalk">{r.totalOrders}</span> },
                    { label: 'Total Discount', align: 'right', render: (r) => <span className="text-ember">{fmt(r.totalDiscount)}</span> },
                    { label: 'Revenue Generated', align: 'right', render: (r) => <span className="text-volt">{fmt(r.totalRevenue)}</span> },
                  ]}
                  data={coupons.couponUsage}
                  emptyText="No coupons used in this period"
                />
              </div>

              <div className="bg-pitch border border-line p-6">
                <h2 className="text-sm font-head uppercase tracking-widest text-chalk mb-4">All Coupons</h2>
                <DataTable
                  columns={[
                    { label: 'Code', render: (r) => <span className="text-volt font-head">{r.code}</span> },
                    { label: 'Type', render: (r) => <span className="text-chalk">{r.discountType === 'percent' ? `${r.value}%` : fmt(r.value)}</span> },
                    { label: 'Used', align: 'right', render: (r) => <span className="text-chalk">{r.usedCount}/{r.maxUses || '∞'}</span> },
                    { label: 'Status', render: (r) => (
                      <span className={`text-[10px] font-head uppercase px-2 py-0.5 rounded ${r.isActive ? 'bg-volt/20 text-volt' : 'bg-ember/20 text-ember'}`}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )},
                  ]}
                  data={coupons.topCoupons}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
