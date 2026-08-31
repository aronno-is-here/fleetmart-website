import { useEffect, useState } from 'react'
import { Trash2, Eye, EyeOff } from 'lucide-react'
import api from '../../lib/api'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/admin/reviews').then(res => {
      setReviews(res.data.reviews)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleVisibility = async (id, isVisible) => {
    await api.put(`/reviews/${id/}visibility`, { isVisible: !isVisible })
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this review?')) return
    await api.delete(`/reviews/${id}`)
    load()
  }

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display tracking-wider text-chalk">Reviews</h1>

      <div className="bg-pitch border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Product</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">User</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Rating</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Comment</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Visible</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r._id} className="border-b border-line hover:bg-pitch2/50">
                <td className="px-4 py-3">
                  <div className="text-chalk">{r.product?.name}</div>
                </td>
                <td className="px-4 py-3 text-muted">{r.user?.name}</td>
                <td className="px-4 py-3 text-gold">{stars(r.rating)}</td>
                <td className="px-4 py-3 text-muted max-w-xs truncate">{r.comment}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-head uppercase px-2 py-0.5 rounded ${r.isVisible ? 'bg-green-500/20 text-green-400' : 'bg-ember/20 text-ember'}`}>
                    {r.isVisible ? 'Visible' : 'Hidden'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleVisibility(r._id, r.isVisible)} className="text-muted hover:text-volt">
                      {r.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => remove(r._id)} className="text-muted hover:text-ember"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviews.length === 0 && !loading && <div className="text-muted text-sm">No reviews yet</div>}
    </div>
  )
}
