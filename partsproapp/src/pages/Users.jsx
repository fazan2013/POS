
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  IconPlus, IconSearch, IconEdit, IconTrash,
  IconShield, IconRefresh, IconX, IconCheck,
  IconAlertTriangle, IconLock, IconToggleLeft,
  IconToggleRight, IconUser, IconChevronDown
} from '@tabler/icons-react'
import { usersApi, getUser, fmt } from '../services/api'

// ── Constants ─────────────────────────────────────
const ROLES = ['All', 'Administrator', 'Store Manager', 'Cashier', 'Warehouse']

const ROLE_STYLE = {
  Administrator: { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
  'Store Manager':{ bg: 'bg-blue-50',  text: 'text-blue-700',   dot: 'bg-blue-500'   },
  Cashier:       { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  Warehouse:     { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
}

// ── Helpers ───────────────────────────────────────
function Spinner({ size = 'md' }) {
  const s = size === 'sm'
    ? 'w-4 h-4 border border-white/30 border-t-white'
    : 'w-6 h-6 border-2 border-gray-200 border-t-slate-700'
  return <div className={`${s} rounded-full animate-spin flex-shrink-0`} />
}

function RoleBadge({ role }) {
  const s = ROLE_STYLE[role] || { bg:'bg-gray-100', text:'text-gray-600', dot:'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5
                      rounded-full text-[10px] font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {role}
    </span>
  )
}

function Avatar({ fullName, profileImage, size = 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  const initials = (fullName || 'U')
    .split(' ').filter(Boolean).map(n => n[0]).join('').slice(0,2).toUpperCase()

  if (profileImage) {
    return (
      <div className={`${dim} rounded-full overflow-hidden flex-shrink-0`}>
        <img src={profileImage} alt={fullName}
             className="w-full h-full object-cover"
             onError={e => {
               e.currentTarget.parentElement.innerHTML =
                 `<div class="${dim} rounded-full bg-sky-400 flex items-center
                  justify-center font-medium text-slate-900 flex-shrink-0">
                  ${initials}</div>`
             }} />
      </div>
    )
  }

  const colors = {
    Administrator: 'bg-red-400',
    'Store Manager': 'bg-blue-400',
    Cashier: 'bg-green-400',
    Warehouse: 'bg-amber-400',
  }

  return (
    <div className={`${dim} rounded-full flex items-center justify-center
                     font-medium text-white flex-shrink-0
                     ${colors[fullName] || 'bg-slate-400'}`}>
      {initials}
    </div>
  )
}

// ════════════════════════════════════════════════
// USER FORM MODAL — Add / Edit
// ════════════════════════════════════════════════
function UserFormModal({ user, onClose, onSave }) {
  const isEdit = !!user?.id

  // Uncontrolled refs
  const nameRef  = useRef(null)
  const emailRef = useRef(null)
  const passRef  = useRef(null)
  const confRef  = useRef(null)

  const [role,    setRole]    = useState(user?.role || 'Cashier')
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})
  const [showPw,  setShowPw]  = useState(false)

  function clearError(field) {
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }

  async function handleSave() {
    const name  = nameRef.current?.value?.trim()  || ''
    const email = emailRef.current?.value?.trim() || ''
    const pass  = passRef.current?.value          || ''
    const conf  = confRef.current?.value          || ''

    const e = {}
    if (!name)  e.name  = 'Full name is required'
    if (!email) e.email = 'Email is required'
    if (!email.includes('@')) e.email = 'Enter a valid email'
    if (!isEdit) {
      if (pass.length < 8) e.pass = 'Minimum 8 characters'
      if (pass !== conf)   e.conf = 'Passwords do not match'
    }
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try {
      await onSave({
        fullName: name,
        email,
        role,
        ...(isEdit ? {} : { password: pass }),
      })
    } catch (err) {
      setErrors({ name: err.message })
    } finally {
      setSaving(false)
    }
  }

  const inputClass = field =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors
     ${errors[field]
       ? 'border-red-300 focus:border-red-400'
       : 'border-gray-200 focus:border-blue-400'}`

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                    justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md
                      overflow-hidden max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isEdit ? 'Edit user' : 'Add new user'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Editing ${user.fullName}` : 'Create a new system user'}
            </p>
          </div>
          <button onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center border
                             border-gray-200 rounded-lg text-gray-400">
            <IconX size={14} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">

          {/* Full name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase
                              tracking-wider mb-1.5">
              Full name <span className="text-red-400">*</span>
            </label>
            <input
              ref={nameRef}
              key={`name-${user?.id || 'new'}`}
              defaultValue={user?.fullName || ''}
              placeholder="e.g. Kasun Silva"
              onChange={() => clearError('name')}
              className={inputClass('name')}
            />
            {errors.name && (
              <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                <IconAlertTriangle size={10} />{errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase
                              tracking-wider mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              ref={emailRef}
              key={`email-${user?.id || 'new'}`}
              type="email"
              defaultValue={user?.email || ''}
              placeholder="user@partsproapp.com"
              onChange={() => clearError('email')}
              className={inputClass('email')}
            />
            {errors.email && (
              <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                <IconAlertTriangle size={10} />{errors.email}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase
                              tracking-wider mb-1.5">
              Role <span className="text-red-400">*</span>
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                         text-sm focus:outline-none focus:border-blue-400
                         bg-white appearance-none"
            >
              {['Administrator','Store Manager','Cashier','Warehouse'].map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {/* Role description */}
            <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg">
              <p className="text-[10px] text-gray-500">
                {{
                  Administrator:  'Full access to all pages, settings and user management',
                  'Store Manager':'Dashboard, POS, orders, inventory, reports and settings',
                  Cashier:        'POS, orders and customers only',
                  Warehouse:      'Dashboard and inventory management only',
                }[role]}
              </p>
            </div>
          </div>

          {/* Password — only for new users */}
          {!isEdit && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase
                                  tracking-wider mb-1.5">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={passRef}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    onChange={() => clearError('pass')}
                    className={inputClass('pass') + ' pr-10'}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2
                                     text-gray-400 hover:text-gray-600">
                    <IconLock size={14} />
                  </button>
                </div>
                {errors.pass && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <IconAlertTriangle size={10} />{errors.pass}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase
                                  tracking-wider mb-1.5">
                  Confirm password <span className="text-red-400">*</span>
                </label>
                <input
                  ref={confRef}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  onChange={() => clearError('conf')}
                  className={inputClass('conf')}
                />
                {errors.conf && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <IconAlertTriangle size={10} />{errors.conf}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl
                             text-sm text-gray-600 hover:border-gray-300">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl
                             text-sm font-medium hover:bg-slate-700
                             flex items-center justify-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed">
            {saving
              ? <><Spinner size="sm" /> Saving…</>
              : <><IconCheck size={14} />{isEdit ? 'Save changes' : 'Create user'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════
// RESET PASSWORD MODAL
// ════════════════════════════════════════════════
function ResetPasswordModal({ user, onClose, onSave }) {
  const passRef = useRef(null)
  const confRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)
  const [showPw, setShowPw] = useState(false)

  async function handleSave() {
    const pass = passRef.current?.value || ''
    const conf = confRef.current?.value || ''

    if (pass.length < 8) { setError('Minimum 8 characters'); return }
    if (pass !== conf)   { setError('Passwords do not match'); return }

    setSaving(true)
    try {
      await onSave({ newPassword: pass, confirmPassword: conf })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                    justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
           onClick={e => e.stopPropagation()}>

        <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center
                        justify-center mx-auto mb-4">
          <IconLock size={20} className="text-amber-600" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 text-center mb-1">
          Reset password
        </h3>
        <p className="text-xs text-gray-400 text-center mb-5">
          Set a new password for {user.fullName}
        </p>

        <div className="space-y-3">
          <input
            ref={passRef}
            type={showPw ? 'text' : 'password'}
            placeholder="New password (min 8 chars)"
            onChange={() => setError(null)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                       text-sm focus:outline-none focus:border-blue-400"
          />
          <input
            ref={confRef}
            type={showPw ? 'text' : 'password'}
            placeholder="Confirm new password"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            onChange={() => setError(null)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                       text-sm focus:outline-none focus:border-blue-400"
          />
          <label className="flex items-center gap-2 text-xs text-gray-500
                            cursor-pointer select-none">
            <input type="checkbox" checked={showPw}
                   onChange={e => setShowPw(e.target.checked)}
                   className="w-3.5 h-3.5" />
            Show passwords
          </label>
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <IconAlertTriangle size={12} />{error}
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl
                             text-sm text-gray-600">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl
                             text-sm font-medium hover:bg-amber-600
                             flex items-center justify-center gap-2
                             disabled:opacity-50">
            {saving
              ? <><Spinner size="sm" /> Resetting…</>
              : <><IconLock size={14} /> Reset</>}
          </button>
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════
// MAIN USERS PAGE
// ════════════════════════════════════════════════
export default function Users() {
  const currentUser = getUser()

  const [users,        setUsers]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState('All')
  const [activeFilter, setActiveFilter] = useState('all') // all | active | inactive

  const [showForm,     setShowForm]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [resetTarget,  setResetTarget]  = useState(null)
  const [toggling,     setToggling]     = useState(null)
  const [deleting,     setDeleting]     = useState(null)

  const [toast, setToast] = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  // ── Fetch ─────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const isActive = activeFilter === 'all'
        ? undefined
        : activeFilter === 'active'
      const data = await usersApi.getAll(
        roleFilter === 'All' ? '' : roleFilter,
        isActive
      )
      setUsers(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [roleFilter, activeFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ── CRUD ──────────────────────────────────────
  async function handleSaveUser(form) {
    if (editTarget) {
      await usersApi.update(editTarget.id, form)
      showToast('User updated successfully')
    } else {
      await usersApi.create(form)
      showToast('User created successfully')
    }
    setShowForm(false)
    setEditTarget(null)
    fetchUsers()
  }

  async function handleToggle(user) {
    setToggling(user.id)
    try {
      await usersApi.toggle(user.id)
      showToast(
        user.isActive
          ? `${user.fullName} deactivated`
          : `${user.fullName} activated`
      )
      fetchUsers()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setToggling(null)
    }
  }

  async function handleResetPassword(form) {
    await usersApi.resetPassword(resetTarget.id, form)
    showToast(`Password reset for ${resetTarget.fullName}`)
    setResetTarget(null)
  }

  async function handleDelete(user) {
    if (!confirm(
      `Delete ${user.fullName}? This permanently removes the account.`
    )) return

    setDeleting(user.id)
    try {
      await usersApi.delete(user.id)
      showToast(`${user.fullName} deleted`)
      fetchUsers()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeleting(null)
    }
  }

  // ── Local filter by search ────────────────────
  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  // ── Stats ─────────────────────────────────────
  const stats = {
    total:    users.length,
    active:   users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins:   users.filter(u => u.role === 'Administrator').length,
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2
                         px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white
                         ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
          {toast.type === 'error'
            ? <IconAlertTriangle size={15} /> : <IconCheck size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <UserFormModal
          key={editTarget?.id || 'new'}
          user={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={handleSaveUser}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onSave={handleResetPassword}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Users</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage system accounts and role permissions
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers}
                  className="w-8 h-8 flex items-center justify-center border
                             border-gray-200 rounded-lg text-gray-500
                             hover:border-gray-300 bg-white">
            <IconRefresh size={14} />
          </button>
          <button
            onClick={() => { setEditTarget(null); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900
                       text-white rounded-lg text-xs font-medium
                       hover:bg-slate-700">
            <IconPlus size={13} /> Add user
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50
                        border border-red-200 rounded-xl text-sm text-red-700">
          <IconAlertTriangle size={15} className="flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <IconX size={14} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Total users',  value: stats.total,    color:'text-gray-900'   },
          { label:'Active',       value: stats.active,   color:'text-green-600'  },
          { label:'Inactive',     value: stats.inactive, color:'text-red-500'    },
          { label:'Admins',       value: stats.admins,   color:'text-blue-600'   },
        ].map(c => (
          <div key={c.label}
               className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              {c.label}
            </p>
            <p className={`text-2xl font-medium ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-100
                        flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-44">
            <IconSearch size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text"
                   placeholder="Search name or email…"
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="w-full pl-8 pr-3 py-2 border border-gray-200
                              rounded-lg text-xs focus:outline-none
                              focus:border-blue-400 bg-gray-50" />
          </div>

          {/* Role filter */}
          <div className="flex gap-1.5 flex-wrap">
            {ROLES.map(r => (
              <button key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium
                                  transition-all
                        ${roleFilter === r
                          ? 'bg-slate-900 text-white'
                          : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {r}
              </button>
            ))}
          </div>

          {/* Active filter */}
          <div className="flex gap-1.5">
            {['all','active','inactive'].map(f => (
              <button key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium
                                  capitalize transition-all
                        ${activeFilter === f
                          ? 'bg-slate-900 text-white'
                          : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table head */}
        <div className="hidden md:grid
                        grid-cols-[2fr_1.8fr_1.2fr_0.6fr_0.5fr]
                        px-5 py-2.5 bg-gray-50 border-b border-gray-100">
          {['User','Email','Role','Status','Actions'].map(h => (
            <p key={h} className="text-[10px] font-medium text-gray-400
                                  uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center
                          py-16 gap-2 text-gray-400">
            <IconUser size={32} className="text-gray-200" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          filtered.map(user => {
            const isSelf = user.id === currentUser?.id
            return (
              <div key={user.id}
                   className="grid grid-cols-1
                              md:grid-cols-[2fr_1.8fr_1.2fr_0.6fr_0.5fr]
                              px-5 py-4 border-b border-gray-50 last:border-0
                              hover:bg-gray-50 transition-colors items-center
                              gap-2 md:gap-0">

                {/* User */}
                <div className="flex items-center gap-3">
                  <Avatar
                    fullName={user.fullName}
                    profileImage={user.profileImage}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-gray-900">
                        {user.fullName}
                      </p>
                      {isSelf && (
                        <span className="text-[9px] bg-blue-100 text-blue-700
                                         px-1.5 py-0.5 rounded-full font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      ID #{user.id} · Joined{' '}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <p className="text-xs text-gray-600 truncate">{user.email}</p>

                {/* Role */}
                <RoleBadge role={user.role} />

                {/* Status */}
                <div>
                  <span className={`inline-flex items-center gap-1 text-[10px]
                                    font-medium px-2 py-0.5 rounded-full
                    ${user.isActive
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full
                      ${user.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">

                  {/* Edit */}
                  <button
                    onClick={() => { setEditTarget(user); setShowForm(true) }}
                    title="Edit user"
                    className="w-7 h-7 flex items-center justify-center border
                               border-gray-200 rounded-lg text-gray-400
                               hover:border-blue-300 hover:text-blue-500
                               transition-colors">
                    <IconEdit size={13} />
                  </button>

                  {/* Reset password */}
                  <button
                    onClick={() => setResetTarget(user)}
                    title="Reset password"
                    className="w-7 h-7 flex items-center justify-center border
                               border-gray-200 rounded-lg text-gray-400
                               hover:border-amber-300 hover:text-amber-500
                               transition-colors">
                    <IconLock size={13} />
                  </button>

                  {/* Toggle active */}
                  {!isSelf && (
                    <button
                      onClick={() => handleToggle(user)}
                      disabled={toggling === user.id}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                      className={`w-7 h-7 flex items-center justify-center border
                                  rounded-lg transition-colors disabled:opacity-50
                        ${user.isActive
                          ? 'border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-500'
                          : 'border-gray-200 text-gray-400 hover:border-green-300 hover:text-green-500'}`}>
                      {toggling === user.id
                        ? <Spinner size="sm" />
                        : user.isActive
                          ? <IconToggleRight size={13} />
                          : <IconToggleLeft size={13} />}
                    </button>
                  )}

                  {/* Delete */}
                  {!isSelf && (
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={deleting === user.id}
                      title="Delete user"
                      className="w-7 h-7 flex items-center justify-center border
                                 border-gray-200 rounded-lg text-gray-400
                                 hover:border-red-300 hover:text-red-500
                                 transition-colors disabled:opacity-50">
                      {deleting === user.id
                        ? <Spinner size="sm" />
                        : <IconTrash size={13} />}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {filtered.length} of {users.length} users
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 px-4 py-3 bg-blue-50
                      border border-blue-100 rounded-xl">
        <IconShield size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-600 leading-relaxed">
          Only Administrators can access this screen.
          Deactivated users cannot log in but their data is preserved.
          You cannot deactivate or delete your own account.
        </p>
      </div>
    </div>
  )
}