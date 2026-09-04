import { useEffect, useState, useRef } from 'react'
import { Plus, Pencil, Trash2, X, Upload, Image } from 'lucide-react'
import api from '../../lib/api'

const fmt = (n) => `৳${Number(n).toLocaleString()}`

const empty = {
  name: '', slug: '', description: '', category: '', subCategory: '', brand: '',
  team: '', league: '', price: '', discountPrice: '', stock: '{}',
  featured: false, isNew: false, customizable: false,
  artColors: { primary: '#C6F53F', secondary: '#0A0E13', accent: '#3FA9F5' },
  images: [], categoryPath: [],
}

function CategoryPicker({ value, categoryPath, onChange, categories }) {
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (categoryPath && categoryPath.length) {
      const chain = categoryPath.map(catId => {
        const cat = categories.find(c => c.id === catId)
        return cat ? cat._id : null
      }).filter(Boolean)
      setSelected(chain)
    } else if (value) {
      const cat = categories.find(c => c.id === value)
      if (cat) setSelected([cat._id])
      else setSelected([value])
    } else {
      setSelected([])
    }
  }, [value, categoryPath, categories])

  const rootCats = categories.filter(c => !c.parent)
  const childrenMap = {}
  categories.forEach(c => {
    if (c.parent) {
      const parentId = typeof c.parent === 'object' ? c.parent.toString() : c.parent
      if (!childrenMap[parentId]) childrenMap[parentId] = []
      childrenMap[parentId].push(c)
    }
  })

  const findPath = (catId, cats) => {
    const cat = cats.find(c => c._id === catId)
    if (!cat) return [catId]
    if (!cat.parent) return [cat.id]
    const parentId = typeof cat.parent === 'object' ? cat.parent.toString() : cat.parent
    return [...findPath(parentId, cats), cat.id]
  }

  const handleChange = (level, catId) => {
    const newPath = catId ? findPath(catId, categories) : []
    const leafCat = catId ? categories.find(c => c._id === catId) : null
    onChange(leafCat ? leafCat.id : '', newPath)
    setSelected(prev => {
      const next = [...prev]
      next[level] = catId
      next.length = level + 1
      return next
    })
  }

  const getChildren = (parentId) => {
    if (!parentId) return rootCats
    return childrenMap[parentId] || []
  }

  const levels = []
  for (let i = 0; i <= selected.length; i++) {
    const parentId = i === 0 ? null : selected[i - 1]
    const children = getChildren(parentId)
    if (children.length === 0) break
    levels.push({ children, selectedId: selected[i] || '' })
  }

  return (
    <div className="flex flex-col gap-2">
      {levels.map((level, idx) => (
        <select
          key={idx}
          value={level.selectedId}
          onChange={e => handleChange(idx, e.target.value)}
          className="input-fm"
        >
          <option value="">{idx === 0 ? 'Root category' : `Level ${idx + 1} category`}</option>
          {level.children.map(c => (
            <option key={c._id} value={c._id}>{c.name} ({c.id})</option>
          ))}
        </select>
      ))}
    </div>
  )
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/categories/all')
      setCategories(data.categories)
    } catch {}
  }

  const loadBrands = async () => {
    try {
      const { data } = await api.get('/brands/all')
      setBrands(data.brands)
    } catch {}
  }

  const loadTeams = async () => {
    try {
      const { data } = await api.get('/teams/all')
      setTeams(data.teams)
    } catch {}
  }

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
  useEffect(() => { loadCategories(); loadBrands(); loadTeams() }, [])

  const openNew = () => { setEditing('new'); setForm(empty) }
  const openEdit = (p) => {
    setEditing(p._id)
    setForm({
      ...p,
      price: String(p.price),
      discountPrice: p.discountPrice ? String(p.discountPrice) : '',
      stock: JSON.stringify(Object.fromEntries(Object.entries(p.stock || {}))),
      images: p.images || [],
      categoryPath: p.categoryPath || [],
    })
  }

  const handleUpload = async (files) => {
    if (!files.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      for (const f of files) fd.append('images', f)
      const { data } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm(prev => ({ ...prev, images: [...prev.images, ...data.files] }))
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeImage = (idx) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))
  }

  const handleCategoryChange = (catId, path) => {
    setForm(prev => ({ ...prev, category: catId, categoryPath: path }))
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

  const flatCats = categories

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

      <select value={filter} onChange={e => setFilter(e.target.value)} className="input-fm max-w-xs">
        <option value="">All Categories</option>
        {flatCats.map(c => (
          <option key={c._id} value={c.id}>{c.name} ({c.id})</option>
        ))}
      </select>

      <div className="bg-pitch border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Product</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Image</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Category</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Price</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Stock</th>
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
                  <td className="px-4 py-3">
                    {p.images?.[0] ? (
                      <img src={p.images[0].url} alt={p.name} className="w-12 h-12 object-cover rounded border border-line" />
                    ) : (
                      <div className="w-12 h-12 bg-pitch2 rounded border border-line flex items-center justify-center">
                        <Image size={16} className="text-muted" />
                      </div>
                    )}
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

      {pages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => load(p)} className={`px-3 py-1 text-sm font-head ${p === page ? 'bg-volt text-night' : 'bg-pitch2 text-muted hover:text-chalk'}`}>{p}</button>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-pitch border border-line w-full max-w-2xl mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 className="text-lg font-display tracking-wider text-chalk">
                {editing === 'new' ? 'Add Product' : 'Edit Product'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-chalk"><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-2">Product Images</label>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img.url} alt={img.alt} className="w-20 h-20 object-cover rounded border border-line" />
                      <button type="button" onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-ember text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-line rounded flex flex-col items-center justify-center cursor-pointer hover:border-volt transition-colors">
                    <Upload size={16} className="text-muted" />
                    <span className="text-[9px] text-muted mt-1">{uploading ? '...' : 'Add'}</span>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={e => handleUpload(e.target.files)} />
                  </label>
                </div>
              </div>

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
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Brand</label>
                  <select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="input-fm">
                    <option value="">No brand</option>
                    {brands.map(b => (
                      <option key={b._id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Team</label>
                  <select value={form.team || ''} onChange={e => setForm({ ...form, team: e.target.value || null })} className="input-fm">
                    <option value="">No team</option>
                    {teams.map(t => (
                      <option key={t._id} value={t.slug}>{t.name}</option>
                    ))}
                  </select>
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
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Category (cascading)</label>
                <CategoryPicker value={form.category} categoryPath={form.categoryPath} onChange={handleCategoryChange} categories={flatCats} />
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

              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Size Chart Type</label>
                <select value={form.sizeChartType || ''} onChange={e => setForm({ ...form, sizeChartType: e.target.value || null })} className="input-fm">
                  <option value="">None (default Fan chart)</option>
                  <option value="player_jersey">Player Edition Jersey</option>
                  <option value="fan_jersey">Fan Edition Jersey</option>
                  <option value="retro_jersey">Retro Edition Jersey</option>
                  <option value="boot">Football Boot</option>
                  <option value="accessory">Accessories</option>
                </select>
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
