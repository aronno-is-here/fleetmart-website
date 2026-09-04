import { Phone, Mail, MapPin, MessageCircle, Clock, Package, RotateCcw, CreditCard } from 'lucide-react'

const CONTACTS = [
  { icon: <Phone size={20} />, title: 'Hotline', sub: '09612-FLEET (9am–11pm, 7 days)', detail: 'Call for urgent order or delivery issues' },
  { icon: <MessageCircle size={20} />, title: 'WhatsApp', sub: '+880 1700-000000', detail: 'Quick replies during business hours' },
  { icon: <Mail size={20} />, title: 'Email', sub: 'support@fleetmart.com', detail: 'We reply within 24 hours' },
  { icon: <MapPin size={20} />, title: 'Flagship Store', sub: 'House 12, Road 5, Dhanmondi, Dhaka 1205', detail: 'Walk-in for try-ons and instant pickup' },
]

const POLICIES = [
  { icon: <Package size={20} />, title: 'Delivery', text: 'Dhaka: 24–48 hours. Outside Dhaka: 2–4 days. Free delivery on orders over ৳3,000.' },
  { icon: <RotateCcw size={20} />, title: 'Returns', text: '7-day easy return on unworn items with original tags. Customized jerseys are non-returnable.' },
  { icon: <CreditCard size={20} />, title: 'Payments', text: 'bKash and Nagad via UddoktaPay. Partial payment (৳300) or full payment available.' },
  { icon: <Clock size={20} />, title: 'Business Hours', text: 'Online store: 24/7. Support team: 9am–11pm daily. Physical store: 10am–9pm.' },
]

export default function Support() {
  return (
    <div className="container-fm py-10">
      <p className="eyebrow mb-2">Help Center</p>
      <h1 className="font-display text-5xl uppercase tracking-wide text-chalk">Support</h1>
      <p className="mt-2 max-w-xl text-muted">Need help with an order, delivery, or just want to say hi? We're here for you.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-head text-sm font-semibold uppercase tracking-widest text-chalk mb-4">Contact Information</h2>
          <div className="space-y-4">
            {CONTACTS.map((c) => (
              <div key={c.title} className="flex items-start gap-4 border border-line bg-pitch p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center bg-volt/10 text-volt">{c.icon}</span>
                <div>
                  <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">{c.title}</p>
                  <p className="mt-1 text-sm text-chalk">{c.sub}</p>
                  <p className="text-xs text-muted">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-head text-sm font-semibold uppercase tracking-widest text-chalk mb-4">Policies & Info</h2>
          <div className="space-y-4">
            {POLICIES.map((p) => (
              <div key={p.title} className="border border-line bg-pitch p-5">
                <div className="flex items-center gap-3">
                  <span className="text-volt">{p.icon}</span>
                  <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">{p.title}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border border-volt/30 bg-volt/5 p-6">
            <p className="font-head text-sm font-semibold uppercase tracking-widest text-volt">Frequently Asked Questions</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>• How do I track my order? → Check your email/SMS for tracking link after dispatch.</li>
              <li>• Can I cancel an order? → Yes, before it's shipped. Contact us via WhatsApp for instant help.</li>
              <li>• Do you ship outside Bangladesh? → Currently we deliver within Bangladesh only.</li>
              <li>• How do partial payments work? → Pay ৳300 online, pay the rest when your order arrives.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
