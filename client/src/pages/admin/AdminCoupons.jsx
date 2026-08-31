import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import api from '../../lib/api'

const empty = { code: '', discountType: 'percent', value: '', minOrder: '', maxUses: '', expiresAt: '' }

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/coupons').then(res => {
      setCoupons(res.data.coupons)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing('new'); setForm(empty) }
  const openEdit = (c) => {
    setEditing(c._id)
    setForm({
      code: c.code,
      discountType: c.discountType,
      value: String(c.value),
      minOrder: String(c.minOrder),
      maxUses: String(c.maxUses),
      expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '',
    })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        value: Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxUses: Number(form.maxUses) || 0,
        expiresAt: form.expiresAt || null,
      }
      if (editing === 'new') {
        await api.post('/coupons', body)
      } else {
        await api.put(`/coupons/${editing}`, body)
      }
      setEditing(null)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed')
    }
    setSaving(false)
  }

  const remove = async (id) => {
    if (!confirm('Delete this coupon?')) return
    await api.delete(`/coupons/${id}`)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display tracking-wider text-chalk">Coupons</h1>
        <button onClick={openNew} className="btn-volt text-xs"><Plus size={16} /> Add Coupon</button>
      </div>

      <div className="bg-pitch border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Code</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Discount</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Min Order</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Uses</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Expires</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c._id} className="border-b border-line hover:bg-pitch2/50">
                <td className="px-4 py-3 font-head text-volt">{c.code}</td>
                <td className="px-4 py-3 text-chalk">
                  {c.discountType === 'percent' ? `${c.value}%` : `৳${c.value}`}
                </td>
                <td className="px-4 py-3 text-muted">{c.minOrder ? `৳${c.minOrder}` : '—'}</td>
                <td className="px-4 py-3 text-muted">{c.usedCount}/{c.maxUses || '∞'}</td>
                <td className="px-4 py-3 text-muted">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-muted hover:text-volt"><Pencil size={16} /></button>
                    <button onClick={() => remove(c._id)} className="text-muted hover:text-ember"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20">
          <div className="bg-pitch border border-line w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 className="text-lg font-display tracking-wider text-chalk">{editing === 'new' ? 'Add Coupon' : 'Edit Coupon'}</h2>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-chalk"><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required className="input-fm uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Type</label>
                  <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className="input-fm">
                    <option value="percent">Percent</option>
                    <option value="flat">Flat (BDT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Value</label>
                  <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required className="input-fm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Min Order (BDT)</label>
                  <input type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} className="input-fm" />
                </div>
                <div>
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Max Uses (0=unlimited)</label>
                  <input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} className="input-fm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Expires</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="input-fm" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-line">
                <button type="submit" disabled={saving} className="btn-volt">{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
