import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight, Timer, Quote } from 'lucide-react'
import { CATEGORIES, TEAMS } from '../data/products'
import { ProductArt, JerseyArt, BootArt } from '../components/ProductArt'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import SectionHeading from '../components/ui/SectionHeading'
import { fmt } from '../lib/format'
import api from '../lib/api'

const SLIDES = [
  {
    eyebrow: 'New Season · 25/26 Kits',
    title: 'WEAR YOUR\nCOLOURS',
    sub: 'Official club & national jerseys with custom name and number printing. Printed in hours, not days.',
    cta: { label: 'Shop Jerseys', to: '/shop?category=jersey' },
    team: TEAMS.omega,
  },
  {
    eyebrow: 'Limited Drop · 500 pieces',
    title: 'VOLT ARMADA\nSPECIAL EDITION',
    sub: 'Charcoal blackout sliced with volt lightning sleeves. Numbered run — when it\'s gone, it\'s gone.',
    cta: { label: 'Grab Yours', to: '/product/volt-armada-special' },
    team: TEAMS.voltarmada,
  },
  {
    eyebrow: 'Boots That Bite',
    title: 'SPEED IS A\nWEAPON',
    sub: 'Featherweight FG & turf boots from ৳2,999. Grip engineered for artificial grass.',
    cta: { label: 'Shop Boots', to: '/shop?category=boots' },
    team: null,
  },
]

function Hero() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (paused) return
    timer.current = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6000)
    return () => clearInterval(timer.current)
  }, [paused])

  const s = SLIDES[idx]

  return (
    <section
      className="relative overflow-hidden border-b border-line bg-night"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-chalk" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-chalk" />
        <div className="absolute bottom-0 left-1/2 h-56 w-[420px] -translate-x-1/2 border-2 border-b-0 border-chalk" />
      </div>

      <div className="container-fm relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <motion.div key={idx} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
          <p className="eyebrow mb-4">{s.eyebrow}</p>
          <h1 className="whitespace-pre-line font-display text-7xl leading-[0.9] tracking-wide text-chalk sm:text-8xl lg:text-9xl">
            {s.title.split('\n')[0]}
            <br />
            <span className="text-volt">{s.title.split('\n')[1]}</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">{s.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={s.cta.to} className="btn-volt">
              {s.cta.label} <ArrowRight size={16} />
            </Link>
            <Link to="/shop" className="btn-ghost">Browse All</Link>
          </div>
        </motion.div>

        <motion.div key={`art-${idx}`} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, ease: 'easeOut' }} className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(198,245,63,0.13),transparent_65%)]" />
          {s.team ? (
            <div className="animate-fadeUp">
              <JerseyArt primary={s.team.primary} secondary={s.team.secondary} number="10" name="FLEET" view="front" />
            </div>
          ) : (
            <div className="animate-fadeUp">
              <BootArt primary="#C6F53F" secondary="#0A0E13" />
            </div>
          )}
          <div className="absolute -right-2 top-6 border border-volt/40 bg-night/85 px-4 py-2 backdrop-blur sm:-right-6">
            <p className="font-head text-xs uppercase tracking-[0.2em] text-muted">From</p>
            <p className="font-display text-3xl text-volt">৳1,499</p>
          </div>
        </motion.div>
      </div>

      <div className="container-fm relative flex items-center gap-4 pb-8">
        <button onClick={() => setIdx((idx - 1 + SLIDES.length) % SLIDES.length)} aria-label="Previous slide" className="grid h-10 w-10 place-items-center border border-line text-muted transition-colors hover:border-volt hover:text-volt">
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => setIdx((idx + 1) % SLIDES.length)} aria-label="Next slide" className="grid h-10 w-10 place-items-center border border-line text-muted transition-colors hover:border-volt hover:text-volt">
          <ChevronRight size={18} />
        </button>
        <div className="flex flex-1 gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="group relative h-1 flex-1 overflow-hidden bg-line"
            >
              <span
                className={`absolute inset-y-0 left-0 bg-volt transition-all ${i === idx ? 'w-full duration-[6000ms] ease-linear' : 'w-0 duration-0'}`}
                key={`${i}-${idx === i}-${paused}`}
              />
            </button>
          ))}
        </div>
        <span className="font-head text-sm tracking-widest text-muted">0{idx + 1} / 0{SLIDES.length}</span>
      </div>
    </section>
  )
}

function CategoryTiles() {
  const [counts, setCounts] = useState({})

  useEffect(() => {
    api.get('/products', { params: { limit: 200 } }).then(({ data }) => {
      const c = {}
      CATEGORIES.forEach(cat => { c[cat.id] = 0 })
      data.products.forEach(p => {
        if (c[p.category] !== undefined) c[p.category]++
      })
      setCounts(c)
    }).catch(() => {})
  }, [])

  return (
    <section className="container-fm py-16">
      <SectionHeading eyebrow="Find your lane" title="Shop by Category" action="View all" to="/shop" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {CATEGORIES.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}>
            <Link to={`/shop?category=${c.id}`} className="group relative block overflow-hidden border border-line bg-pitch transition-colors hover:border-volt/50">
              <div className="aspect-[4/3] transition-transform duration-300 group-hover:scale-105 flex items-center justify-center bg-pitch2">
                <span className="font-display text-4xl text-chalk/10 uppercase">{c.name.slice(0, 2)}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/70 to-transparent p-4 pt-10">
                <p className="font-display text-2xl uppercase tracking-wide text-chalk group-hover:text-volt">{c.name}</p>
                <p className="text-[11px] uppercase tracking-widest text-muted">{counts[c.id] || 0} items</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function Featured() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/products', { params: { featured: '1', limit: 8, sort: 'featured' } })
      .then(({ data }) => setProducts(data.products))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="border-y border-line bg-pitch/40 py-16">
      <div className="container-fm">
        <SectionHeading eyebrow="Crowd favourites" title="Featured Gear" action="Shop all" to="/shop" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>
    </section>
  )
}

function useCountdown() {
  const target = useRef(new Date().setHours(23, 59, 59, 999))
  const [left, setLeft] = useState(target.current - Date.now())
  useEffect(() => {
    const id = setInterval(() => setLeft(target.current - Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const t = Math.max(0, left)
  return {
    h: String(Math.floor(t / 3600000)).padStart(2, '0'),
    m: String(Math.floor((t % 3600000) / 60000)).padStart(2, '0'),
    s: String(Math.floor((t % 60000) / 1000)).padStart(2, '0'),
  }
}

function FlashDeal() {
  const { h, m, s } = useCountdown()
  const navigate = useNavigate()
  const [deal, setDeal] = useState(null)

  useEffect(() => {
    api.get('/products', { params: { search: 'volt armada', limit: 1 } })
      .then(({ data }) => { if (data.products[0]) setDeal(data.products[0]) })
      .catch(() => {})
  }, [])

  if (!deal) return null

  const price = deal.discountPrice || deal.price

  return (
    <section className="container-fm py-16">
      <div className="relative overflow-hidden border border-volt/30 bg-gradient-to-r from-pitch via-pitch2 to-pitch">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-volt/10 blur-3xl" />
        <div className="relative grid items-center gap-8 p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="eyebrow mb-3 flex items-center gap-2"><Timer size={14} /> Flash Deal · Ends Tonight</p>
            <h2 className="font-display text-5xl uppercase leading-none tracking-wide text-chalk sm:text-6xl">
              {deal.name.split(' ').slice(0, 2).join(' ')}<br /><span className="text-volt">{deal.name.split(' ').slice(2).join(' ')}</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm text-muted">{deal.description}</p>
            <div className="mt-6 flex items-center gap-4">
              <span className="font-head text-3xl font-semibold text-chalk">{fmt(price)}</span>
              {deal.discountPrice && <span className="text-lg text-muted line-through">{fmt(deal.price)}</span>}
              {deal.discountPrice && <span className="bg-ember px-2 py-1 font-head text-sm font-semibold text-white">SAVE ৳{deal.price - price}</span>}
            </div>
            <div className="mt-6 flex items-center gap-2">
              {[[h, 'HRS'], [m, 'MIN'], [s, 'SEC']].map(([v, l]) => (
                <div key={l} className="border border-line bg-night px-3 py-2 text-center">
                  <p className="font-display text-2xl text-volt">{v}</p>
                  <p className="text-[10px] tracking-widest text-muted">{l}</p>
                </div>
              ))}
              <button onClick={() => navigate(`/product/${deal.slug}`)} className="btn-volt ml-3 !text-xs">Buy Now</button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-xs">
            {deal.images?.[0] ? (
              <img src={deal.images[0].url} alt={deal.name} className="w-full object-contain" />
            ) : (
              <div className="aspect-square bg-pitch2 flex items-center justify-center">
                <span className="font-display text-4xl text-chalk/10">IMG</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function BrandStrip() {
  const brands = ['FLEETMART PRO', 'STRIKERX', 'VELOCITA', 'NORTHWALL', 'TITANGRIP']
  return (
    <section className="overflow-hidden border-y border-line bg-pitch py-6">
      <div className="flex w-max animate-marquee gap-16 whitespace-nowrap">
        {[0, 1].map((half) => (
          <div key={half} className="flex gap-16">
            {brands.map((b) => (
              <span key={`${half}-${b}`} className="font-display text-3xl tracking-wider text-chalk/25 transition-colors hover:text-volt">
                {b}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function CountUp({ to, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        const start = performance.now()
        const dur = 1400
        const tick = (now) => {
          const t = Math.min(1, (now - start) / dur)
          setVal(Math.round(to * (1 - Math.pow(1 - t, 3))))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        obs.disconnect()
      },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [to])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

function Stats() {
  const stats = [
    { to: 12500, suffix: '+', label: 'Kits Shipped' },
    { to: 4800, suffix: '+', label: 'Match Players' },
    { to: 62, suffix: '', label: 'Clubs & Nations' },
    { to: 99, suffix: '%', label: 'Positive Reviews' },
  ]
  return (
    <section className="container-fm grid grid-cols-2 gap-4 py-16 md:grid-cols-4">
      {stats.map((st) => (
        <div key={st.label} className="border border-line bg-pitch p-6 text-center">
          <p className="font-display text-5xl tracking-wide text-volt"><CountUp to={st.to} suffix={st.suffix} /></p>
          <p className="mt-1 font-head text-xs font-medium uppercase tracking-[0.25em] text-muted">{st.label}</p>
        </div>
      ))}
    </section>
  )
}

const REVIEWS = [
  { name: 'Tanvir A.', role: 'Sunday League Captain', text: 'Ordered 14 customized jerseys for my team on Tuesday, wore them Saturday. The volt print on midnight navy is unreal in person.', rating: 5 },
  { name: 'Sadia R.', role: 'Turf Regular', text: 'The Academy Turf boots grip wet artificial grass better than boots triple the price. Fleetmart gets the Dhaka turf scene.', rating: 5 },
  { name: 'Rafi H.', role: 'Retro Collector', text: 'That Crimson 94 reissue is faithful to the last stitch. Packaging, authenticity card, everything premium.', rating: 4 },
]

function Testimonials() {
  return (
    <section className="border-y border-line bg-pitch/40 py-16">
      <div className="container-fm">
        <SectionHeading eyebrow="From the stands" title="What the Squad Says" />
        <div className="grid gap-4 md:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <motion.figure
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="relative border border-line bg-pitch p-6"
            >
              <Quote size={28} className="absolute right-5 top-5 text-volt/20" />
              <blockquote className="text-sm leading-relaxed text-chalk/90">"{r.text}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center bg-volt/15 font-display text-lg text-volt">{r.name[0]}</span>
                <span>
                  <span className="block font-head text-sm font-semibold uppercase tracking-wide text-chalk">{r.name}</span>
                  <span className="block text-xs text-muted">{r.role}</span>
                </span>
                <span className="ml-auto text-gold">{'★'.repeat(r.rating)}<span className="text-line">{'★'.repeat(5 - r.rating)}</span></span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function RecentlyViewed() {
  const recentIds = useSelector((s) => s.ui.recentlyViewed)
  const [products, setProducts] = useState([])

  useEffect(() => {
    if (!recentIds.length) return
    const slugs = recentIds.map(v => v.slug || v.id).filter(Boolean)
    if (!slugs.length) return
    Promise.all(slugs.map(slug => api.get(`/products/${slug}`).then(r => r.data.product).catch(() => null)))
      .then(items => setProducts(items.filter(Boolean)))
  }, [recentIds])

  if (!products.length) return null
  return (
    <section className="container-fm py-16">
      <SectionHeading eyebrow="Pick up where you left off" title="Recently Viewed" />
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {products.map((p) => (
          <div key={p._id} className="w-56 shrink-0"><ProductCard product={p} /></div>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryTiles />
      <Featured />
      <FlashDeal />
      <BrandStrip />
      <Stats />
      <Testimonials />
      <RecentlyViewed />
    </>
  )
}
