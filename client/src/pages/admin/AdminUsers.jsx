import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const load = (p = 1) => {
    setLoading(true)
    api.get('/admin/users', { params: { page: p } }).then(res => {
      setUsers(res.data.users)
      setPages(res.data.pages)
      setPage(p)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin'
    await api.put(`/admin/users/${id}`, { role: newRole })
    load(page)
  }

  const toggleActive = async (id, isActive) => {
    await api.put(`/admin/users/${id}`, { isActive: !isActive })
    load(page)
  }

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/users/${id}`)
      load(page)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display tracking-wider text-chalk">Users</h1>

      <div className="bg-pitch border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">User</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Role</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Status</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Joined</th>
              <th className="px-4 py-3 font-head text-xs uppercase tracking-widest text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-b border-line hover:bg-pitch2/50">
                <td className="px-4 py-3">
                  <div className="font-head text-chalk">{u.name}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-head uppercase px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-volt/20 text-volt' : 'bg-pitch2 text-muted'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-head uppercase px-2 py-0.5 rounded ${u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-ember/20 text-ember'}`}>
                    {u.isActive ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleRole(u._id, u.role)} className="text-xs font-head text-muted hover:text-volt px-2 py-1 bg-pitch2 rounded">
                      {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                    </button>
                    <button onClick={() => toggleActive(u._id, u.isActive)} className="text-xs font-head text-muted hover:text-ember px-2 py-1 bg-pitch2 rounded">
                      {u.isActive ? 'Block' : 'Unblock'}
                    </button>
                    {u.role !== 'admin' && (
                      <button onClick={() => deleteUser(u._id, u.name)} className="text-xs font-head text-ember hover:text-red-400 px-2 py-1 bg-ember/10 rounded">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
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
    </div>
  )
}
