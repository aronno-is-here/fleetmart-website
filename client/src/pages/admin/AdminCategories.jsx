import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, ChevronRight, ChevronDown, GripVertical, Eye, EyeOff } from 'lucide-react'
import api from '../../lib/api'

const EMPTY = { name: '', blurb: '', autoBlurb: true, image: '', parent: null, displayOrder: 0 }

function CategoryNode({ cat, depth = 0, onEdit, onDelete, onToggleActive, onAddChild, expanded, onToggle }) {
  const hasChildren = cat.children && cat.children.length > 0
  const isExpanded = expanded[cat._id]

  return (
    <div>
      <div className={`flex items-center gap-2 py-2 px-3 border-b border-line hover:bg-pitch2/50 transition-colors`}
        style={{ paddingLeft: `${12 + depth * 24}px` }}>
        <button onClick={() => onToggle(cat._id)} className="text-muted hover:text-chalk w-5">
          {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="block w-[14px]" />}
        </button>
        <GripVertical size={14} className="text-muted/40 cursor-grab" />
        <div className="flex-1 min-w-0">
          <span className="font-head text-sm text-chalk">{cat.name}</span>
          <span className="ml-2 text-xs text-muted font-mono">({cat.id})</span>
          {cat.blurb && <span className="ml-2 text-xs text-muted">— {cat.blurb}</span>}
          {!cat.isActive && <span className="ml-2 text-[10px] font-head uppercase tracking-widest text-ember bg-ember/10 px-1.5 py-0.5">inactive</span>}
        </div>
        <span className="text-xs text-muted">{cat.children?.length || 0} sub</span>
        <button onClick={() => onAddChild(cat._id)} className="text-muted hover:text-volt p-1" title="Add subcategory">
          <Plus size={14} />
        </button>
        <button onClick={() => onToggleActive(cat)} className="text-muted hover:text-volt p-1" title={cat.isActive ? 'Deactivate' : 'Activate'}>
          {cat.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button onClick={() => onEdit(cat)} className="text-muted hover:text-volt p-1"><Pencil size={14} /></button>
        <button onClick={() => onDelete(cat)} className="text-muted hover:text-ember p-1"><Trash2 size={14} /></button>
      </div>
      {hasChildren && isExpanded && cat.children.map(child => (
        <CategoryNode key={child._id} cat={child} depth={depth + 1}
          onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive}
          onAddChild={onAddChild} expanded={expanded} onToggle={onToggle} />
      ))}
    </div>
  )
}

export default function AdminCategories() {
  const [tree, setTree] = useState([])
  const [flat, setFlat] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [filter, setFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [treeRes, flatRes] = await Promise.all([
        api.get('/categories/tree/all'),
        api.get('/categories/all'),
      ])
      setTree(treeRes.data.categories)
      setFlat(flatRes.data.categories)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  const expandAll = () => {
    const all = {}
    const walk = (nodes) => nodes.forEach(n => { all[n._id] = true; if (n.children) walk(n.children) })
    walk(tree)
    setExpanded(all)
  }

  const openNew = (parentId = null) => {
    setEditing('new')
    setForm({ ...EMPTY, parent: parentId })
  }

  const openEdit = (cat) => {
    setEditing(cat._id)
    setForm({
      name: cat.name,
      blurb: cat.blurb || '',
      autoBlurb: cat.autoBlurb !== false,
      image: cat.image || '',
      parent: cat.parent || null,
      displayOrder: cat.displayOrder || 0,
    })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = { ...form }
      if (editing === 'new') {
        await api.post('/categories', body)
      } else {
        await api.put(`/categories/${editing}`, body)
      }
      setEditing(null)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed')
    }
    setSaving(false)
  }

  const handleDelete = async (cat) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/categories/${cat._id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleToggleActive = async (cat) => {
    try {
      await api.put(`/categories/${cat._id}`, { isActive: !cat.isActive })
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed')
    }
  }

  const filteredTree = filter
    ? tree.filter(c => c.id.includes(filter.toLowerCase()) || c.name.toLowerCase().includes(filter.toLowerCase()))
    : tree

  const parentOptions = flat.filter(c => c._id !== editing)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display tracking-wider text-chalk">Categories</h1>
          <p className="text-sm text-muted">{flat.length} categories total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={expandAll} className="btn-ghost !text-xs">Expand All</button>
          <button onClick={() => openNew()} className="btn-volt text-xs">
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Search categories..."
        className="input-fm max-w-xs"
      />

      <div className="bg-pitch border border-line">
        {loading ? (
          <div className="p-8 text-center text-muted">Loading...</div>
        ) : filteredTree.length === 0 ? (
          <div className="p-8 text-center text-muted">No categories found</div>
        ) : (
          filteredTree.map(cat => (
            <CategoryNode key={cat._id} cat={cat} depth={0}
              onEdit={openEdit} onDelete={handleDelete} onToggleActive={handleToggleActive}
              onAddChild={(parentId) => openNew(parentId)}
              expanded={expanded} onToggle={toggleExpand} />
          ))
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-pitch border border-line w-full max-w-lg mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 className="text-lg font-display tracking-wider text-chalk">
                {editing === 'new' ? 'Add Category' : 'Edit Category'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-chalk"><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-fm" />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-chalk">
                  <input type="checkbox" checked={form.autoBlurb} onChange={e => setForm({ ...form, autoBlurb: e.target.checked })} className="accent-volt" />
                  Auto-generate blurb from children
                </label>
              </div>
              {!form.autoBlurb && (
                <div>
                  <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Custom Blurb</label>
                  <input value={form.blurb} onChange={e => setForm({ ...form, blurb: e.target.value })} className="input-fm" placeholder="e.g. Club · National · Retro" />
                </div>
              )}
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Image URL</label>
                <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="input-fm" />
              </div>
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Parent Category</label>
                <select value={form.parent || ''} onChange={e => setForm({ ...form, parent: e.target.value || null })} className="input-fm">
                  <option value="">None (Root Category)</option>
                  {parentOptions.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Display Order</label>
                <input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} className="input-fm" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-line">
                <button type="submit" disabled={saving} className="btn-volt">
                  {saving ? 'Saving...' : 'Save Category'}
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
