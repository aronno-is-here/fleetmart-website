import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Facebook, Instagram, Youtube, Twitter, ShieldCheck, Truck, RefreshCcw, BadgeCheck } from 'lucide-react'
import { CATEGORIES } from '../../data/products'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  return (
    <footer className="border-t border-line bg-pitch">
      {/* Trust strip */}
      <div className="border-b border-line">
        <div className="container-fm grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            { icon: <Truck size={22} className="text-volt" />, title: 'Fast Delivery', sub: 'Dhaka 24h · Countrywide 72h' },
            { icon: <ShieldCheck size={22} className="text-volt" />, title: 'Secure Payment', sub: 'bKash · Nagad · Card · COD' },
            { icon: <RefreshCcw size={22} className="text-volt" />, title: '7-Day Returns', sub: 'No questions asked' },
            { icon: <BadgeCheck size={22} className="text-volt" />, title: '100% Authentic', sub: 'Official quality kits' },
          ].map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              {t.icon}
              <div>
                <p className="font-head text-sm font-semibold uppercase tracking-wider text-chalk">{t.title}</p>
                <p className="text-xs text-muted">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-fm grid gap-10 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center bg-volt">
              <Zap size={18} className="fill-night text-night" />
            </span>
            <span className="font-display text-3xl tracking-wider text-chalk">FLEET<span className="text-volt">MART</span></span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Bangladesh's home ground for football gear. Premium jerseys, boots and equipment — with custom name & number printing that hits different.
          </p>
          <div className="mt-6">
            <p className="eyebrow mb-3">Join the squad</p>
            {done ? (
              <p className="font-head text-sm uppercase tracking-widest text-volt">You're in. Watch your inbox. ⚡</p>
            ) : (
              <form
                className="flex max-w-sm"
                onSubmit={(e) => {
                  e.preventDefault()
                  setDone(true)
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-fm !border-r-0"
                />
                <button className="btn-volt !px-4">Join</button>
              </form>
            )}
          </div>
        </div>

        <div>
          <p className="font-head text-sm font-semibold uppercase tracking-[0.2em] text-chalk">Shop</p>
          <ul className="mt-4 space-y-2.5">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link to={`/shop?category=${c.id}`} className="text-sm text-muted transition-colors hover:text-volt">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-head text-sm font-semibold uppercase tracking-[0.2em] text-chalk">Support</p>
          <ul className="mt-4 space-y-2.5">
            {[
              ['Track Order', '/account/orders'],
              ['Shipping Info', '/policies/shipping'],
              ['Returns & Refunds', '/policies/returns'],
              ['FAQ', '/faq'],
              ['Contact Us', '/contact'],
            ].map(([label, to]) => (
              <li key={label}>
                <Link to={to} className="text-sm text-muted transition-colors hover:text-volt">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-head text-sm font-semibold uppercase tracking-[0.2em] text-chalk">Company</p>
          <ul className="mt-4 space-y-2.5">
            {[
              ['About Us', '/about'],
              ['Turf Installation', '/shop?category=turf'],
              ['Terms of Service', '/policies/terms'],
              ['Privacy Policy', '/policies/privacy'],
            ].map(([label, to]) => (
              <li key={label}>
                <Link to={to} className="text-sm text-muted transition-colors hover:text-volt">{label}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-3">
            {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
              <a key={i} href="#" aria-label="Social link" className="grid h-9 w-9 place-items-center border border-line text-muted transition-colors hover:border-volt hover:text-volt">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-fm flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-muted">© {new Date().getFullYear()} Fleetmart. Gear Up. Game On.</p>
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted">
            <span className="border border-line px-2 py-1">bKash</span>
            <span className="border border-line px-2 py-1">Nagad</span>
            <span className="border border-line px-2 py-1">Visa</span>
            <span className="border border-line px-2 py-1">Mastercard</span>
            <span className="border border-line px-2 py-1">COD</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
