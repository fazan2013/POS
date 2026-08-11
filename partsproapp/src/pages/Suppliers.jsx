// ================================================
// src/pages/Suppliers.jsx  — fixed input bug
// ================================================
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  IconSearch, IconPlus, IconDownload, IconEdit,
  IconTrash, IconX, IconCheck, IconPhone, IconMail,
  IconMapPin, IconChevronLeft, IconChevronRight,
  IconAlertTriangle, IconEye, IconBuildingStore,
  IconCash, IconTruck, IconPackage, IconRefresh
} from '@tabler/icons-react'
import { suppliersApi } from '../services/api'

// ── Constants ─────────────────────────────────────
const STATUSES   = ['All', 'Active', 'Inactive']
const PAGE_SIZE  = 10
const CATEGORIES = [
  'Engine & Filters', 'Brakes & Suspension', 'Electrical',
  'Engine', 'Filters & Cooling', 'Multi-category'
]
const PAY_TERMS = ['COD', 'Net 15', 'Net 30', 'Net 45', 'Net 60']

// ── Helpers ───────────────────────────────────────
function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border' : 'w-6 h-6 border-2'
  return (
    <div className={`${s} border-gray-200 border-t-slate-700
                    rounded-full animate-spin flex-shrink-0`} />
  )
}

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s}
              className={`text-sm ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}>
          ★
        </span>
      ))}
    </div>
  )
}

// ── Supplier Form Modal ───────────────────────────
// KEY FIX: use useRef for form state + uncontrolled inputs
// to avoid re-render on every keystroke losing focus
function SupplierModal({ supplier, onClose, onSave }) {
  const isEdit = !!supplier?.id

  // ── Use refs for input values to avoid re-render ──
  const nameRef          = useRef(supplier?.name          || '')
  const contactRef       = useRef(supplier?.contactPerson || '')
  const phoneRef         = useRef(supplier?.phone         || '')
  const emailRef         = useRef(supplier?.email         || '')
  const addressRef       = useRef(supplier?.address       || '')
  const notesRef         = useRef(supplier?.notes         || '')

  // ── Only dropdowns need state (they don't lose focus) ──
  const [category,     setCategory]     = useState(supplier?.category     || '')
  const [paymentTerms, setPaymentTerms] = useState(supplier?.paymentTerms || 'Net 30')
  const [status,       setStatus]       = useState(supplier?.status       || 'Active')

  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})

  function clearError(field) {
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }

  async function handleSave() {
    // Read values from DOM refs
    const name          = nameRef.current.value.trim()
    const contactPerson = contactRef.current.value.trim()
    const phone         = phoneRef.current.value.trim()
    const email         = emailRef.current.value.trim()
    const address       = addressRef.current.value.trim()
    const notes         = notesRef.current.value.trim()

    // Validate
    const e = {}
    if (!name)          e.name          = 'Company name is required'
    if (!contactPerson) e.contactPerson = 'Contact person is required'
    if (!phone)         e.phone         = 'Phone is required'
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try {
      await onSave({
        name, contactPerson, phone, email,
        address, category, paymentTerms, status, notes,
      })
    } catch (err) {
      setErrors({ name: err.message })
    } finally {
      setSaving(false)
    }
  }

  // ── Field wrapper ─────────────────────────────
  function Field({ label, required, error, children }) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500
                          uppercase tracking-wider mb-1.5">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
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

  // ── Input class helper ────────────────────────
  function inputClass(hasError) {
    return `w-full px-3 py-2.5 border rounded-lg text-sm
            focus:outline-none transition-colors
            ${hasError
              ? 'border-red-300 focus:border-red-400'
              : 'border-gray-200 focus:border-blue-400'}`
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                    justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg
                      max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isEdit ? 'Edit supplier' : 'Add new supplier'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Editing ${supplier.id}` : 'Fill in supplier details'}
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

          {/* Company name */}
          <Field label="Company name" required error={errors.name}>
            <input
              ref={nameRef}
              defaultValue={supplier?.name || ''}
              placeholder="e.g. AutoParts Lanka Pvt Ltd"
              onChange={() => clearError('name')}
              className={inputClass(errors.name)}
            />
          </Field>

          {/* Contact + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact person" required error={errors.contactPerson}>
              <input
                ref={contactRef}
                defaultValue={supplier?.contactPerson || ''}
                placeholder="e.g. Roshan Perera"
                onChange={() => clearError('contactPerson')}
                className={inputClass(errors.contactPerson)}
              />
            </Field>
            <Field label="Phone" required error={errors.phone}>
              <input
                ref={phoneRef}
                defaultValue={supplier?.phone || ''}
                placeholder="+94 11 234 5678"
                onChange={() => clearError('phone')}
                className={inputClass(errors.phone)}
              />
            </Field>
          </div>

          {/* Email */}
          <Field label="Email">
            <input
              ref={emailRef}
              type="email"
              defaultValue={supplier?.email || ''}
              placeholder="supplier@company.lk"
              className={inputClass(false)}
            />
          </Field>

          {/* Address */}
          <Field label="Address">
            <input
              ref={addressRef}
              defaultValue={supplier?.address || ''}
              placeholder="Street, City"
              className={inputClass(false)}
            />
          </Field>

          {/* Category + Payment terms */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                           text-sm focus:outline-none focus:border-blue-400
                           bg-white appearance-none"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment terms">
              <select
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                           text-sm focus:outline-none focus:border-blue-400
                           bg-white appearance-none"
              >
                {PAY_TERMS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Status toggle */}
          <Field label="Status">
            <div className="flex gap-3">
              {['Active', 'Inactive'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm
                              font-medium transition-all
                    ${status === s
                      ? s === 'Active'
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-red-300 bg-red-50 text-red-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              ref={notesRef}
              defaultValue={supplier?.notes || ''}
              rows={3}
              placeholder="Any notes about this supplier…"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                         text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl
                       text-sm text-gray-600 hover:border-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl
                       text-sm font-medium hover:bg-slate-700
                       flex items-center justify-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Spinner size="sm" /> : <IconCheck size={14} />}
            {isEdit ? 'Save changes' : 'Add supplier'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Supplier Detail Modal ─────────────────────────
function DetailModal({ supplier, onClose, onEdit }) {
  if (!supplier) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                    justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md
                      overflow-hidden"
           onClick={e => e.stopPropagation()}>

        <div className="bg-slate-900 px-6 py-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-base font-medium text-white">{supplier.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{supplier.id}</p>
            </div>
            <button onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center
                               rounded-lg bg-white/10 text-white hover:bg-white/20">
              <IconX size={14} />
            </button>
          </div>
          <Stars rating={supplier.rating} />
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2.5">
            {[
              { icon: <IconBuildingStore size={14} />, text: supplier.contactPerson },
              { icon: <IconPhone size={14} />,         text: supplier.phone         },
              { icon: <IconMail size={14} />,          text: supplier.email  || '—' },
              { icon: <IconMapPin size={14} />,        text: supplier.address || '—'},
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-gray-400">{r.icon}</span>
                <span className="text-sm text-gray-700">{r.text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {[
              { label: 'Category',      value: supplier.category     || '—' },
              { label: 'Payment terms', value: supplier.paymentTerms         },
              { label: 'Status',        value: supplier.status,
                color: supplier.status === 'Active' ? 'text-green-600' : 'text-red-500' },
              { label: 'Member since',
                value: new Date(supplier.createdAt).toLocaleDateString() },
            ].map(d => (
              <div key={d.label}
                   className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{d.label}</span>
                <span className={`text-xs font-medium ${d.color || 'text-gray-800'}`}>
                  {d.value}
                </span>
              </div>
            ))}
          </div>

          {supplier.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-xs text-gray-700 leading-relaxed">
                {supplier.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl
                             text-sm text-gray-600 hover:border-gray-300">
            Close
          </button>
          <button onClick={() => { onClose(); onEdit(supplier) }}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl
                             text-sm font-medium hover:bg-slate-700
                             flex items-center justify-center gap-2">
            <IconEdit size={14} /> Edit supplier
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal ──────────────────────────
function DeleteModal({ supplier, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center
                        justify-center mx-auto mb-4">
          <IconTrash size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-medium text-gray-900 text-center mb-2">
          Remove supplier?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          <span className="font-medium text-gray-800">{supplier?.name}</span> will
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
    <div className="fixed top-5 right-5 z-[60] bg-green-600 text-white
                    text-xs px-4 py-2.5 rounded-xl shadow-lg
                    flex items-center gap-2">
      <IconCheck size={14} />{msg}
    </div>
  )
}

// ── Main Suppliers Page ───────────────────────────
export default function Suppliers() {
  const [data,         setData]         = useState({ data: [], totalCount: 0, totalPages: 1 })
  const [stats,        setStats]        = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [activeStatus, setActiveStatus] = useState('All')
  const [page,         setPage]         = useState(1)
  const [showForm,     setShowForm]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [viewTarget,   setViewTarget]   = useState(null)
  const [deleting,     setDeleting]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast,        setToast]        = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Fetch ─────────────────────────────────────
  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [res, st] = await Promise.all([
        suppliersApi.getAll(
          page, PAGE_SIZE, search,
          activeStatus === 'All' ? '' : activeStatus
        ),
        suppliersApi.getStats(),
      ])
      setData(res)
      setStats(st)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, activeStatus])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])
  useEffect(() => { setPage(1) }, [search, activeStatus])

  // ── CRUD ──────────────────────────────────────
  async function handleSave(form) {
    if (editTarget) {
      await suppliersApi.update(editTarget.id, form)
      showToast('Supplier updated successfully')
    } else {
      await suppliersApi.create(form)
      showToast('Supplier added successfully')
    }
    setShowForm(false)
    setEditTarget(null)
    fetchSuppliers()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)
    try {
      await suppliersApi.delete(deleteTarget.id)
      showToast('Supplier removed')
      setDeleteTarget(null)
      fetchSuppliers()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  function openEdit(supplier) {
    setEditTarget(supplier)
    setShowForm(true)
  }

  function openAdd() {
    setEditTarget(null)
    setShowForm(true)
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      <Toast msg={toast} />

      {showForm && (
        <SupplierModal
          key={editTarget?.id || 'new'}   // ← key forces fresh mount
          supplier={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={handleSave}
        />
      )}

      {viewTarget && (
        <DetailModal
          supplier={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={openEdit}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          supplier={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Header ───────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Suppliers</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage your parts suppliers and vendors
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSuppliers}
            className="w-8 h-8 flex items-center justify-center border
                       border-gray-200 rounded-lg text-gray-500
                       hover:border-gray-300 bg-white"
          >
            <IconRefresh size={14} />
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-2 border
                       border-gray-200 rounded-lg text-xs bg-white
                       text-gray-600 hover:border-gray-300"
          >
            <IconDownload size={13} /> Export
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900
                       text-white rounded-lg text-xs font-medium hover:bg-slate-700"
          >
            <IconPlus size={13} /> Add supplier
          </button>
        </div>
      </div>

      {/* ── Error ────────────────────────────── */}
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

      {/* ── Stats ────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Total suppliers', value: stats.total,    color: 'text-gray-900'  },
            { label: 'Active',          value: stats.active,   color: 'text-green-600' },
            { label: 'Inactive',        value: stats.inactive, color: 'text-red-500'   },
          ].map(card => (
            <div key={card.label}
                 className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                {card.label}
              </p>
              <p className={`text-2xl font-medium ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-100
                        flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-44">
            <IconSearch size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search supplier, contact, email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg
                         text-xs focus:outline-none focus:border-blue-400 bg-gray-50"
            />
          </div>
          <div className="flex gap-1.5">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium
                            transition-all
                  ${activeStatus === s
                    ? 'bg-slate-900 text-white'
                    : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table Head */}
        <div className="hidden md:grid
                        grid-cols-[1.8fr_1.5fr_1.2fr_1fr_0.8fr_0.8fr]
                        px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          {['Supplier', 'Contact', 'Category', 'Payment', 'Status', 'Actions'].map(h => (
            <p key={h}
               className="text-[10px] font-medium text-gray-400
                          uppercase tracking-wider">
              {h}
            </p>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center
                          py-16 text-gray-400 gap-2">
            <IconBuildingStore size={32} className="text-gray-200" />
            <p className="text-sm">No suppliers found</p>
          </div>
        ) : data.data.map(sup => (
          <div
            key={sup.id}
            className="grid grid-cols-1
                       md:grid-cols-[1.8fr_1.5fr_1.2fr_1fr_0.8fr_0.8fr]
                       px-4 py-3.5 border-b border-gray-50 last:border-0
                       hover:bg-gray-50 transition-colors items-center
                       gap-2 md:gap-0"
          >
            {/* Supplier */}
            <div>
              <p className="text-xs font-medium text-gray-900">{sup.name}</p>
              <Stars rating={sup.rating} />
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs text-gray-700">{sup.contactPerson}</p>
              <p className="text-[10px] text-gray-400 flex items-center
                            gap-1 mt-0.5">
                <IconPhone size={9} />{sup.phone}
              </p>
            </div>

            {/* Category */}
            <p className="text-xs text-gray-600">{sup.category || '—'}</p>

            {/* Payment */}
            <p className="text-xs text-gray-600">{sup.paymentTerms}</p>

            {/* Status */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5
                              rounded-full text-[10px] font-medium w-fit
              ${sup.status === 'Active'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full
                ${sup.status === 'Active' ? 'bg-green-500' : 'bg-red-400'}`} />
              {sup.status}
            </span>

            {/* Actions */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setViewTarget(sup)}
                className="w-7 h-7 flex items-center justify-center border
                           border-gray-200 rounded-lg text-gray-400
                           hover:border-blue-300 hover:text-blue-500
                           transition-colors"
              >
                <IconEye size={13} />
              </button>
              <button
                onClick={() => openEdit(sup)}
                className="w-7 h-7 flex items-center justify-center border
                           border-gray-200 rounded-lg text-gray-400
                           hover:border-gray-300 hover:text-gray-700
                           transition-colors"
              >
                <IconEdit size={13} />
              </button>
              <button
                onClick={() => setDeleteTarget(sup)}
                disabled={deleting === sup.id}
                className="w-7 h-7 flex items-center justify-center border
                           border-gray-200 rounded-lg text-gray-400
                           hover:border-red-300 hover:text-red-500
                           transition-colors disabled:opacity-50"
              >
                {deleting === sup.id
                  ? <Spinner size="sm" />
                  : <IconTrash size={13} />}
              </button>
            </div>
          </div>
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3
                        border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {data.totalCount} suppliers
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center border
                         border-gray-200 rounded-lg text-gray-500
                         disabled:opacity-40 hover:border-gray-300"
            >
              <IconChevronLeft size={13} />
            </button>
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 flex items-center justify-center
                            rounded-lg text-xs transition-colors
                  ${page === p
                    ? 'bg-slate-900 text-white'
                    : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="w-7 h-7 flex items-center justify-center border
                         border-gray-200 rounded-lg text-gray-500
                         disabled:opacity-40 hover:border-gray-300"
            >
              <IconChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
