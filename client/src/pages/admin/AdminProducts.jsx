import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import api from '../../lib/api'

const fmt = (n) => `৳${Number(n).toLocaleString()}`

const empty = {
  name: '', slug: '', description: '', category: 'jersey', subCategory: '', brand: '',
  team: '', league: '', price: '', discountPrice: '', stock: '{}',
  featured: false, isNew: false, customizable: false,
  artColors: { primary: '#C6F53F', secondary: '#0A0E13', accent: '#3FA9F5' },
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')

  const load = (p = 1) => {
    setLoading(true)
    const params = { page: p, limit: 20 }
    if (filter) params.category = filter
    api.get('/products', { params }).then(res => {
      setProducts(res.data.products)
      setTotal(res.data.total)
      setPages(res.data.pages)
      setPage(p)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const openNew = () => { setEditing('new'); setForm(empty) }
  const openEdit = (p) => {
    setEditing(p._id)
    setForm({
      ...p,
      price: String(p.price),
      discountPrice: p.discountPrice ? String(p.discountPrice) : '',
      stock: JSON.stringify(Object.fromEntries(Object.entries(p.stock || {}))),
    })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        stock: JSON.parse(form.stock || '{}'),
      }
      if (editing === 'new') {
        await api.post('/products', body)
      } else {
        await api.put(`/products/${editing}`, body)
      }
      setEditing(null)
      load(page)
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed')
    }
    setSaving(false)
  }

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return
    await api.delete(`/products/${id}`)
    load(page)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display tracking-wider text-chalk">Products</h1>
          <p className="text-sm text-muted">{total} products total</p>
        </div>
        <button onClick={openNew} className="btn-volt text-xs">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filter */}
      <select value={filter} onChange={e => setFilter(e.target.value)} className="input-fm max-w-xs">
        <option value="">All Categories</option>
        <option value="jersey">Jerseys</option>
        <option value="boots">Boots</option>
        <option value="football">Footballs</option>
        <option value="training">Training</option>
        <option value="goalkeeper">Goalkeeping</option>
        <option value="turf">Turf & Grass</option>
        <option value="accessories">Accessories</option>
        <option value="merch">Fan Merch</option>
      </select>

      {/* Table */}
      <div className="bg-pitch border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Product</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Category</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Price</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Stock</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Status</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const totalStock = Object.values(p.stock || {}).reduce((s, v) => s + v, 0)
              return (
                <tr key={p._id} className="border-b border-line hover:bg-pitch2/50">
                  <td className="px-4 py-3">
                    <div className="font-head text-chalk">{p.name}</div>
                    <div className="text-xs text-muted">{p.brand}</div>
                  </td>
                  <td className="px-4 py-3 text-muted capitalize">{p.category}</td>
                  <td className="px-4 py-3">
                    <span className="text-chalk">{fmt(p.price)}</span>
                    {p.discountPrice && <span className="text-xs text-ember ml-2">{fmt(p.discountPrice)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-head ${totalStock < 10 ? 'text-ember' : 'text-muted'}`}>{totalStock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.featured && <span className="text-[10px] font-head bg-volt/20 text-volt px-1.5 py-0.5 rounded">Featured</span>}
                      {p.isNew && <span className="text-[10px] font-head bg-azure/20 text-azure px-1.5 py-0.5 rounded">New</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-muted hover:text-volt"><Pencil size={16} /></button>
                      <button onClick={() => remove(p._id)} className="text-muted hover:text-ember"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => load(p)} className={`px-3 py-1 text-sm font-head ${p === page ? 'bg-volt text-night' : 'bg-pitch2 text-muted hover:text-chalk'}`}>{p}</button>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20 overflow-y-auto">
          <div className="bg-pitch border border-line w-full max-w-2xl mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 className="text-lg font-display tracking-wider text-chalk">
                {editing === 'new' ? 'Add Product' : 'Edit Product'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-chalk"><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-fm" />
                </div>
                <div>
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Slug</label>
                  <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required className="input-fm" />
                </div>
                <div>
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-fm">
                    {['jersey','boots','football','training','goalkeeper','turf','accessories','merch'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Brand</label>
                  <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="input-fm" />
                </div>
                <div>
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Team</label>
                  <input value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} className="input-fm" />
                </div>
                <div>
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Price (BDT)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required className="input-fm" />
                </div>
                <div>
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Discount Price</label>
                  <input type="number" value={form.discountPrice} onChange={e => setForm({ ...form, discountPrice: e.target.value })} className="input-fm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="input-fm" />
              </div>

              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Stock (JSON: {'{'}"S": 10, "M": 5{'}'})</label>
                <input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="input-fm font-mono text-xs" />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-chalk">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-volt" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-chalk">
                  <input type="checkbox" checked={form.isNew} onChange={e => setForm({ ...form, isNew: e.target.checked })} className="accent-volt" />
                  New
                </label>
                <label className="flex items-center gap-2 text-sm text-chalk">
                  <input type="checkbox" checked={form.customizable} onChange={e => setForm({ ...form, customizable: e.target.checked })} className="accent-volt" />
                  Customizable
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-line">
                <button type="submit" disabled={saving} className="btn-volt">
                  {saving ? 'Saving...' : 'Save Product'}
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
