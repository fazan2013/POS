 
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  IconSearch, IconPlus, IconDownload, IconEdit,
  IconTrash, IconX, IconCheck, IconPhone, IconMail,
  IconMapPin, IconChevronLeft, IconChevronRight,
  IconAlertTriangle, IconEye, IconUser,
  IconStar, IconRefresh, IconShoppingCart, IconCash
} from '@tabler/icons-react'
import { customersApi,fmt } from '../services/api'


// ── Constants ─────────────────────────────────────
const TYPES     = ['All', 'Regular', 'VIP', 'Workshop']
const STATUSES  = ['All', 'Active', 'Inactive']
const PAGE_SIZE = 10

// ── Helpers ───────────────────────────────────────
function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border' : 'w-6 h-6 border-2'
  return <div className={`${s} border-gray-200 border-t-slate-700 rounded-full animate-spin flex-shrink-0`} />
}



function Avatar({ name }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const colors   = ['bg-blue-500','bg-purple-500','bg-green-500','bg-amber-500','bg-rose-500']
  const color    = colors[(name?.charCodeAt(0) ?? 0) % colors.length]
  return (
    <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center
                     text-xs font-medium text-white flex-shrink-0`}>
      {initials}
    </div>
  )
}

// ── TYPE badge ────────────────────────────────────
const TYPE_STYLES = {
  VIP:      'bg-amber-50 text-amber-700',
  Workshop: 'bg-blue-50 text-blue-700',
  Regular:  'bg-gray-100 text-gray-600',
}

// ════════════════════════════════════════════════
// CUSTOMER FORM MODAL
// KEY FIX: useRef + defaultValue for text inputs
// Dropdowns use state (no focus loss risk)
// ════════════════════════════════════════════════
function CustomerModal({ customer, onClose, onSave }) {
  const isEdit = !!customer?.id

  // ── Refs for ALL text inputs ──────────────────
  const nameRef    = useRef(null)
  const phoneRef   = useRef(null)
  const emailRef   = useRef(null)
  const addressRef = useRef(null)
  const notesRef   = useRef(null)

  // ── State only for dropdowns (no focus issue) ─
  const [type,   setType]   = useState(customer?.type   || 'Regular')
  const [status, setStatus] = useState(customer?.status || 'Active')

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  function clearError(field) {
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }

  async function handleSave() {
    // Read values from DOM refs
    const name    = nameRef.current?.value?.trim()    || ''
    const phone   = phoneRef.current?.value?.trim()   || ''
    const email   = emailRef.current?.value?.trim()   || ''
    const address = addressRef.current?.value?.trim() || ''
    const notes   = notesRef.current?.value?.trim()   || ''

    // Validate
    const e = {}
    if (!name)  e.name  = 'Customer name is required'
    if (!phone) e.phone = 'Phone number is required'
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try {
      await onSave({ name, phone, email, address, type, status, notes })
    } catch (err) {
      setErrors({ name: err.message })
    } finally {
      setSaving(false)
    }
  }

  // ── Input class helper ────────────────────────
  const inputClass = (field) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors
     ${errors[field]
       ? 'border-red-300 focus:border-red-400'
       : 'border-gray-200 focus:border-blue-400'}`

  function Field({ label, required, error, children }) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500
                          uppercase tracking-wider mb-1.5">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
        {error && (
          <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
            <IconAlertTriangle size={10} />{error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                    justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md
                      max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isEdit ? 'Edit customer' : 'Add customer'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Editing ID #${customer.id}` : 'Fill in customer details'}
            </p>
          </div>
          <button onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center
                             border border-gray-200 rounded-lg text-gray-400
                             hover:border-gray-300">
            <IconX size={14} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">

          {/* Name — uncontrolled ref */}
          <Field label="Full name" required error={errors.name}>
            <input
              ref={nameRef}
              key={`name-${customer?.id || 'new'}`}
              defaultValue={customer?.name || ''}
              placeholder="e.g. Kasun Perera"
              onChange={() => clearError('name')}
              className={inputClass('name')}
            />
          </Field>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" required error={errors.phone}>
              <input
                ref={phoneRef}
                key={`phone-${customer?.id || 'new'}`}
                defaultValue={customer?.phone || ''}
                placeholder="+94 77 123 4567"
                onChange={() => clearError('phone')}
                className={inputClass('phone')}
              />
            </Field>
            <Field label="Email">
              <input
                ref={emailRef}
                key={`email-${customer?.id || 'new'}`}
                type="email"
                defaultValue={customer?.email || ''}
                placeholder="customer@gmail.com"
                className={inputClass('')}
              />
            </Field>
          </div>

          {/* Address — uncontrolled ref */}
          <Field label="Address">
            <input
              ref={addressRef}
              key={`address-${customer?.id || 'new'}`}
              defaultValue={customer?.address || ''}
              placeholder="Street, City"
              className={inputClass('')}
            />
          </Field>

          {/* Type + Status — state (dropdowns ok) */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                           text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                {['Regular', 'VIP', 'Workshop'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                           text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                {['Active', 'Inactive'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Notes — uncontrolled ref */}
          <Field label="Notes">
            <textarea
              ref={notesRef}
              key={`notes-${customer?.id || 'new'}`}
              defaultValue={customer?.notes || ''}
              rows={2}
              placeholder="Any notes about this customer…"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                         text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </Field>
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
            {saving ? <><Spinner size="sm" /> Saving…</> : <><IconCheck size={14} />{isEdit ? 'Save changes' : 'Add customer'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Customer Detail Modal ─────────────────────────
function DetailModal({ customer, onClose, onEdit }) {
  if (!customer) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                    justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md
                      overflow-hidden"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-slate-900 px-6 py-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-400 flex items-center
                              justify-center text-sm font-medium text-slate-900">
                {customer.name?.charAt(0)}
              </div>
              <div>
                <p className="text-base font-medium text-white">{customer.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">ID #{customer.id}</p>
              </div>
            </div>
            <button onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center
                               rounded-lg bg-white/10 text-white hover:bg-white/20">
              <IconX size={14} />
            </button>
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
            ${TYPE_STYLES[customer.type] || 'bg-gray-100 text-gray-600'}`}>
            {customer.type}
          </span>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Contact info */}
          <div className="space-y-2.5">
            {[
              { icon: <IconPhone size={14} />,  text: customer.phone              },
              { icon: <IconMail size={14} />,   text: customer.email    || '—'   },
              { icon: <IconMapPin size={14} />, text: customer.address  || '—'   },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-gray-400">{r.icon}</span>
                <span className="text-sm text-gray-700">{r.text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Orders', value: customer.totalOrders,        icon: <IconShoppingCart size={14} /> },
              { label: 'Spent',  value: fmt(customer.totalSpent),    icon: <IconCash size={14} />         },
              { label: 'Points', value: customer.loyaltyPoints,      icon: <IconStar size={14} />         },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-gray-400 flex justify-center mb-1">{s.icon}</div>
                <p className="text-sm font-medium text-gray-900">{s.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="space-y-2">
            {[
              { label: 'Status',       value: customer.status,
                color: customer.status === 'Active' ? 'text-green-600' : 'text-red-500' },
              { label: 'Member since', value: new Date(customer.joinDate).toLocaleDateString(),  color: 'text-gray-800' },
              { label: 'Last visit',   value: new Date(customer.lastVisit).toLocaleDateString(), color: 'text-gray-800' },
            ].map(d => (
              <div key={d.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{d.label}</span>
                <span className={`text-xs font-medium ${d.color}`}>{d.value}</span>
              </div>
            ))}
          </div>

          {customer.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-xs text-gray-700 leading-relaxed">{customer.notes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl
                             text-sm text-gray-600 hover:border-gray-300">
            Close
          </button>
          <button onClick={() => { onClose(); onEdit(customer) }}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl
                             text-sm font-medium hover:bg-slate-700
                             flex items-center justify-center gap-2">
            <IconEdit size={14} /> Edit
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete modal ──────────────────────────────────
function DeleteModal({ customer, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center
                        justify-center mx-auto mb-4">
          <IconTrash size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-medium text-gray-900 text-center mb-2">
          Remove customer?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          <span className="font-medium text-gray-800">{customer?.name}</span> will
          be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl
                             text-sm text-gray-600 hover:border-gray-300">
            Cancel
          </button>
          <button onClick={onConfirm}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl
                             text-sm font-medium hover:bg-red-600">
            Yes, remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null
  return (
    <div className="fixed top-5 right-5 z-[60] bg-green-600 text-white text-xs
                    px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
      <IconCheck size={14} />{msg}
    </div>
  )
}

// ════════════════════════════════════════════════
// MAIN CUSTOMERS PAGE
// ════════════════════════════════════════════════
export default function Customers() {
  const [data,         setData]         = useState({ data: [], totalCount: 0, totalPages: 1 })
  const [stats,        setStats]        = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [activeType,   setActiveType]   = useState('All')
  const [activeStatus, setActiveStatus] = useState('All')
  const [page,         setPage]         = useState(1)
  const [showForm,     setShowForm]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [viewTarget,   setViewTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [toast,        setToast]        = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Fetch ─────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [res, st] = await Promise.all([
        customersApi.getAll(
          page, PAGE_SIZE, search,
          activeType   === 'All' ? '' : activeType,
          activeStatus === 'All' ? '' : activeStatus
        ),
        customersApi.getStats(),
      ])
      setData(res)
      setStats(st)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, activeType, activeStatus])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])
  useEffect(() => { setPage(1) }, [search, activeType, activeStatus])

  // ── CRUD ──────────────────────────────────────
  async function handleSave(form) {
    if (editTarget) {
      await customersApi.update(editTarget.id, form)
      showToast('Customer updated successfully')
    } else {
      await customersApi.create(form)
      showToast('Customer added successfully')
    }
    setShowForm(false)
    setEditTarget(null)
    fetchCustomers()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await customersApi.delete(deleteTarget.id)
      showToast('Customer removed')
      setDeleteTarget(null)
      fetchCustomers()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  function openAdd() {
    setEditTarget(null)
    setShowForm(true)
  }

  function openEdit(customer) {
    setEditTarget(customer)
    setShowForm(true)
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      <Toast msg={toast} />

      {/* Modal — key prop forces fresh mount each open */}
      {showForm && (
        <CustomerModal
          key={editTarget?.id || 'new'}
          customer={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={handleSave}
        />
      )}

      {viewTarget && (
        <DetailModal
          customer={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={c => { setViewTarget(null); openEdit(c) }}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          customer={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Customers</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage your customer base</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCustomers}
                  className="w-8 h-8 flex items-center justify-center border
                             border-gray-200 rounded-lg text-gray-500
                             hover:border-gray-300 bg-white">
            <IconRefresh size={14} />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border
                             border-gray-200 rounded-lg text-xs bg-white
                             text-gray-600 hover:border-gray-300">
            <IconDownload size={13} /> Export
          </button>
          <button onClick={openAdd}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900
                             text-white rounded-lg text-xs font-medium
                             hover:bg-slate-700">
            <IconPlus size={13} /> Add customer
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
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total',    value: stats.total,              color: 'text-gray-900'   },
            { label: 'Active',   value: stats.active,             color: 'text-green-600'  },
            { label: 'VIP',      value: stats.vip,                color: 'text-amber-600'  },
            { label: 'Workshop', value: stats.workshop,           color: 'text-blue-600'   },
            { label: 'Revenue',  value: fmt(stats.totalRevenue),  color: 'text-purple-600' },
          ].map(c => (
            <div key={c.label}
                 className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                {c.label}
              </p>
              <p className={`text-xl font-medium ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-100
                        flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-44">
            <IconSearch size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search customer, phone…"
                   value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg
                              text-xs focus:outline-none focus:border-blue-400 bg-gray-50" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {TYPES.map(t => (
              <button key={t} onClick={() => setActiveType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${activeType === t
                          ? 'bg-slate-900 text-white'
                          : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setActiveStatus(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${activeStatus === s
                          ? 'bg-slate-900 text-white'
                          : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table Head */}
        <div className="hidden md:grid
                        grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.8fr_0.8fr]
                        px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          {['Customer','Contact','Type','Orders','Spent','Status','Actions'].map(h => (
            <p key={h} className="text-[10px] font-medium text-gray-400
                                  uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center
                          py-16 text-gray-400 gap-2">
            <IconUser size={32} className="text-gray-200" />
            <p className="text-sm">No customers found</p>
          </div>
        ) : data.data.map(cus => (
          <div key={cus.id}
               className="grid grid-cols-1
                          md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.8fr_0.8fr]
                          px-4 py-3.5 border-b border-gray-50 last:border-0
                          hover:bg-gray-50 transition-colors items-center
                          gap-2 md:gap-0">

            <div className="flex items-center gap-2.5">
              <Avatar name={cus.name} />
              <div>
                <p className="text-xs font-medium text-gray-900">{cus.name}</p>
                <p className="text-[10px] text-gray-400 font-mono">#{cus.id}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-700 flex items-center gap-1">
                <IconPhone size={10} className="text-gray-400" />{cus.phone}
              </p>
              {cus.email && (
                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                  <IconMail size={9} />{cus.email}
                </p>
              )}
            </div>

            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit
              ${TYPE_STYLES[cus.type] || 'bg-gray-100 text-gray-600'}`}>
              {cus.type}
            </span>

            <p className="text-xs font-medium text-gray-900">{cus.totalOrders}</p>

            <div>
              <p className="text-xs font-medium text-gray-900">{fmt(cus.totalSpent)}</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <IconStar size={9} className="text-amber-400" />
                {cus.loyaltyPoints} pts
              </p>
            </div>

            <span className={`inline-flex items-center gap-1 px-2 py-0.5
                              rounded-full text-[10px] font-medium w-fit
              ${cus.status === 'Active'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full
                ${cus.status === 'Active' ? 'bg-green-500' : 'bg-red-400'}`} />
              {cus.status}
            </span>

            <div className="flex gap-1.5">
              <button onClick={() => setViewTarget(cus)}
                      className="w-7 h-7 flex items-center justify-center border
                                 border-gray-200 rounded-lg text-gray-400
                                 hover:border-blue-300 hover:text-blue-500
                                 transition-colors">
                <IconEye size={13} />
              </button>
              <button onClick={() => openEdit(cus)}
                      className="w-7 h-7 flex items-center justify-center border
                                 border-gray-200 rounded-lg text-gray-400
                                 hover:border-gray-300 transition-colors">
                <IconEdit size={13} />
              </button>
              <button onClick={() => setDeleteTarget(cus)}
                      className="w-7 h-7 flex items-center justify-center border
                                 border-gray-200 rounded-lg text-gray-400
                                 hover:border-red-300 hover:text-red-500
                                 transition-colors">
                <IconTrash size={13} />
              </button>
            </div>
          </div>
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3
                        border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Showing {Math.min((page-1)*PAGE_SIZE+1, data.totalCount)}–
            {Math.min(page*PAGE_SIZE, data.totalCount)} of {data.totalCount}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))}
                    disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center border
                               border-gray-200 rounded-lg text-gray-500
                               disabled:opacity-40">
              <IconChevronLeft size={13} />
            </button>
            {Array.from({ length: data.totalPages }, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 flex items-center justify-center
                                  rounded-lg text-xs
                        ${page === p
                          ? 'bg-slate-900 text-white'
                          : 'border border-gray-200 text-gray-500'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(data.totalPages, p+1))}
                    disabled={page === data.totalPages}
                    className="w-7 h-7 flex items-center justify-center border
                               border-gray-200 rounded-lg text-gray-500
                               disabled:opacity-40">
              <IconChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}