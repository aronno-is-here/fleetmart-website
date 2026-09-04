import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  ['How long does delivery take?', 'Dhaka city: 24–48 hours. Outside Dhaka: 2–4 working days via our courier partners. You get SMS tracking at every step.'],
  ['How does jersey customization work?', 'Pick any customizable jersey, enter your name and number on the product page, and watch the live preview. Pro-grade vinyl printing adds ৳150 and ships within 24 hours.'],
  ['Can I return a customized jersey?', 'Customized items are returnable only for printing defects or wrong size due to our error. Standard (non-customized) items have a full 7-day return window.'],
  ['What payment methods do you accept?', 'bKash, Nagad, all major cards (via UddoktaPay), and Cash on Delivery nationwide.'],
  ['Are the jerseys authentic?', 'Every kit passes our 3-point authenticity check — official fabric weight, heat-pressed crest verification, and colour-lock testing. Guaranteed on every invoice.'],
  ['Do you offer team/bulk discounts?', 'Yes — orders of 10+ kits get tiered discounts and free squad printing. Contact us with your squad list for a quote within 24 hours.'],
  ['Do you install artificial turf?', 'Yes. We supply 50mm premier turf and offer end-to-end installation — site measurement within 48 hours, and quotes are free.'],
]

export default function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <div className="container-fm max-w-3xl py-10">
      <p className="eyebrow mb-2">Good to know</p>
      <h1 className="font-display text-5xl uppercase tracking-wide text-chalk">FAQ</h1>
      <div className="mt-8 divide-y divide-line border border-line bg-pitch">
        {FAQS.map(([q, a], i) => (
          <div key={q}>
            <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
              <span className="font-head text-sm font-semibold uppercase tracking-wide text-chalk">{q}</span>
              <ChevronDown size={16} className={`shrink-0 text-volt transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{a}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}