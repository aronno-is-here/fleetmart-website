import { Link } from 'react-router-dom'
import { Zap, Target, Users, Globe } from 'lucide-react'
import { JerseyArt } from '../components/ProductArt'
import { TEAMS } from '../data/products'
import SEO from '../components/SEO'

export default function About() {
  return (
    <div>
      <SEO
        title="About Us"
        description="Learn about Fleetmart - Bangladesh's trusted source for premium football jerseys, boots, and gear since 2021. Official-quality kits with in-house customization."
        url="/about"
      />
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-chalk" />
        </div>
        <div className="container-fm relative grid items-center gap-10 py-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-4">Our story</p>
            <h1 className="font-display text-7xl leading-[0.9] tracking-wide text-chalk">
              BORN ON THE<br /><span className="text-volt">STREETS</span><br />OF DHAKA
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              Fleetmart started in 2021 with one rooftop stall and a simple frustration: finding an authentic jersey in Bangladesh meant overpaying for fakes, or waiting weeks for imports.
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
              Today we stock official-quality kits from 62 clubs and nations, print your name and number in-house within hours, and outfit Sunday-league squads to national-team fan clubs. Same streets. Bigger pitch.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/shop" className="btn-volt">Shop the Gear</Link>
              <Link to="/contact" className="btn-ghost">Talk to Us</Link>
            </div>
          </div>
          <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
            <div className="scale-105"><JerseyArt {...TEAMS.omega} number="07" name="FLEET" view="back" /></div>
            <div className="translate-y-6"><JerseyArt {...TEAMS.voltarmada} number="10" name="GAME ON" view="front" /></div>
          </div>
        </div>
      </section>

      <section className="container-fm grid gap-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <Zap size={22} />, stat: '12,500+', label: 'Kits delivered to fans' },
          { icon: <Users size={22} />, stat: '480+', label: 'Squads kitted out' },
          { icon: <Target size={22} />, stat: 'In-house', label: 'Printing & customization' },
          { icon: <Globe size={22} />, stat: '64', label: 'Districts we ship to' },
        ].map((s) => (
          <div key={s.label} className="border border-line bg-pitch p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center bg-volt/10 text-volt">{s.icon}</span>
            <p className="mt-4 font-display text-3xl text-chalk">{s.stat}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-line bg-pitch/40 py-16">
        <div className="container-fm max-w-3xl">
          <p className="eyebrow mb-3">The standard</p>
          <h2 className="font-display text-5xl uppercase tracking-wide text-chalk">No fakes. Ever.</h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Every kit passes a 3-point check: official fabric weight, heat-pressed crest verification, and colour-lock dye testing. If it doesn't pass, it never reaches our shelves — that's the Fleetmart guarantee, printed on every invoice.
          </p>
        </div>
      </section>
    </div>
  )
}