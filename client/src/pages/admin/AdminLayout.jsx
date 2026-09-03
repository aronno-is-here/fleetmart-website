import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag,
  LogOut, Menu, X, Star, Settings,
} from 'lucide-react'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('fm_user') || '{}')
  const token = localStorage.getItem('fm_token')

  const logout = () => {
    localStorage.removeItem('fm_token')
    localStorage.removeItem('fm_user')
    navigate('/admin/login')
  }

  useEffect(() => {
    if (location.pathname !== '/admin/login' && (!token || user.role !== 'admin')) {
      navigate('/admin/login')
    }
  }, [location.pathname, token, user.role, navigate])

  if (location.pathname === '/admin/login') return <Outlet />

  return (
    <div className="flex h-screen bg-night">
      {/* Sidebar */}
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-pitch border-r border-line transition-transform lg:translate-x-0 lg:static`}>
        <div className="flex items-center gap-2 px-6 py-5 border-b border-line">
          <span className="text-xl font-display tracking-wider text-volt">FLEET</span>
          <span className="text-xl font-display tracking-wider text-chalk">MART</span>
          <span className="ml-2 text-[10px] font-head uppercase tracking-widest text-muted bg-pitch2 px-2 py-0.5 rounded">Admin</span>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => {
            const active = end ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-head font-medium transition-colors ${active ? 'bg-volt/10 text-volt' : 'text-muted hover:text-chalk hover:bg-pitch2'}`}>
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-line">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 text-sm font-head text-muted hover:text-ember transition-colors w-full">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 bg-pitch border-b border-line lg:px-8">
          <button onClick={() => setOpen(!open)} className="lg:hidden text-muted hover:text-chalk">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex-1" />
          <div className="text-sm font-head text-muted">
            {user.name || 'Admin'}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
