import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

export default function OrderSuccess() {
  return (
    <div className="container-fm grid place-items-center py-24 text-center">
      <div className="max-w-md">
        <CheckCircle2 size={64} className="mx-auto text-volt" />
        <h1 className="mt-6 font-display text-6xl uppercase tracking-wide text-chalk">Order Confirmed</h1>
        <p className="mt-3 text-muted">Your gear is being packed. You'll get SMS + email updates at every step — Processing → Shipped → Delivered.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/account/orders" className="btn-volt !text-xs">Track Order</Link>
          <Link to="/shop" className="btn-ghost !text-xs">Keep Shopping</Link>
        </div>
      </div>
    </div>
  )
}