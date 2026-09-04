import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight, Timer, Quote } from 'lucide-react'
import { TEAMS } from '../data/products'
import { useFlatCategories } from '../hooks/useCategories'
import { ProductArt, JerseyArt, BootArt } from '../components/ProductArt'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import SectionHeading from '../components/ui/SectionHeading'
import SEO from '../components/SEO'
import { fmt } from '../lib/format'
import api from '../lib/api'

function Hero() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [banners, setBanners] = useState([])
  const timer = useRef(null)

  useEffect(() => {
    api.get('/banners').then(({ data }) => {
      if (data.banners?.length) setBanners(data.banners)
    }).catch(() => {})
  }, [])

  const hasBanners = banners.length > 0
  const slideCount = hasBanners ? banners.length : 1

  useEffect(() => {
    if (paused || !hasBanners) return
    timer.current = setInterval(() => setIdx((i) => (i + 1) % slideCount), 6000)
    return () => clearInterval(timer.current)
  }, [paused, slideCount, hasBanners])

  const currentBanner = hasBanners ? banners[idx] : null

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

      <div className="container-fm relative grid min-h-[520px] items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
        {/* LEFT SIDE — FIXED, never changes */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
          <p className="eyebrow mb-4">New Season · 25/26 Kits</p>
          <h1 className="whitespace-pre-line font-display text-7xl leading-[0.9] tracking-wide text-chalk sm:text-8xl lg:text-9xl">
            WEAR YOUR<br />
            <span className="text-volt">COLOURS</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
            Official club & national jerseys with custom name and number printing. Printed in hours, not days.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop?category=jersey" className="btn-volt">
              Shop Jerseys <ArrowRight size={16} />
            </Link>
            <Link to="/shop" className="btn-ghost">Browse All</Link>
          </div>
        </motion.div>

        {/* RIGHT SIDE — DYNAMIC, cycles through banners or shows default art */}
        {hasBanners ? (
          <motion.div
            key={`banner-${idx}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-md"
          >
            <a href={currentBanner?.targetUrl || '/shop'} className="block">
              <img
                src={currentBanner?.imageUrl}
                alt={currentBanner?.title || 'Banner'}
                className="w-full h-auto object-contain rounded"
              />
            </a>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(198,245,63,0.13),transparent_65%)]" />
            <div className="animate-fadeUp">
              <JerseyArt primary={TEAMS.omega.primary} secondary={TEAMS.omega.secondary} number="10" name="FLEET" view="front" />
            </div>
            <div className="absolute -right-2 top-6 border border-volt/40 bg-night/85 px-4 py-2 backdrop-blur sm:-right-6">
              <p className="font-head text-xs uppercase tracking-[0.2em] text-muted">From</p>
              <p className="font-display text-3xl text-volt">৳1,499</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Carousel controls — only when multiple banners */}
      {hasBanners && slideCount > 1 && (
        <div className="container-fm relative flex items-center gap-4 pb-8">
          <button onClick={() => setIdx((idx - 1 + slideCount) % slideCount)} aria-label="Previous slide" className="grid h-10 w-10 place-items-center border border-line text-muted transition-colors hover:border-volt hover:text-volt">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setIdx((idx + 1) % slideCount)} aria-label="Next slide" className="grid h-10 w-10 place-items-center border border-line text-muted transition-colors hover:border-volt hover:text-volt">
            <ChevronRight size={18} />
          </button>
          <div className="flex flex-1 gap-2">
            {banners.map((_, i) => (
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
          <span className="font-head text-sm tracking-widest text-muted">0{idx + 1} / 0{slideCount}</span>
        </div>
      )}
    </section>
  )
}

function CategoryTiles() {
  const [counts, setCounts] = useState({})
  const { categories: CATEGORIES } = useFlatCategories()

  useEffect(() => {
    api.get('/products', { params: { limit: 200 } }).then(({ data }) => {
      const c = {}
      CATEGORIES.forEach(cat => { c[cat.id] = 0 })
      data.products.forEach(p => {
        if (c[p.category] !== undefined) c[p.category]++
      })
      setCounts(c)
    }).catch(() => {})
  }, [CATEGORIES])

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
              <img src={deal.images[0].url} alt={deal.name} className="w-full object-contain" loading="lazy" decoding="async" />
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

const FALLBACK_REVIEWS = [
  { reviewerName: 'User_1110217', comment: 'Ordered 14 customized jerseys for my team on Tuesday, wore them Saturday. The volt print on midnight navy is unreal in person.', rating: 5 },
  { reviewerName: 'User_7348291', comment: 'The Academy Turf boots grip wet artificial grass better than boots triple the price. Fleetmart gets the Dhaka turf scene.', rating: 5 },
  { reviewerName: 'User_5029384', comment: 'That Crimson 94 reissue is faithful to the last stitch. Packaging, authenticity card, everything premium.', rating: 4 },
]

function Testimonials() {
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS)

  useEffect(() => {
    api.get('/reviews/featured').then(({ data }) => {
      if (data.reviews?.length > 0) setReviews(data.reviews)
    }).catch(() => {})
  }, [])

  return (
    <section className="border-y border-line bg-pitch/40 py-16">
      <div className="container-fm">
        <SectionHeading eyebrow="From the stands" title="What the Squad Says" />
        <div className="grid gap-4 md:grid-cols-3">
          {reviews.slice(0, 3).map((r, i) => (
            <motion.figure
              key={r._id || r.reviewerName}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="relative border border-line bg-pitch p-6"
            >
              <Quote size={28} className="absolute right-5 top-5 text-volt/20" />
              <blockquote className="text-sm leading-relaxed text-chalk/90">"{r.comment}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center bg-volt/15 font-display text-lg text-volt">{r.reviewerName?.[5] || '?'}</span>
                <span>
                  <span className="block font-head text-sm font-semibold uppercase tracking-wide text-chalk">{r.reviewerName}</span>
                  {r.product?.name && <span className="block text-xs text-muted">{r.product.name}</span>}
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
      <SEO
        title="Home"
        description="Premium football jerseys, boots, balls & training gear in Bangladesh. Customize your kit with name & number printing. Shop official club & national team kits."
        url="/"
      />
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
