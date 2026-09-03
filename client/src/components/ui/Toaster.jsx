import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { X, CheckCircle2, AlertTriangle, Heart } from 'lucide-react'
import { dismissToast } from '../../features/uiSlice'

const ICONS = {
  success: <CheckCircle2 size={18} className="text-volt" />,
  error: <AlertTriangle size={18} className="text-ember" />,
  wishlist: <Heart size={18} className="fill-ember text-ember" />,
}

function ToastItem({ t }) {
  const dispatch = useDispatch()
  useEffect(() => {
    const id = setTimeout(() => dispatch(dismissToast(t.id)), 2600)
    return () => clearTimeout(id)
  }, [t.id, dispatch])
  return (
    <div className="pointer-events-auto flex items-center gap-3 border border-line bg-pitch2/95 px-4 py-3 shadow-card backdrop-blur">
      {ICONS[t.type] || ICONS.success}
      <p className="text-sm text-chalk">{t.message}</p>
      <button onClick={() => dispatch(dismissToast(t.id))} className="ml-2 text-muted hover:text-chalk" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}

export default function Toaster() {
  const toasts = useSelector((s) => s.ui.toasts)
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[90] flex w-72 flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </div>
  )
}
