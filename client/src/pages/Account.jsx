import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useState } from 'react'
import { User, Package, MapPin, Heart, LogOut, Check, Truck, Home } from 'lucide-react'
import { fmt } from '../lib/format'

const TABS = [
  { id: 'profile', label: 'Profile', icon: <User size={16} /> },
  { id: 'orders', label: 'Orders', icon: <Package size={16} /> },
  { id: 'addresses', label: 'Addresses', icon: <MapPin size={16} /> },
  { id: 'wishlist', label: 'Wishlist', icon: <Heart size={16} /> },
]

const ORDER_STAGES = ['Processing', 'Confirmed', 'Shipped', 'Delivered']

const MOCK_ORDERS = [
  { id: 'FM-2026-1042', date: '2026-08-24', total: 4497, items: '2× Omega FC Home Kit', stage: 2 },
  { id: 'FM-2026-0977', date: '2026-08-12', total: 7499, items: '1× StrikerX Velocity FG', stage: 3 },
  { id: 'FM-2026-0855', date: '2026-07-30', total: 2199, items: '1× Midnight SC Third Kit', stage: 3 },
]

export default function Account() {
  const { tab = 'profile' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const wishCount = useSelector((s) => s.wishlist.length)
  const [loggedOut, setLoggedOut] = useState(false)

  if (loggedOut) {
    return (
      <div className="container-fm grid place-items-center py-24 text-center">
        <p className="font-display text-5xl uppercase tracking-wide text-chalk">Subbed off.</p>
        <Link to="/login" className="btn-volt mt-6 !text-xs">Log back in</Link>
      </div>
    )
  }

  const activeTab = tab || 'profile'

  return (
    <div className="container-fm py-10">
      <p className="eyebrow mb-2">Squad member</p>
      <h1 className="font-display text-5xl uppercase tracking-wide text-chalk">My Account</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit border border-line bg-pitch lg:sticky lg:top-32">
          <nav className="flex overflow-x-auto lg:flex-col">
            {TABS.map((t) => {
              const to = t.id === 'wishlist' ? '/account/wishlist' : `/account/${t.id}`
              const active = t.id === 'wishlist' ? location.pathname === '/account/wishlist' : activeTab === t.id && location.pathname !== '/account/wishlist'
              return (
                <Link key={t.id} to={to} className={`flex shrink-0 items-center gap-3 border-b border-line px-5 py-4 font-head text-sm font-semibold uppercase tracking-widest transition-colors lg:border-b ${active ? 'bg-volt/10 text-volt' : 'text-muted hover:text-chalk'}`}>
                  {t.icon}{t.label}
                  {t.id === 'wishlist' && wishCount > 0 && <span className="ml-auto bg-ember px-1.5 text-[10px] font-bold text-white">{wishCount}</span>}
                </Link>
              )
            })}
            <button onClick={() => setLoggedOut(true)} className="flex items-center gap-3 px-5 py-4 font-head text-sm font-semibold uppercase tracking-widest text-muted transition-colors hover:text-ember">
              <LogOut size={16} /> Log out
            </button>
          </nav>
        </aside>

        <div>
          {activeTab === 'profile' && location.pathname !== '/account/wishlist' && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="border border-line bg-pitch p-6">
                <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">Personal Info</p>
                <div className="mt-4 space-y-4">
                  <div><label className="mb-1 block text-xs uppercase tracking-widest text-muted">Name</label><input defaultValue="Aronno" className="input-fm" /></div>
                  <div><label className="mb-1 block text-xs uppercase tracking-widest text-muted">Email</label><input defaultValue="aronno@fleetmart.com" className="input-fm" /></div>
                  <div><label className="mb-1 block text-xs uppercase tracking-widest text-muted">Phone</label><input defaultValue="01700-000000" className="input-fm" /></div>
                  <button className="btn-volt !py-2.5 !text-xs">Save Changes</button>
                </div>
              </div>
              <div className="space-y-6">
                <div className="border border-line bg-pitch p-6">
                  <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">Fleetmart Stats</p>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    {[['12', 'Orders'], ['৳8.4k', 'Spent'], ['Gold', 'Tier']].map(([v, l]) => (
                      <div key={l} className="border border-line bg-night p-3">
                        <p className="font-display text-2xl text-volt">{v}</p>
                        <p className="text-[10px] uppercase tracking-widest text-muted">{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border border-volt/30 bg-volt/5 p-6">
                  <p className="font-head text-sm font-semibold uppercase tracking-widest text-volt">⚡ Next reward</p>
                  <p className="mt-2 text-sm text-muted">Spend ৳1,600 more to unlock <span className="text-chalk">free printing</span> on your next custom jersey.</p>
                  <div className="mt-3 h-1.5 bg-line"><div className="h-full w-2/3 bg-volt" /></div>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'orders') && location.pathname !== '/account/wishlist' && (
            <div className="space-y-4">
              {MOCK_ORDERS.map((o) => (
                <div key={o.id} className="border border-line bg-pitch p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-head text-lg font-semibold uppercase tracking-wide text-chalk">#{o.id}</p>
                      <p className="text-xs text-muted">Placed {o.date} · {o.items}</p>
                    </div>
                    <p className="font-head text-xl font-semibold text-volt">{fmt(o.total)}</p>
                  </div>
                  {/* timeline */}
                  <div className="mt-6 flex items-center">
                    {ORDER_STAGES.map((s, i) => (
                      <div key={s} className={`flex flex-1 items-center ${i === ORDER_STAGES.length - 1 ? '' : ''}`}>
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`grid h-8 w-8 place-items-center rounded-full border-2 ${i < o.stage ? 'border-volt bg-volt text-night' : i === o.stage ? 'border-volt text-volt' : 'border-line text-muted'}`}>
                            {i < o.stage ? <Check size={14} /> : i === o.stage ? <Truck size={14} /> : <Home size={12} />}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase tracking-widest ${i <= o.stage ? 'text-volt' : 'text-muted'}`}>{s}</span>
                        </div>
                        {i < ORDER_STAGES.length - 1 && <span className={`mx-1 h-0.5 flex-1 ${i < o.stage ? 'bg-volt' : 'bg-line'}`} />}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button className="btn-ghost !px-4 !py-2 !text-[11px]">Invoice</button>
                    {o.stage < 3 && <button className="btn-ghost !px-4 !py-2 !text-[11px]">Cancel</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-volt/40 bg-pitch p-6">
                <p className="flex items-center justify-between font-head text-sm font-semibold uppercase tracking-widest text-chalk">Home <span className="bg-volt px-2 py-0.5 text-[10px] text-night">Default</span></p>
                <p className="mt-3 text-sm leading-relaxed text-muted">House 12, Road 5, Dhanmondi<br />Dhaka 1205 · 01700-000000</p>
              </div>
              <button className="grid min-h-40 place-items-center border border-dashed border-line text-sm text-muted transition-colors hover:border-volt hover:text-volt">
                + Add new address
              </button>
            </div>
          )}

          {(activeTab === 'wishlist' || location.pathname === '/account/wishlist') && <WishlistInline />}
        </div>
      </div>
    </div>
  )
}

function WishlistInline() {
  const navigate = useNavigate()
  return (
    <div className="border border-line bg-pitch p-8 text-center">
      <p className="font-display text-4xl uppercase tracking-wide text-muted">Wishlist moved to its own page</p>
      <button onClick={() => navigate('/account/wishlist')} className="btn-volt mt-5 !text-xs">Open Wishlist</button>
    </div>
  )
}