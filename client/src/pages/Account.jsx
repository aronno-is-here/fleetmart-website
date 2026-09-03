import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useState, useEffect, useRef } from 'react'
import { User, Package, MapPin, Heart, LogOut, Check, Truck, Home, CreditCard, Plus, Trash2, Save, Camera, Star, MessageSquare, BadgeCheck } from 'lucide-react'
import { fmt } from '../lib/format'
import { toast } from '../features/uiSlice'
import { setCredentials, logout as authLogout, updateUser } from '../features/authSlice'
import api from '../lib/api'

const TABS = [
  { id: 'profile', label: 'Profile', icon: <User size={16} /> },
  { id: 'orders', label: 'Orders', icon: <Package size={16} /> },
  { id: 'reviews', label: 'My Reviews', icon: <MessageSquare size={16} /> },
  { id: 'addresses', label: 'Addresses', icon: <MapPin size={16} /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard size={16} /> },
  { id: 'wishlist', label: 'Wishlist', icon: <Heart size={16} /> },
]

const ORDER_STAGES = ['processing', 'confirmed', 'shipped', 'delivered']

export default function Account() {
  const { tab = 'profile' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const wishCount = useSelector((s) => s.wishlist.length)
  const { user: authUser, token } = useSelector((s) => s.auth)

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [myReviews, setMyReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  const fetchUser = async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
      dispatch(updateUser(data.user))
    } catch {
      dispatch(authLogout())
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const { data } = await api.get('/orders/my')
      setOrders(data.orders || data || [])
    } catch {
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const fetchMyReviews = async () => {
    setReviewsLoading(true)
    try {
      const { data } = await api.get('/reviews/my')
      setMyReviews(data.reviews || [])
    } catch {
      setMyReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (tab === 'orders' && token) fetchOrders()
    if (tab === 'reviews' && token) fetchMyReviews()
  }, [tab, token])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    dispatch(authLogout())
    navigate('/')
  }

  if (loading) {
    return (
      <div className="container-fm py-24 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-volt border-t-transparent" />
      </div>
    )
  }

  if (!token || !authUser) {
    return (
      <div className="container-fm grid place-items-center py-24 text-center">
        <p className="font-display text-5xl uppercase tracking-wide text-chalk">Subbed off.</p>
        <Link to="/login" className="btn-volt mt-6 !text-xs">Log back in</Link>
      </div>
    )
  }

  const activeTab = tab || 'profile'

  return (
    <div className="container-fm py-10">
      <p className="eyebrow mb-2">Squad member</p>
      <h1 className="font-display text-5xl uppercase tracking-wide text-chalk">My Account</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit border border-line bg-pitch lg:sticky lg:top-32">
          <nav className="flex overflow-x-auto lg:flex-col">
            {TABS.map((t) => {
              const to = t.id === 'wishlist' ? '/account/wishlist' : `/account/${t.id}`
              const active = t.id === 'wishlist' ? location.pathname === '/account/wishlist' : activeTab === t.id && location.pathname !== '/account/wishlist'
              return (
                <Link key={t.id} to={to} className={`flex shrink-0 items-center gap-3 border-b border-line px-5 py-4 font-head text-sm font-semibold uppercase tracking-widest transition-colors lg:border-b ${active ? 'bg-volt/10 text-volt' : 'text-muted hover:text-chalk'}`}>
                  {t.icon}{t.label}
                  {t.id === 'wishlist' && wishCount > 0 && <span className="ml-auto bg-ember px-1.5 text-[10px] font-bold text-white">{wishCount}</span>}
                </Link>
              )
            })}
            <button onClick={handleLogout} className="flex items-center gap-3 px-5 py-4 font-head text-sm font-semibold uppercase tracking-widest text-muted transition-colors hover:text-ember">
              <LogOut size={16} /> Log out
            </button>
          </nav>
        </aside>

        <div>
          {activeTab === 'profile' && location.pathname !== '/account/wishlist' && (
            <ProfileTab user={user} setUser={setUser} dispatch={dispatch} />
          )}
          {activeTab === 'orders' && location.pathname !== '/account/wishlist' && (
            <OrdersTab orders={orders} loading={ordersLoading} />
          )}
          {activeTab === 'reviews' && location.pathname !== '/account/wishlist' && (
            <MyReviewsTab reviews={myReviews} loading={reviewsLoading} />
          )}
          {activeTab === 'addresses' && (
            <AddressesTab user={user} setUser={setUser} dispatch={dispatch} />
          )}
          {activeTab === 'billing' && (
            <BillingTab user={user} setUser={setUser} dispatch={dispatch} />
          )}
          {(activeTab === 'wishlist' || location.pathname === '/account/wishlist') && <WishlistInline />}
        </div>
      </div>
    </div>
  )
}

function ProfileTab({ user, setUser, dispatch }) {
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
  })
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [changingPass, setChangingPass] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      dispatch(toast({ type: 'error', message: 'Image must be under 5MB' }))
      return
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      dispatch(toast({ type: 'error', message: 'Only JPG, PNG, or WebP images allowed' }))
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('images', file)
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const avatarUrl = data.files?.[0]?.url
      if (avatarUrl) {
        const { data: profileData } = await api.put('/auth/profile', { avatar: avatarUrl })
        setUser(profileData.user)
        dispatch(updateUser(profileData.user))
        dispatch(toast({ type: 'success', message: 'Profile image updated!' }))
      }
    } catch (err) {
      dispatch(toast({ type: 'error', message: err.response?.data?.message || 'Upload failed' }))
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/auth/profile', {
        name: form.name,
        phone: form.phone,
      })
      setUser(data.user)
      dispatch(updateUser(data.user))
      dispatch(toast({ type: 'success', message: 'Profile updated!' }))
    } catch (err) {
      dispatch(toast({ type: 'error', message: err.response?.data?.message || 'Update failed' }))
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (passwords.newPass !== passwords.confirm) {
      dispatch(toast({ type: 'error', message: 'Passwords do not match' }))
      return
    }
    if (passwords.newPass.length < 6) {
      dispatch(toast({ type: 'error', message: 'Password must be at least 6 characters' }))
      return
    }
    setChangingPass(true)
    try {
      await api.put('/auth/password', { currentPassword: passwords.current, newPassword: passwords.newPass })
      dispatch(toast({ type: 'success', message: 'Password changed!' }))
      setPasswords({ current: '', newPass: '', confirm: '' })
    } catch (err) {
      dispatch(toast({ type: 'error', message: err.response?.data?.message || 'Failed to change password' }))
    } finally {
      setChangingPass(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="border border-line bg-pitch p-6">
        <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">Personal Info</p>
        <div className="mt-4 flex flex-col items-center gap-4">
          <div className="relative group">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full object-cover border-2 border-line" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-pitch2 border-2 border-line grid place-items-center">
                <User size={36} className="text-muted" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center"
            >
              <Camera size={20} className="text-chalk" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
          </div>
          {uploading && <p className="text-xs text-muted">Uploading...</p>}
          <div className="w-full space-y-4">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-fm" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Email</label>
              <input value={form.email} disabled className="input-fm opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" className="input-fm" />
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn-volt !py-2.5 !text-xs">
              <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-line bg-pitch p-6">
          <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">Account Stats</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[[user.role === 'admin' ? 'Admin' : 'Member', 'Role'], ['Active', 'Status'], [new Date(user.createdAt).toLocaleDateString(), 'Joined']].map(([v, l]) => (
              <div key={l} className="border border-line bg-night p-3">
                <p className="font-display text-lg text-volt">{v}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-line bg-pitch p-6">
          <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">Change Password</p>
          <div className="mt-4 space-y-3">
            <input type="password" placeholder="Current password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="input-fm" />
            <input type="password" placeholder="New password (min 6 chars)" value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })} className="input-fm" />
            <input type="password" placeholder="Confirm new password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="input-fm" />
            <button onClick={changePassword} disabled={changingPass || !passwords.current || !passwords.newPass} className="btn-ghost !py-2.5 !text-xs">
              {changingPass ? 'Changing…' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrdersTab({ orders, loading }) {
  if (loading) {
    return <div className="py-12 text-center text-muted">Loading orders…</div>
  }

  if (orders.length === 0) {
    return (
      <div className="border border-line bg-pitch p-12 text-center">
        <p className="font-display text-4xl uppercase tracking-wide text-muted">No orders yet</p>
        <Link to="/shop" className="btn-volt mt-5 !text-xs">Start Shopping</Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => {
        const stage = ORDER_STAGES.indexOf(o.status) >= 0 ? ORDER_STAGES.indexOf(o.status) : 0
        return (
          <div key={o.orderId || o._id} className="border border-line bg-pitch p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-head text-lg font-semibold uppercase tracking-wide text-chalk">#{o.orderId || o._id}</p>
                <p className="text-xs text-muted">Placed {new Date(o.createdAt).toLocaleDateString()} · {o.items?.length || 0} items</p>
              </div>
              <p className="font-head text-xl font-semibold text-volt">{fmt(o.totals?.grand || o.total || 0)}</p>
            </div>
            <div className="mt-6 flex items-center">
              {ORDER_STAGES.map((s, i) => (
                <div key={s} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className={`grid h-8 w-8 place-items-center rounded-full border-2 ${i < stage ? 'border-volt bg-volt text-night' : i === stage ? 'border-volt text-volt' : 'border-line text-muted'}`}>
                      {i < stage ? <Check size={14} /> : i === stage ? <Truck size={14} /> : <Home size={12} />}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-widest ${i <= stage ? 'text-volt' : 'text-muted'}`}>{s}</span>
                  </div>
                  {i < ORDER_STAGES.length - 1 && <span className={`mx-1 h-0.5 flex-1 ${i < stage ? 'bg-volt' : 'bg-line'}`} />}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MyReviewsTab({ reviews, loading }) {
  if (loading) {
    return <div className="py-12 text-center text-muted">Loading reviews…</div>
  }

  if (reviews.length === 0) {
    return (
      <div className="border border-line bg-pitch p-12 text-center">
        <p className="font-display text-4xl uppercase tracking-wide text-muted">No reviews yet</p>
        <p className="mt-2 text-sm text-muted">After your orders are delivered, you can review the products you purchased.</p>
        <Link to="/shop" className="btn-volt mt-5 !text-xs">Browse Products</Link>
      </div>
    )
  }

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

  return (
    <div className="space-y-4">
      <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">My Reviews ({reviews.length})</p>
      {reviews.map((r) => (
        <div key={r._id} className="border border-line bg-pitch p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {r.product?.images?.[0]?.url ? (
                <img src={r.product.images[0].url} alt={r.product?.name} className="h-14 w-14 object-cover border border-line" />
              ) : (
                <div className="h-14 w-14 bg-pitch2 border border-line grid place-items-center text-muted text-xs">No img</div>
              )}
              <div>
                <Link to={`/product/${r.product?.slug}`} className="font-head text-sm font-semibold uppercase tracking-wide text-chalk hover:text-volt transition-colors">
                  {r.product?.name || 'Product'}
                </Link>
                <p className="mt-0.5 text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gold text-sm">{stars(r.rating)}</span>
              <span className={`text-[10px] font-head uppercase px-2 py-0.5 ${r.isVisible ? 'bg-green-500/20 text-green-400' : 'bg-ember/20 text-ember'}`}>
                {r.isVisible ? 'Published' : 'Hidden'}
              </span>
            </div>
          </div>
          {r.comment && (
            <p className="mt-3 text-sm leading-relaxed text-muted border-t border-line pt-3">{r.comment}</p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-muted">
            <span className="font-head uppercase tracking-widest">{r.reviewerName}</span>
            {r.verifiedPurchase && (
              <span className="flex items-center gap-1 text-azure"><BadgeCheck size={12} /> Verified Purchase</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AddressesTab({ user, setUser, dispatch }) {
  const [addresses, setAddresses] = useState(user.addresses || [])
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const empty = { label: 'Home', street: '', city: 'Dhaka', zip: '', country: 'Bangladesh', phone: '', isDefault: false }

  const saveAddresses = async (addrs) => {
    setSaving(true)
    try {
      const { data } = await api.put('/auth/addresses', { addresses: addrs })
      setUser(data.user)
      dispatch(updateUser(data.user))
      dispatch(toast({ type: 'success', message: 'Addresses updated!' }))
    } catch (err) {
      dispatch(toast({ type: 'error', message: err.response?.data?.message || 'Update failed' }))
    } finally {
      setSaving(false)
    }
  }

  const addAddress = () => {
    const updated = [...addresses, { ...empty }]
    setAddresses(updated)
    setEditing(updated.length - 1)
  }

  const removeAddress = (idx) => {
    const updated = addresses.filter((_, i) => i !== idx)
    setAddresses(updated)
    saveAddresses(updated)
  }

  const setDefault = (idx) => {
    const updated = addresses.map((a, i) => ({ ...a, isDefault: i === idx }))
    setAddresses(updated)
    saveAddresses(updated)
  }

  const saveOne = (idx, addr) => {
    const updated = [...addresses]
    updated[idx] = addr
    setAddresses(updated)
    setEditing(null)
    saveAddresses(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">Saved Addresses</p>
        <button onClick={addAddress} className="btn-ghost !py-2 !text-[11px]"><Plus size={14} /> Add Address</button>
      </div>

      {addresses.length === 0 && editing === null && (
        <div className="border border-dashed border-line p-8 text-center text-sm text-muted">
          No addresses saved yet. Add one for faster checkout.
        </div>
      )}

      {addresses.map((addr, idx) => (
        <div key={idx} className="border border-line bg-pitch p-5">
          {editing === idx ? (
            <AddressForm
              addr={addr}
              onSave={(a) => saveOne(idx, a)}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <p className="flex items-center gap-2 font-head text-sm font-semibold uppercase tracking-widest text-chalk">
                  {addr.label || 'Address'} {addr.isDefault && <span className="bg-volt px-2 py-0.5 text-[10px] text-night">Default</span>}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {addr.street}<br />{addr.city} {addr.zip} · {addr.country}
                  {addr.phone && <><br />{addr.phone}</>}
                </p>
              </div>
              <div className="flex gap-2">
                {!addr.isDefault && (
                  <button onClick={() => setDefault(idx)} className="text-[10px] uppercase tracking-widest text-volt hover:underline">Set default</button>
                )}
                <button onClick={() => setEditing(idx)} className="text-[10px] uppercase tracking-widest text-muted hover:text-chalk">Edit</button>
                <button onClick={() => removeAddress(idx)} className="text-ember"><Trash2 size={14} /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AddressForm({ addr, onSave, onCancel }) {
  const [form, setForm] = useState({ ...addr })
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input placeholder="Label (Home, Office…)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input-fm" />
      <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-fm" />
      <input placeholder="Street / House / Road" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="input-fm sm:col-span-2" />
      <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-fm">
        {['Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Rajshahi', 'Barishal', 'Rangpur', 'Mymensingh'].map((c) => <option key={c}>{c}</option>)}
      </select>
      <input placeholder="Area / Post code" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="input-fm" />
      <div className="sm:col-span-2 flex gap-2">
        <button onClick={() => onSave(form)} className="btn-volt !py-2 !text-[11px]"><Save size={12} /> Save</button>
        <button onClick={onCancel} className="btn-ghost !py-2 !text-[11px]">Cancel</button>
      </div>
    </div>
  )
}

function BillingTab({ user, setUser, dispatch }) {
  const [form, setForm] = useState(user.billing || { name: '', email: '', phone: '', taxId: '' })
  const [saving, setSaving] = useState(false)

  const saveBilling = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/auth/billing', { billing: form })
      setUser(data.user)
      dispatch(updateUser(data.user))
      dispatch(toast({ type: 'success', message: 'Billing info updated!' }))
    } catch (err) {
      dispatch(toast({ type: 'error', message: err.response?.data?.message || 'Update failed' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-line bg-pitch p-6 max-w-lg">
      <p className="font-head text-sm font-semibold uppercase tracking-widest text-chalk">Billing Details</p>
      <p className="mt-1 mb-4 text-xs text-muted">Used for invoices and payment receipts.</p>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Billing Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name on invoice" className="input-fm" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Billing Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email for invoices" className="input-fm" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" className="input-fm" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Tax ID / BIN</label>
          <input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="Optional" className="input-fm" />
        </div>
        <button onClick={saveBilling} disabled={saving} className="btn-volt !py-2.5 !text-xs">
          <Save size={14} /> {saving ? 'Saving…' : 'Save Billing Info'}
        </button>
      </div>
    </div>
  )
}

function WishlistInline() {
  const navigate = useNavigate()
  return (
    <div className="border border-line bg-pitch p-8 text-center">
      <p className="font-display text-4xl uppercase tracking-wide text-muted">Wishlist moved to its own page</p>
      <button onClick={() => navigate('/account/wishlist')} className="btn-volt mt-5 !text-xs">Open Wishlist</button>
    </div>
  )
}
