import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  IconArrowLeft, IconDeviceFloppy, IconPlus, IconTrash,
  IconSearch, IconAlertTriangle, IconCheck, IconX
} from '@tabler/icons-react'
import { purchaseApi, suppliersApi, partsApi, fmt } from '../services/api'

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white
                          rounded-full animate-spin inline-block" />
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase
                        tracking-wider mb-1.5">
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

function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

// ── Part Search Dropdown ──────────────────────────
function PartSearch({ onSelect }) {
  const [search,  setSearch]  = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [show,    setShow]    = useState(false)

  async function handleSearch(q) {
    setSearch(q)
    if (q.length < 2) { setResults([]); setShow(false); return }
    setLoading(true)
    try {
      const res = await partsApi.getAll(1, 8, q, '')
      setResults(res.data || [])
      setShow(true)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  function select(part) {
    onSelect(part)
    setSearch('')
    setResults([])
    setShow(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <IconSearch size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search part name or code to add…"
          className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg
                     text-sm focus:outline-none focus:border-blue-400 bg-gray-50"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border border-gray-300 border-t-gray-600
                            rounded-full animate-spin" />
          </div>
        )}
      </div>
      {show && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border
                        border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden
                        max-h-52 overflow-y-auto">
          {results.map(part => (
            <button key={part.id} onClick={() => select(part)}
                    className="w-full flex items-center justify-between px-4 py-2.5
                               hover:bg-gray-50 border-b border-gray-50 last:border-0
                               text-left">
              <div>
                <p className="text-xs font-medium text-gray-900">{part.name}</p>
                <p className="text-[10px] text-gray-400">
                  {part.partCode} · {part.category}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-900">
                  {fmt(part.buyPrice)}
                </p>
                <p className="text-[10px] text-gray-400">
                  {part.quantity} in stock
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PurchaseForm() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = !!id

  // ── Form state ────────────────────────────────
  const [supplierId,    setSupplierId]    = useState('')
  const [expectedDate,  setExpectedDate]  = useState('')
  const [reference,     setReference]    = useState('')
  const [notes,         setNotes]        = useState('')
  const [items,         setItems]        = useState([])

  // ── Data ──────────────────────────────────────
  const [suppliers,     setSuppliers]     = useState([])
  const [loadingPage,   setLoadingPage]   = useState(isEdit)
  const [saving,        setSaving]        = useState(false)
  const [errors,        setErrors]        = useState({})
  const [toast,         setToast]         = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Load suppliers ────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await suppliersApi.getAll(1, 100)
        setSuppliers(res.data || res || [])
      } catch {}
    }
    load()
  }, [])

  // ── Load PO in edit mode ──────────────────────
  useEffect(() => {
    if (!isEdit) return
    async function load() {
      setLoadingPage(true)
      try {
        const po = await purchaseApi.getById(id)
        if (!po) { navigate('/purchases'); return }
        setSupplierId(po.supplierId)
        setExpectedDate(po.expectedDate
          ? new Date(po.expectedDate).toISOString().split('T')[0] : '')
        setReference(po.reference || '')
        setNotes(po.notes || '')
        setItems(po.items.map(i => ({
          partId:   i.partId,
          partName: i.partName,
          partCode: i.partCode,
          unit:     i.unit,
          qty:      i.orderedQty,
          cost:     i.unitCost,
        })))
      } catch (err) {
        showToast(err.message, 'error')
        navigate('/purchases')
      } finally {
        setLoadingPage(false)
      }
    }
    load()
  }, [id, isEdit, navigate])

  // ── Add part to items ─────────────────────────
  function addPart(part) {
    if (items.find(i => i.partId === part.id)) {
      showToast('Part already added — update the quantity below', 'error')
      return
    }
    setItems(prev => [...prev, {
      partId:   part.id,
      partName: part.name,
      partCode: part.partCode,
      unit:     part.unit || 'pcs',
      qty:      1,
      cost:     part.buyPrice || 0,
    }])
  }

  function updateItem(idx, field, value) {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ))
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Totals ────────────────────────────────────
  const subTotal = items.reduce((a, i) =>
    a + (parseFloat(i.qty) || 0) * (parseFloat(i.cost) || 0), 0)

  // ── Validate ──────────────────────────────────
  function validate() {
    const e = {}
    if (!supplierId) e.supplier = 'Select a supplier'
    if (items.length === 0) e.items = 'Add at least one part'
    items.forEach((item, idx) => {
      if (!item.qty || item.qty <= 0)
        e[`qty_${idx}`] = 'Qty must be > 0'
      if (item.cost < 0)
        e[`cost_${idx}`] = 'Cost cannot be negative'
    })
    return e
  }

  // ── Save ──────────────────────────────────────
  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const payload = {
      supplierId:   parseInt(supplierId),
      expectedDate: expectedDate || null,
      reference:    reference || null,
      notes:        notes     || null,
      items: items.map(i => ({
        partId:     i.partId,
        orderedQty: parseInt(i.qty),
        unitCost:   parseFloat(i.cost),
      })),
    }

    setSaving(true)
    try {
      if (isEdit) {
        await purchaseApi.update(id, payload)
        showToast('Purchase order updated')
      } else {
        const po = await purchaseApi.create(payload)
        showToast(`${po.poNumber} created successfully`)
      }
      setTimeout(() => navigate('/purchases'), 1200)
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loadingPage) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
        <div className="w-7 h-7 border-2 border-gray-200 border-t-slate-700
                        rounded-full animate-spin" />
        <p className="text-sm">Loading purchase order…</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3
                         rounded-xl shadow-lg text-sm font-medium text-white
                         ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
          {toast.type === 'error'
            ? <IconAlertTriangle size={15} /> : <IconCheck size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/purchases')}
                  className="w-8 h-8 flex items-center justify-center border
                             border-gray-200 rounded-lg text-gray-500">
            <IconArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-xl font-medium text-gray-900">
              {isEdit ? 'Edit purchase order' : 'New purchase order'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit
                ? 'Update draft PO details'
                : 'Create a new purchase order for a supplier'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/purchases')}
                  className="px-3 py-2 border border-gray-200 rounded-lg
                             text-xs text-gray-600">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg
                              text-xs font-medium
                              ${saving
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
            {saving
              ? <><Spinner /> Saving…</>
              : <><IconDeviceFloppy size={13} />
                  {isEdit ? 'Save changes' : 'Create PO'}
                </>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT 2/3 ─────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Order details */}
          <Section title="Order details"
                   subtitle="Supplier and delivery information">
            <div className="space-y-4">
              <Field label="Supplier" required error={errors.supplier}>
                <select
                  value={supplierId}
                  onChange={e => {
                    setSupplierId(e.target.value)
                    if (errors.supplier)
                      setErrors(p => ({ ...p, supplier: null }))
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm
                              focus:outline-none focus:border-blue-400 bg-white
                              ${errors.supplier
                                ? 'border-red-300' : 'border-gray-200'}`}
                >
                  <option value="">Select supplier…</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Expected delivery date">
                  <input type="date" value={expectedDate}
                         onChange={e => setExpectedDate(e.target.value)}
                         className="w-full px-3 py-2.5 border border-gray-200
                                    rounded-lg text-sm focus:outline-none
                                    focus:border-blue-400" />
                </Field>
                <Field label="Supplier reference / quote no">
                  <input type="text" value={reference}
                         onChange={e => setReference(e.target.value)}
                         placeholder="e.g. QT-2026-00123"
                         className="w-full px-3 py-2.5 border border-gray-200
                                    rounded-lg text-sm focus:outline-none
                                    focus:border-blue-400" />
                </Field>
              </div>

              <Field label="Notes">
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                          rows={2} placeholder="Any additional notes…"
                          className="w-full px-3 py-2.5 border border-gray-200
                                     rounded-lg text-sm focus:outline-none
                                     focus:border-blue-400 resize-none" />
              </Field>
            </div>
          </Section>

          {/* Items */}
          <Section title="Order items"
                   subtitle="Search and add parts to this purchase order">
            <div className="space-y-4">

              {/* Part search */}
              <PartSearch onSelect={addPart} />

              {errors.items && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <IconAlertTriangle size={12} />{errors.items}
                </p>
              )}

              {/* Items table */}
              {items.length > 0 && (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  {/* Head */}
                  <div className="grid grid-cols-[2fr_0.8fr_1fr_1fr_0.4fr]
                                  px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    {['Part','Unit','Qty','Unit cost',''].map(h => (
                      <p key={h}
                         className="text-[10px] font-medium text-gray-400
                                    uppercase tracking-wider">{h}</p>
                    ))}
                  </div>

                  {/* Rows */}
                  {items.map((item, idx) => (
                    <div key={idx}
                         className="grid grid-cols-[2fr_0.8fr_1fr_1fr_0.4fr]
                                    px-4 py-3 border-b border-gray-50
                                    last:border-0 items-center gap-2">
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          {item.partName}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {item.partCode}
                        </p>
                      </div>

                      <p className="text-xs text-gray-500">{item.unit}</p>

                      {/* Qty */}
                      <div>
                        <input
                          type="number" min="1"
                          value={item.qty}
                          onChange={e => {
                            updateItem(idx, 'qty', e.target.value)
                            if (errors[`qty_${idx}`])
                              setErrors(p => ({ ...p, [`qty_${idx}`]: null }))
                          }}
                          className={`w-full px-2.5 py-1.5 border rounded-lg
                                      text-xs focus:outline-none focus:border-blue-400
                                      ${errors[`qty_${idx}`]
                                        ? 'border-red-300' : 'border-gray-200'}`}
                        />
                        {errors[`qty_${idx}`] && (
                          <p className="text-[9px] text-red-500 mt-0.5">
                            {errors[`qty_${idx}`]}
                          </p>
                        )}
                      </div>

                      {/* Cost */}
                      <div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2
                                           text-gray-400 text-xs">
                            Rs.
                          </span>
                          <input
                            type="number" min="0" step="0.01"
                            value={item.cost}
                            onChange={e => updateItem(idx, 'cost', e.target.value)}
                            className="w-full pl-8 pr-2.5 py-1.5 border border-gray-200
                                       rounded-lg text-xs focus:outline-none
                                       focus:border-blue-400"
                          />
                        </div>
                      </div>

                      <button onClick={() => removeItem(idx)}
                              className="flex items-center justify-center text-gray-300
                                         hover:text-red-500 transition-colors">
                        <IconTrash size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* ── RIGHT 1/3 ────────────────────── */}
        <div className="space-y-5">

          {/* Order summary */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-900 mb-4">
              Order summary
            </p>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total items</span>
                <span className="font-medium text-gray-900">{items.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total qty</span>
                <span className="font-medium text-gray-900">
                  {items.reduce((a, i) => a + (parseInt(i.qty) || 0), 0)}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-sm text-gray-700 font-medium">
                  Sub total
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {fmt(subTotal)}
                </span>
              </div>
            </div>

            {/* Items breakdown */}
            {items.length > 0 && (
              <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span className="text-gray-400 truncate max-w-32">
                      {item.partName}
                    </span>
                    <span className="text-gray-600">
                      {fmt((parseFloat(item.qty) || 0) *
                           (parseFloat(item.cost) || 0))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-700 mb-2">
              What happens next?
            </p>
            <ol className="space-y-1.5">
              {[
                'PO saved as Draft',
                'Admin approves the PO',
                'PO sent to supplier',
                'Create GRN when goods arrive',
                'Attach supplier invoice',
              ].map((step, i) => (
                <li key={i} className="text-[11px] text-blue-600 flex gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700
                                   flex items-center justify-center flex-shrink-0
                                   text-[9px] font-medium mt-0.5">{i+1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}