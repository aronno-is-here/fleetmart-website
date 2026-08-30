import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { removeFromCart, setQty, cartTotal, cartCount } from '../features/cartSlice'
import { setCartOpen } from '../features/uiSlice'
import { fmt } from '../lib/format'

const FREE_SHIP = 3000

export default function CartDrawer() {
  const dispatch = useDispatch()
  const open = useSelector((s) => s.ui.cartOpen)
  const items = useSelector((s) => s.cart)
  const total = useSelector(cartTotal)
  const count = useSelector(cartCount)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const remaining = Math.max(0, FREE_SHIP - total)
  const progress = Math.min(100, (total / FREE_SHIP) * 100)

  return (
    <>
      <div
        className={`fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => dispatch(setCartOpen(false))}
      />
      <aside
        className={`fixed right-0 top-0 z-[75] flex h-full w-full max-w-md flex-col border-l border-line bg-pitch transition-transform duration-250 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Shopping bag"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide text-chalk">
            <ShoppingBag size={20} className="text-volt" /> YOUR BAG <span className="text-sm text-muted">({count})</span>
          </h2>
          <button onClick={() => dispatch(setCartOpen(false))} aria-label="Close cart" className="text-muted hover:text-chalk">
            <X size={20} />
          </button>
        </div>

        {/* Free shipping progress */}
        <div className="border-b border-line px-5 py-3">
          {remaining > 0 ? (
            <p className="text-xs text-muted">
              Add <span className="font-semibold text-volt">{fmt(remaining)}</span> more for <span className="font-semibold text-chalk">FREE delivery</span>
            </p>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-widest text-volt">⚡ You've unlocked FREE delivery</p>
          )}
          <div className="mt-2 h-1 w-full bg-line">
            <div className="h-full bg-volt transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <ShoppingBag size={44} className="text-line" />
              <p className="font-display text-2xl uppercase tracking-wide text-muted">Your bag is empty</p>
              <Link to="/shop" onClick={() => dispatch(setCartOpen(false))} className="btn-volt !text-xs">Start Shopping</Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-4">
                  <div
                    className="h-20 w-20 shrink-0 border border-line bg-night"
                    style={{
                      backgroundImage: item.art ? 'none' : undefined,
                    }}
                  >
                    {item.art ? (
                      <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${item.art.primary}, ${item.art.secondary || item.art.accent || '#111923'})` }} />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-pitch2 to-night" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-head text-sm font-semibold uppercase tracking-wide leading-tight text-chalk">{item.name}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          Size {item.size}
                          {item.customization && ` · ${item.customization.name} #${item.customization.number}`}
                        </p>
                      </div>
                      <button onClick={() => dispatch(removeFromCart(item.key))} aria-label="Remove" className="text-muted transition-colors hover:text-ember">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center border border-line">
                        <button onClick={() => dispatch(setQty({ key: item.key, qty: item.qty - 1 }))} className="grid h-7 w-7 place-items-center text-muted hover:text-volt" aria-label="Decrease">
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-sm">{item.qty}</span>
                        <button onClick={() => dispatch(setQty({ key: item.key, qty: item.qty + 1 }))} className="grid h-7 w-7 place-items-center text-muted hover:text-volt" aria-label="Increase">
                          <Plus size={13} />
                        </button>
                      </div>
                      <p className="font-head font-semibold text-chalk">{fmt(item.price * item.qty)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-head text-sm uppercase tracking-widest text-muted">Subtotal</span>
              <span className="font-head text-xl font-semibold text-chalk">{fmt(total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/cart" onClick={() => dispatch(setCartOpen(false))} className="btn-ghost justify-center !py-2.5 !text-xs">View Bag</Link>
              <Link to="/checkout" onClick={() => dispatch(setCartOpen(false))} className="btn-volt justify-center !py-2.5 !text-xs">Checkout</Link>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
