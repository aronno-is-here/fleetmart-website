import { useParams } from 'react-router-dom'

const CONTENT = {
  shipping: {
    title: 'Shipping Info',
    body: [
      'Dhaka City: 24–48 hours (standard), next-day express available.',
      'Outside Dhaka: 2–4 working days via Sundarban/RedX/Pathao Courier.',
      'FREE standard delivery on orders over ৳3,000. Flat ৳80 below that. Express (Dhaka) ৳150.',
      'All parcels include SMS + email tracking. Customized jerseys ship within 24 hours of print approval.',
    ],
  },
  returns: {
    title: 'Returns & Refunds',
    body: [
      '7-day return window on unworn, unwashed items with original tags and packaging.',
      'Customized jerseys are only returnable for printing defects or size errors on our side.',
      'Refunds are processed within 3–5 working days to your bKash/Nagad/card. COD orders are refunded via mobile banking.',
      'Wrong item received? We pick it up free of charge and ship the correct one immediately.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    body: [
      'By using Fleetmart you agree to provide accurate contact and delivery information.',
      'Prices, promotions and stock availability may change without prior notice.',
      'Abuse of return/coupon policies (including coordinated bulk returns) may result in account suspension.',
      'Customized content (names/numbers) must not include offensive, hateful, or trademarked third-party text. We reserve the right to reject such print requests.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      'We collect only what is needed to fulfil your order: name, contact, delivery address, and order history.',
      'Payment credentials are processed by certified gateways (SSLCommerz/bKash) — Fleetmart never stores card numbers.',
      'We never sell your personal data. Analytics are aggregated and anonymized.',
      'You may request export or deletion of your data anytime via support@fleetmart.com.',
    ],
  },
}

export default function Policy() {
  const { slug } = useParams()
  const page = CONTENT[slug] || CONTENT.shipping
  return (
    <div className="container-fm max-w-3xl py-10">
      <p className="eyebrow mb-2">Legal</p>
      <h1 className="font-display text-5xl uppercase tracking-wide text-chalk">{page.title}</h1>
      <div className="mt-8 space-y-4">
        {page.body.map((p, i) => (
          <p key={i} className="flex gap-3 border border-line bg-pitch p-5 text-sm leading-relaxed text-muted">
            <span className="font-display text-xl text-volt">{String(i + 1).padStart(2, '0')}</span>
            {p}
          </p>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">Last updated: August 2026 · Questions? support@fleetmart.com</p>
    </div>
  )
}