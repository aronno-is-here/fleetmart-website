import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { fmt } from '../lib/format'
import api from '../lib/api'

export default function OrderSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (orderId) {
      api.get(`/orders/lookup/${orderId}`).then(({ data }) => setOrder(data.order)).catch(() => {})
    }
  }, [orderId])

  return (
    <div className="container-fm grid place-items-center py-24 text-center">
      <div className="max-w-lg">
        <CheckCircle2 size={64} className="mx-auto text-volt" />
        <h1 className="mt-6 font-display text-6xl uppercase tracking-wide text-chalk">Order Confirmed</h1>
        {orderId && (
          <p className="mt-3 text-muted">Order <span className="font-semibold text-volt">#{orderId}</span> is confirmed. A tracking link is on its way to your inbox.</p>
        )}

        {order && (
          <div className="mt-8 border border-line bg-pitch p-6 text-left">
            <h2 className="font-head text-sm font-semibold uppercase tracking-widest text-chalk mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Order ID</span>
                <span className="text-volt font-head font-semibold">{order.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Payment Type</span>
                <span className="text-chalk capitalize">{order.paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Amount Paid</span>
                <span className="text-volt font-semibold">{fmt(order.amountPaid)}</span>
              </div>
              {order.remainingAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Remaining</span>
                  <span className="text-ember font-semibold">{fmt(order.remainingAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3">
                <span className="text-muted">Total</span>
                <span className="text-chalk font-head font-semibold">{fmt(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Payment Status</span>
                <span className={`font-head text-xs uppercase px-2 py-0.5 ${order.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' : order.paymentStatus === 'partial' ? 'bg-gold/20 text-gold' : 'bg-muted/20 text-muted'}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Order Status</span>
                <span className="text-chalk capitalize">{order.orderStatus}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-3">
          <Link to="/account/orders" className="btn-volt !text-xs">Track Order</Link>
          <Link to="/shop" className="btn-ghost !text-xs">Keep Shopping</Link>
        </div>
      </div>
    </div>
  )
}
