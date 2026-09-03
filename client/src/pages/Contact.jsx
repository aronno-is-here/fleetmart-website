import { useState } from 'react'
import { Phone, Mail, MapPin, MessageCircle, Send } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { toast } from '../features/uiSlice'
import SEO from '../components/SEO'

export default function Contact() {
  const dispatch = useDispatch()
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', topic: 'Order support', message: '' })

  const submit = (e) => {
    e.preventDefault()
    setSent(true)
    dispatch(toast({ type: 'success', message: 'Message sent — we reply within 24h' }))
  }

  return (
    <div className="container-fm py-10">
      <SEO
        title="Contact Us"
        description="Get in touch with Fleetmart. Order support, bulk orders, returns & refunds. Call 09612-FLEET or visit our store in Dhanmondi, Dhaka."
        url="/contact"
      />
      <p className="eyebrow mb-2">We answer fast</p>
      <h1 className="font-display text-5xl uppercase tracking-wide text-chalk">Contact Us</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="border border-line bg-pitch p-8">
          {sent ? (
            <div className="grid place-items-center py-16 text-center">
              <Send size={44} className="text-volt" />
              <p className="mt-4 font-display text-4xl uppercase tracking-wide text-chalk">Message received</p>
              <p className="mt-2 text-sm text-muted">Our support squad replies within 24 hours — usually much faster on match days.</p>
              <button onClick={() => { setSent(false); setForm({ name: '', email: '', topic: 'Order support', message: '' }) }} className="btn-ghost mt-6 !text-xs">Send another</button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk sm:col-span-2">Send a message</p>
              <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-fm" />
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-fm" />
              <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="input-fm sm:col-span-2">
                {['Order support', 'Turf installation quote', 'Bulk / team orders', 'Returns & refunds', 'Something else'].map((t) => <option key={t}>{t}</option>)}
              </select>
              <textarea required rows={5} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-fm sm:col-span-2" />
              <button className="btn-volt sm:col-span-2 sm:w-fit">Send Message</button>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          {[
            { icon: <Phone size={18} />, title: 'Hotline', sub: '09612-FLEET (9am–11pm)' },
            { icon: <MessageCircle size={18} />, title: 'WhatsApp', sub: '+880 1700-000000' },
            { icon: <Mail size={18} />, title: 'Email', sub: 'support@fleetmart.com' },
            { icon: <MapPin size={18} />, title: 'Flagship Store', sub: 'House 12, Road 5, Dhanmondi, Dhaka 1205' },
          ].map((c) => (
            <div key={c.title} className="flex items-start gap-4 border border-line bg-pitch p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center bg-volt/10 text-volt">{c.icon}</span>
              <div>
                <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">{c.title}</p>
                <p className="mt-1 text-sm text-muted">{c.sub}</p>
              </div>
            </div>
          ))}
          <div className="border border-volt/30 bg-volt/5 p-5">
            <p className="font-head text-sm font-semibold uppercase tracking-widest text-volt">Team & bulk orders</p>
            <p className="mt-2 text-sm text-muted">Kitting out a squad of 10+? Ask about bulk pricing and free squad printing.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}