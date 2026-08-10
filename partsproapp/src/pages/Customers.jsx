// ================================================
// src/pages/Customers.jsx  — connected to real API
// ================================================
import { useState, useEffect, useCallback } from 'react'
import {
  IconSearch, IconPlus, IconDownload, IconEdit,
  IconTrash, IconX, IconCheck, IconPhone, IconMail,
  IconMapPin, IconChevronLeft, IconChevronRight,
  IconAlertTriangle, IconEye, IconUser, IconCash,
  IconShoppingCart, IconStar, IconCalendar, IconRefresh
} from '@tabler/icons-react'
import { customersApi } from '../services/api'
import { PageLoader, ErrorBanner, Spinner } from '../hooks/useApi'

const TYPES    = ['All', 'Regular', 'VIP', 'Workshop']
const STATUSES = ['All', 'Active', 'Inactive']
const PAGE_SIZE = 10

const TYPE_STYLES = {
  VIP:      { bg: 'bg-amber-50',  text: 'text-amber-700'  },
  Workshop: { bg: 'bg-blue-50',   text: 'text-blue-700'   },
  Regular:  { bg: 'bg-gray-100',  text: 'text-gray-600'   },
}

const fmt = v => '$' + (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })

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

function CustomerModal({ customer, onClose, onSave }) {
  const isEdit = !!customer?.id
  const [form, setForm] = useState(customer || {
    name: '', phone: '', email: '', address: '',
    type: 'Regular', status: 'Active', notes: ''
  })
  const [saving, setSaving]   = useState(false)
  const [errors, setErrors]   = useState({})

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: null })) }

  async function handleSave() {
    const e = {}
    if (!form.name.trim())  e.name  = 'Required'
    if (!form.phone.trim()) e.phone = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try { await onSave(form) } catch (err) { setErrors({ name: err.message }) }
    finally { setSaving(false) }
  }

  function Field({ label, required, error, children }) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><IconAlertTriangle size={10} />{error}</p>}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{isEdit ? 'Edit customer' : 'Add customer'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? customer.id : 'New customer'}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400">
            <IconX size={14} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <Field label="Full name" required error={errors.name}>
            <input value={form.name} onChange={e => set('name', e.target.value)}
                   placeholder="e.g. Kasun Perera"
                   className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none
                     ${errors.name ? 'border-red-300' : 'border-gray-200 focus:border-blue-400'}`} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" required error={errors.phone}>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                     placeholder="+94 77 123 4567"
                     className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none
                       ${errors.phone ? 'border-red-300' : 'border-gray-200 focus:border-blue-400'}`} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)}
                     placeholder="customer@gmail.com"
                     className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
            </Field>
          </div>
          <Field label="Address">
            <input value={form.address || ''} onChange={e => set('address', e.target.value)}
                   placeholder="Street, City"
                   className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select value={form.type} onChange={e => set('type', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">
                {['Regular','VIP','Workshop'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">
                {['Active','Inactive'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
                      rows={2} placeholder="Any notes about this customer…"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-none" />
          </Field>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
          <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Spinner size="sm" /> : <IconCheck size={14} />}
            {isEdit ? 'Save changes' : 'Add customer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ customer, onClose, onEdit }) {
  if (!customer) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-900 px-6 py-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar name={customer.name} />
              <div>
                <p className="text-base font-medium text-white">{customer.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{customer.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white">
              <IconX size={14} />
            </button>
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
            ${TYPE_STYLES[customer.type]?.bg} ${TYPE_STYLES[customer.type]?.text}`}>
            {customer.type}
          </span>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2.5">
            {[
              { icon: <IconPhone size={14} />,  text: customer.phone      },
              { icon: <IconMail size={14} />,   text: customer.email || '—' },
              { icon: <IconMapPin size={14} />, text: customer.address || '—' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-gray-400">{r.icon}</span>
                <span className="text-sm text-gray-700">{r.text}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Orders',    value: customer.totalOrders,           icon: <IconShoppingCart size={14} /> },
              { label: 'Spent',     value: fmt(customer.totalSpent),       icon: <IconCash size={14} />         },
              { label: 'Points',    value: customer.loyaltyPoints,         icon: <IconStar size={14} />         },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-gray-400 flex justify-center mb-1">{s.icon}</div>
                <p className="text-sm font-medium text-gray-900">{s.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[
              { label: 'Status',      value: customer.status,   color: customer.status === 'Active' ? 'text-green-600' : 'text-red-500' },
              { label: 'Member since',value: new Date(customer.joinDate).toLocaleDateString(),  color: 'text-gray-800' },
              { label: 'Last visit',  value: new Date(customer.lastVisit).toLocaleDateString(), color: 'text-gray-800' },
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
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Close</button>
          <button onClick={() => { onClose(); onEdit(customer) }}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 flex items-center justify-center gap-2">
            <IconEdit size={14} /> Edit
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const [deleting,     setDeleting]     = useState(null)
  const [toast,        setToast]        = useState(null)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const fetchCustomers = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [res, st] = await Promise.all([
        customersApi.getAll(page, PAGE_SIZE, search,
          activeType === 'All' ? '' : activeType,
          activeStatus === 'All' ? '' : activeStatus),
        customersApi.getStats(),
      ])
      setData(res); setStats(st)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [page, search, activeType, activeStatus])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])
  useEffect(() => { setPage(1) }, [search, activeType, activeStatus])

  async function handleSave(form) {
    try {
      if (editTarget) {
        await customersApi.update(editTarget.id, form)
        showToast('Customer updated')
      } else {
        await customersApi.create(form)
        showToast('Customer added')
      }
      setShowForm(false); setEditTarget(null); fetchCustomers()
    } catch (err) { throw err }
  }

  async function handleDelete(customer) {
    if (!confirm(`Remove "${customer.name}"?`)) return
    setDeleting(customer.id)
    try {
      await customersApi.delete(customer.id)
      showToast('Customer removed'); fetchCustomers()
    } catch (err) { setError(err.message) }
    finally { setDeleting(null) }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white text-xs px-4 py-2.5
                        rounded-xl shadow-lg flex items-center gap-2">
          <IconCheck size={14} />{toast}
        </div>
      )}
      {showForm && (
        <CustomerModal
          customer={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={handleSave}
        />
      )}
      {viewTarget && (
        <DetailModal
          customer={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={c => { setEditTarget(c); setShowForm(true) }}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Customers</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage your customer base</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCustomers} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-gray-300 bg-white">
            <IconRefresh size={14} />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-600 hover:border-gray-300">
            <IconDownload size={13} /> Export
          </button>
          <button onClick={() => { setEditTarget(null); setShowForm(true) }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-700">
            <IconPlus size={13} /> Add customer
          </button>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total',    value: stats.total,                  color: 'text-gray-900'   },
            { label: 'Active',   value: stats.active,                 color: 'text-green-600'  },
            { label: 'VIP',      value: stats.vip,                    color: 'text-amber-600'  },
            { label: 'Workshop', value: stats.workshop,               color: 'text-blue-600'   },
            { label: 'Revenue',  value: fmt(stats.totalRevenue),      color: 'text-purple-600' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{c.label}</p>
              <p className={`text-xl font-medium ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-44">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search customer, phone…"
                   value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 bg-gray-50" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {TYPES.map(t => (
              <button key={t} onClick={() => setActiveType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${activeType === t ? 'bg-slate-900 text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setActiveStatus(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${activeStatus === s ? 'bg-slate-900 text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.8fr_0.8fr]
                        px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          {['Customer','Contact','Type','Orders','Spent','Status','Actions'].map(h => (
            <p key={h} className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <IconUser size={32} className="text-gray-200" />
            <p className="text-sm">No customers found</p>
          </div>
        ) : data.data.map(cus => (
          <div key={cus.id}
               className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.8fr_0.8fr]
                          px-4 py-3.5 border-b border-gray-50 last:border-0
                          hover:bg-gray-50 transition-colors items-center gap-2 md:gap-0">
            <div className="flex items-center gap-2.5">
              <Avatar name={cus.name} />
              <div>
                <p className="text-xs font-medium text-gray-900">{cus.name}</p>
                <p className="text-[10px] text-gray-400 font-mono">{cus.id}</p>
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
              ${TYPE_STYLES[cus.type]?.bg} ${TYPE_STYLES[cus.type]?.text}`}>
              {cus.type}
            </span>
            <p className="text-xs font-medium text-gray-900">{cus.totalOrders}</p>
            <div>
              <p className="text-xs font-medium text-gray-900">{fmt(cus.totalSpent)}</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <IconStar size={9} className="text-amber-400" />{cus.loyaltyPoints} pts
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
              ${cus.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cus.status === 'Active' ? 'bg-green-500' : 'bg-red-400'}`} />
              {cus.status}
            </span>
            <div className="flex gap-1.5">
              <button onClick={() => setViewTarget(cus)}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:border-blue-300 hover:text-blue-500">
                <IconEye size={13} />
              </button>
              <button onClick={() => { setEditTarget(cus); setShowForm(true) }}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:border-gray-300">
                <IconEdit size={13} />
              </button>
              <button onClick={() => handleDelete(cus)} disabled={deleting === cus.id}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:border-red-300 hover:text-red-500">
                {deleting === cus.id ? <Spinner size="sm" /> : <IconTrash size={13} />}
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Showing {Math.min((page-1)*PAGE_SIZE+1, data.totalCount)}–{Math.min(page*PAGE_SIZE, data.totalCount)} of {data.totalCount}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                    className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 disabled:opacity-40">
              <IconChevronLeft size={13} />
            </button>
            {Array.from({length: data.totalPages},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs
                        ${page===p ? 'bg-slate-900 text-white' : 'border border-gray-200 text-gray-500'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(data.totalPages, p+1))} disabled={page===data.totalPages}
                    className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 disabled:opacity-40">
              <IconChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
