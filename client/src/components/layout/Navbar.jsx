import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Search, ShoppingBag, Heart, Menu, X, User, Zap } from 'lucide-react'
import { CATEGORIES, PRODUCTS } from '../../data/products'
import { cartCount } from '../../features/cartSlice'
import { setCartOpen, setSearchOpen, setMobileNavOpen } from '../../features/uiSlice'
import Ticker from './Ticker'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Fleetmart home">
      <span className="grid h-8 w-8 place-items-center bg-volt">
        <Zap size={18} className="fill-night text-night" />
      </span>
      <span className="font-display text-3xl tracking-wider text-chalk">
        FLEET<span className="text-volt">MART</span>
      </span>
    </Link>
  )
}

const NAV = [
  { to: '/shop', label: 'Catalog', mega: true },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  const dispatch = useDispatch()
  const count = useSelector(cartCount)
  const wishCount = useSelector((s) => s.wishlist.length)
  const mobileOpen = useSelector((s) => s.ui.mobileNavOpen)
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    dispatch(setMobileNavOpen(false))
    setMegaOpen(false)
  }, [location.pathname, location.search, dispatch])

  const linkCls = ({ isActive }) =>
    `font-head text-sm font-medium uppercase tracking-[0.18em] transition-colors ${
      isActive ? 'text-volt' : 'text-chalk/85 hover:text-volt'
    }`

  return (
    <header className="sticky top-0 z-50">
      <Ticker />
      <div className={`relative border-b border-line bg-night/90 backdrop-blur transition-shadow ${scrolled ? 'shadow-card' : ''}`} onMouseLeave={() => setMegaOpen(false)}>
        <div className="container-fm flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button className="text-chalk lg:hidden" onClick={() => dispatch(setMobileNavOpen(!mobileOpen))} aria-label="Menu">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Logo />
          </div>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <div key={item.label} onMouseEnter={() => setMegaOpen(!!item.mega)}>
                <NavLink to={item.to} className={linkCls}>{item.label}</NavLink>
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button onClick={() => dispatch(setSearchOpen(true))} aria-label="Search" className="grid h-10 w-10 place-items-center text-chalk/85 transition-colors hover:text-volt">
              <Search size={20} />
            </button>
            <Link to="/account/wishlist" aria-label="Wishlist" className="relative hidden h-10 w-10 place-items-center text-chalk/85 transition-colors hover:text-volt sm:grid">
              <Heart size={20} />
              {wishCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center bg-ember px-1 text-[10px] font-bold text-white">{wishCount}</span>
              )}
            </Link>
            <Link to="/login" aria-label="Account" className="hidden h-10 w-10 place-items-center text-chalk/85 transition-colors hover:text-volt sm:grid">
              <User size={20} />
            </Link>
            <button onClick={() => dispatch(setCartOpen(true))} aria-label="Cart" className="relative grid h-10 w-10 place-items-center text-chalk/85 transition-colors hover:text-volt">
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center bg-volt px-1 text-[10px] font-bold text-night">{count}</span>
              )}
            </button>
          </div>
        </div>

        {/* Catalog mega menu */}
        <div
          className={`absolute inset-x-0 top-full hidden overflow-hidden border-b border-line bg-night/95 backdrop-blur transition-all duration-200 lg:block ${
            megaOpen ? 'max-h-[560px] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
          }`}
        >
          <div className="container-fm py-8">
            <div className="mb-5 flex items-center justify-between">
              <p className="eyebrow">Browse the full collection</p>
              <Link to="/shop" className="font-head text-xs font-semibold uppercase tracking-widest text-volt hover:underline">Open Catalog →</Link>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {CATEGORIES.map((c) => {
                const count = PRODUCTS.filter((p) => p.category === c.id).length
                return (
                  <Link key={c.id} to={`/shop?category=${c.id}`} className="group flex items-center justify-between border border-line bg-pitch px-5 py-4 transition-colors hover:border-volt/50 hover:bg-pitch2">
                    <div>
                      <p className="font-display text-2xl uppercase tracking-wide text-chalk group-hover:text-volt">{c.name}</p>
                      <p className="text-[11px] uppercase tracking-widest text-muted">{c.blurb}</p>
                    </div>
                    <span className="flex items-center gap-2 font-head text-xs uppercase tracking-widest text-muted group-hover:text-volt">
                      {count} items <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </Link>
                )
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border border-volt/30 bg-gradient-to-r from-pitch to-pitch2 px-6 py-4">
              <div>
                <p className="font-display text-2xl uppercase tracking-wide text-volt">Kit Builder</p>
                <p className="text-xs uppercase tracking-widest text-muted">Print your name & number on any jersey — live preview</p>
              </div>
              <Link to="/shop?category=jersey&customizable=1" className="btn-volt !py-2 !text-xs">Customize Now</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 top-[97px] z-40 bg-night/95 backdrop-blur transition-transform duration-250 lg:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <nav className="container-fm flex flex-col gap-1 py-6">
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/shop?category=${c.id}`} className="flex items-center justify-between border-b border-line py-4 font-display text-2xl uppercase tracking-wide text-chalk">
              {c.name} <span className="text-volt">→</span>
            </Link>
          ))}
          <div className="mt-4 flex gap-3">
            <Link to="/login" className="btn-ghost flex-1 justify-center !py-2.5 !text-xs">Login</Link>
            <Link to="/account/wishlist" className="btn-ghost flex-1 justify-center !py-2.5 !text-xs">Wishlist ({wishCount})</Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
