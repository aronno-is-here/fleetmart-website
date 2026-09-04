import { useEffect, useState, useRef } from 'react'
import { Plus, Pencil, Trash2, X, Upload, ExternalLink, GripVertical, Eye, EyeOff } from 'lucide-react'
import api from '../../lib/api'

const EMPTY = { imageUrl: '', targetUrl: '/shop', title: '', displayOrder: 0, isActive: true }

export default function AdminBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/banners/all')
      setBanners(data.banners)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing('new'); setForm(EMPTY) }
  const openEdit = (b) => {
    setEditing(b._id)
    setForm({ imageUrl: b.imageUrl, targetUrl: b.targetUrl, title: b.title || '', displayOrder: b.displayOrder || 0, isActive: b.isActive })
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
      if (data.files?.[0]) setForm(prev => ({ ...prev, imageUrl: data.files[0].url }))
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.imageUrl) { alert('Please upload an image first'); return }
    setSaving(true)
    try {
      if (editing === 'new') {
        await api.post('/banners', form)
      } else {
        await api.put(`/banners/${editing}`, form)
      }
      setEditing(null)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed')
    }
    setSaving(false)
  }

  const handleDelete = async (b) => {
    if (!confirm('Delete this banner?')) return
    try {
      await api.delete(`/banners/${b._id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleToggleActive = async (b) => {
    try {
      await api.put(`/banners/${b._id}`, { isActive: !b.isActive })
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed')
    }
  }

  const handleReorder = async (id, direction) => {
    const idx = banners.findIndex(b => b._id === id)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= banners.length) return
    const items = banners.map((b, i) => ({ id: b._id, displayOrder: i === idx ? swapIdx : i === swapIdx ? idx : i }))
    try {
      await api.put('/banners/reorder/bulk', { items })
      load()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display tracking-wider text-chalk">Hero Banners</h1>
          <p className="text-sm text-muted">{banners.length} banners total</p>
        </div>
        <button onClick={openNew} className="btn-volt text-xs">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="text-center text-muted py-12">Loading...</div>
      ) : banners.length === 0 ? (
        <div className="text-center border border-dashed border-line py-12">
          <p className="text-muted">No banners yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, i) => (
            <div key={b._id} className={`flex items-center gap-4 p-4 border border-line bg-pitch ${!b.isActive ? 'opacity-50' : ''}`}>
              <div className="flex flex-col gap-1">
                <button onClick={() => handleReorder(b._id, 'up')} disabled={i === 0} className="text-muted hover:text-chalk disabled:opacity-20"><GripVertical size={14} /></button>
              </div>
              {b.imageUrl ? (
                <img src={b.imageUrl} alt={b.title} className="w-32 h-16 object-cover rounded border border-line" />
              ) : (
                <div className="w-32 h-16 bg-pitch2 rounded border border-line flex items-center justify-center text-xs text-muted">No Image</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-head text-sm text-chalk truncate">{b.title || '(no title)'}</p>
                <p className="text-xs text-muted truncate flex items-center gap-1">
                  <ExternalLink size={10} /> {b.targetUrl}
                </p>
              </div>
              <span className="text-xs text-muted">#{b.displayOrder}</span>
              <button onClick={() => handleToggleActive(b)} className="text-muted hover:text-volt p-1" title={b.isActive ? 'Deactivate' : 'Activate'}>
                {b.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button onClick={() => openEdit(b)} className="text-muted hover:text-volt p-1"><Pencil size={14} /></button>
              <button onClick={() => handleDelete(b)} className="text-muted hover:text-ember p-1"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-pitch border border-line w-full max-w-lg mx-4 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 className="text-lg font-display tracking-wider text-chalk">
                {editing === 'new' ? 'Add Banner' : 'Edit Banner'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-muted hover:text-chalk"><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-2">Banner Image</label>
                {form.imageUrl && (
                  <div className="relative inline-block mb-3">
                    <img src={form.imageUrl} alt="Preview" className="w-full max-w-md h-40 object-cover rounded border border-line" />
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                      className="absolute -top-2 -right-2 bg-ember text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      <X size={12} />
                    </button>
                  </div>
                )}
                <label className="flex items-center gap-2 btn-ghost !text-xs cursor-pointer w-fit">
                  <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Image'}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files)} />
                </label>
              </div>
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Title (optional)</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-fm" placeholder="e.g. Arsenal Banner" />
              </div>
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Target URL</label>
                <input value={form.targetUrl} onChange={e => setForm({ ...form, targetUrl: e.target.value })} required className="input-fm" placeholder="/catalog?team=arsenal" />
              </div>
              <div>
                <label className="block text-xs font-head text-muted uppercase tracking-widest mb-1">Display Order</label>
                <input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} className="input-fm" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-line">
                <button type="submit" disabled={saving} className="btn-volt">
                  {saving ? 'Saving...' : 'Save Banner'}
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
