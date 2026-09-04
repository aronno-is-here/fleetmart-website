import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, GripVertical, Eye, EyeOff } from 'lucide-react'
import api from '../../lib/api'

const EMPTY = { name: '', displayOrder: 0 }

export default function AdminBrands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/brands/all')
      setBrands(data.brands)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing('new'); setForm(EMPTY) }
  const openEdit = (b) => {
    setEditing(b._id)
    setForm({ name: b.name, displayOrder: b.displayOrder || 0 })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing === 'new') {
        await api.post('/brands', form)
      } else {
        await api.put(`/brands/${editing}`, form)
      }
      setEditing(null)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed')
    }
    setSaving(false)
  }

  const handleDelete = async (b) => {
    if (!confirm(`Delete "${b.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/brands/${b._id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleToggleActive = async (b) => {
    try {
      await api.put(`/brands/${b._id}`, { isActive: !b.isActive })
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed')
    }
  }

  const filtered = filter
    ? brands.filter(b => b.name.toLowerCase().includes(filter.toLowerCase()) || b.slug.includes(filter.toLowerCase()))
    : brands

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display tracking-wider text-chalk">Brands</h1>
          <p className="text-sm text-muted">{brands.length} brands total</p>
        </div>
        <button onClick={openNew} className="btn-volt text-xs">
          <Plus size={16} /> Add Brand
        </button>
      </div>

      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Search brands..."
        className="input-fm max-w-xs"
      />

      <div className="bg-pitch border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Brand</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Slug</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Status</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Order</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="px-4 py-8 text-center text-muted">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-8 text-center text-muted">No brands found</td></tr>
            ) : (
              filtered.map(b => (
                <tr key={b._id} className="border-b border-line hover:bg-pitch2/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-muted/40 cursor-grab" />
                      <span className="font-head text-sm text-chalk">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted font-mono">{b.slug}</td>
                  <td className="px-4 py-3">
                    {b.isActive ? (
                      <span className="text-[10px] font-head uppercase tracking-widest text-volt bg-volt/10 px-1.5 py-0.5">active</span>
                    ) : (
                      <span className="text-[10px] font-head uppercase tracking-widest text-ember bg-ember/10 px-1.5 py-0.5">inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{b.displayOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleToggleActive(b)} className="text-muted hover:text-volt p-1" title={b.isActive ? 'Deactivate' : 'Activate'}>
                        {b.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button onClick={() => openEdit(b)} className="text-muted hover:text-volt p-1"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(b)} className="text-muted hover:text-ember p-1"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-pitch border border-line w-full max-w-lg mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 className="text-lg font-display tracking-wider text-chalk">
                {editing === 'new' ? 'Add Brand' : 'Edit Brand'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-chalk"><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-fm" />
              </div>
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Display Order</label>
                <input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} className="input-fm" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-line">
                <button type="submit" disabled={saving} className="btn-volt">
                  {saving ? 'Saving...' : 'Save Brand'}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
