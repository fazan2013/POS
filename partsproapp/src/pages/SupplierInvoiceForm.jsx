// ================================================
// src/pages/SupplierInvoiceForm.jsx
// Create supplier invoice against a fully received PO
// ================================================
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  IconArrowLeft, IconDeviceFloppy, IconCheck,
  IconAlertTriangle, IconFileInvoice, IconX
} from '@tabler/icons-react'
import { purchaseApi, invoiceApi, fmt } from '../services/api'

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white
                          rounded-full animate-spin inline-block" />
}

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase
                        tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint  && !error && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
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

export default function SupplierInvoiceForm() {
  const navigate = useNavigate()
  const { id }   = useParams()  // PO id

  // ── PO data ───────────────────────────────────
  const [po,      setPo]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})
  const [toast,   setToast]   = useState(null)

  // ── Form refs (uncontrolled — no cursor jump) ─
  const invoiceNoRef = useRef(null)
  const notesRef     = useRef(null)

  // ── Controlled state ──────────────────────────
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0])
  const [dueDate,     setDueDate]     = useState('')
  const [subTotal,    setSubTotal]    = useState(0)
  const [taxAmount,   setTaxAmount]   = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Load PO ───────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await purchaseApi.getById(id)
        if (!data) { navigate('/purchases'); return }

        // Guard — must be FullyReceived or PartiallyReceived
        if (!['FullyReceived', 'PartiallyReceived', 'Invoiced'].includes(data.status)) {
          showToast('Goods must be received before creating an invoice', 'error')
          setTimeout(() => navigate(`/purchases/${id}`), 2000)
          return
        }

        setPo(data)

        // Pre-fill amounts from PO totals
        setSubTotal(data.subTotal)
        setTaxAmount(data.taxAmount)
        setTotalAmount(data.totalAmount)

        // Default due date = 30 days from now
        const due = new Date()
        due.setDate(due.getDate() + 30)
        setDueDate(due.toISOString().split('T')[0])

      } catch (err) {
        showToast(err.message, 'error')
        navigate('/purchases')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  // ── Auto-calc total when sub/tax change ───────
  useEffect(() => {
    setTotalAmount(
      Math.round((parseFloat(subTotal) || 0) * 100 +
                 (parseFloat(taxAmount) || 0) * 100) / 100
    )
  }, [subTotal, taxAmount])

  // ── Validate ──────────────────────────────────
  function validate() {
    const e = {}
    const invNo = invoiceNoRef.current?.value?.trim()
    if (!invNo)        e.invoiceNo   = 'Invoice number is required'
    if (!invoiceDate)  e.invoiceDate = 'Invoice date is required'
    if (!subTotal || subTotal <= 0)
                       e.subTotal    = 'Sub total must be greater than 0'
    if (!totalAmount || totalAmount <= 0)
                       e.totalAmount = 'Total must be greater than 0'
    return e
  }

  // ── Submit ────────────────────────────────────
  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const payload = {
      purchaseOrderId: parseInt(id),
      invoiceNumber:   invoiceNoRef.current?.value?.trim(),
      invoiceDate:     new Date(invoiceDate).toISOString(),
      dueDate:         dueDate ? new Date(dueDate).toISOString() : null,
      subTotal:        parseFloat(subTotal)    || 0,
      taxAmount:       parseFloat(taxAmount)   || 0,
      totalAmount:     parseFloat(totalAmount) || 0,
      notes:           notesRef.current?.value?.trim() || null,
    }

    setSaving(true)
    try {
      const result = await invoiceApi.create(payload)
      const matched = result.isMatched

      showToast(
        matched
          ? `Invoice created — 3-way match passed ✓`
          : `Invoice created — discrepancy found, review required ⚠`,
        matched ? 'success' : 'warn'
      )

      setTimeout(() => navigate(`/purchases/${id}`), 2000)
    } catch (err) {
      showToast(err.message || 'Failed to create invoice', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
        <div className="w-7 h-7 border-2 border-gray-200 border-t-slate-700
                        rounded-full animate-spin" />
        <p className="text-sm">Loading purchase order…</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2
                         px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white
                         ${toast.type === 'error' ? 'bg-red-500'
                         : toast.type === 'warn'  ? 'bg-amber-500'
                         : 'bg-green-600'}`}>
          {toast.type === 'error'
            ? <IconAlertTriangle size={15} />
            : <IconCheck size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/purchases/${id}`)}
                  className="w-8 h-8 flex items-center justify-center border
                             border-gray-200 rounded-lg text-gray-500">
            <IconArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-xl font-medium text-gray-900">
              Create supplier invoice
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {po?.poNumber} · {po?.supplierName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/purchases/${id}`)}
                  className="px-3 py-2 border border-gray-200 rounded-lg
                             text-xs text-gray-600">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg
                              text-xs font-medium
                              ${saving
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-teal-600 text-white hover:bg-teal-700'}`}>
            {saving
              ? <><Spinner /> Saving…</>
              : <><IconFileInvoice size={13} /> Create invoice</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT 2/3 ─────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Invoice details */}
          <Section title="Invoice details"
                   subtitle="Enter the supplier invoice information">
            <div className="space-y-4">

              <Field label="Invoice number" required error={errors.invoiceNo}>
                <input
                  ref={invoiceNoRef}
                  type="text"
                  placeholder="e.g. INV-2026-00123"
                  onChange={() => errors.invoiceNo &&
                    setErrors(p => ({ ...p, invoiceNo: null }))}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm
                              focus:outline-none transition-colors
                              ${errors.invoiceNo
                                ? 'border-red-300 focus:border-red-400'
                                : 'border-gray-200 focus:border-blue-400'}`}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Invoice date" required error={errors.invoiceDate}>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={e => {
                      setInvoiceDate(e.target.value)
                      if (errors.invoiceDate)
                        setErrors(p => ({ ...p, invoiceDate: null }))
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm
                                focus:outline-none
                                ${errors.invoiceDate
                                  ? 'border-red-300' : 'border-gray-200'}`}
                  />
                </Field>
                <Field label="Payment due date"
                       hint="Leave blank if not specified">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200
                               rounded-lg text-sm focus:outline-none
                               focus:border-blue-400"
                  />
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  ref={notesRef}
                  rows={2}
                  placeholder="Any notes about this invoice…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                             text-sm focus:outline-none focus:border-blue-400
                             resize-none"
                />
              </Field>
            </div>
          </Section>

          {/* Amounts */}
          <Section title="Invoice amounts"
                   subtitle="Verify amounts against the purchase order">
            <div className="space-y-4">

              {/* PO reference row */}
              <div className="flex items-center justify-between px-4 py-3
                              bg-gray-50 border border-gray-100 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-gray-700">
                    PO total for reference
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {po?.poNumber}
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {fmt(po?.totalAmount || 0)}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Sub total" required error={errors.subTotal}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2
                                     text-gray-400 text-xs">Rs.</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={subTotal}
                      onChange={e => {
                        setSubTotal(e.target.value)
                        if (errors.subTotal)
                          setErrors(p => ({ ...p, subTotal: null }))
                      }}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-lg
                                  text-sm focus:outline-none
                                  ${errors.subTotal
                                    ? 'border-red-300 focus:border-red-400'
                                    : 'border-gray-200 focus:border-blue-400'}`}
                    />
                  </div>
                </Field>

                <Field label="Tax amount">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2
                                     text-gray-400 text-xs">Rs.</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={taxAmount}
                      onChange={e => setTaxAmount(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200
                                 rounded-lg text-sm focus:outline-none
                                 focus:border-blue-400"
                    />
                  </div>
                </Field>

                <Field label="Total amount" required error={errors.totalAmount}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2
                                     text-gray-400 text-xs">Rs.</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={totalAmount}
                      onChange={e => {
                        setTotalAmount(e.target.value)
                        if (errors.totalAmount)
                          setErrors(p => ({ ...p, totalAmount: null }))
                      }}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-lg
                                  text-sm focus:outline-none
                                  ${errors.totalAmount
                                    ? 'border-red-300 focus:border-red-400'
                                    : 'border-gray-200 focus:border-blue-400'}`}
                    />
                  </div>
                </Field>
              </div>

              {/* Variance indicator */}
              {po && (() => {
                const diff = Math.abs(
                  (parseFloat(totalAmount) || 0) - po.totalAmount)
                const pct  = po.totalAmount > 0
                  ? (diff / po.totalAmount) * 100 : 0
                const ok   = diff <= 1 || pct <= 0.5

                return (
                  <div className={`flex items-start gap-2.5 px-4 py-3
                                   rounded-xl border
                    ${ok
                      ? 'bg-green-50 border-green-100'
                      : 'bg-amber-50 border-amber-100'}`}>
                    {ok
                      ? <IconCheck size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                      : <IconAlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className={`text-xs font-medium
                        ${ok ? 'text-green-700' : 'text-amber-700'}`}>
                        {ok ? '3-way match will pass'
                            : 'Discrepancy detected — will be flagged for review'}
                      </p>
                      <p className={`text-[10px] mt-0.5
                        ${ok ? 'text-green-600' : 'text-amber-600'}`}>
                        PO total: {fmt(po.totalAmount)} ·
                        Invoice total: {fmt(parseFloat(totalAmount) || 0)} ·
                        Difference: {fmt(diff)}
                        {pct > 0 ? ` (${pct.toFixed(2)}%)` : ''}
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </Section>

          {/* PO Items summary */}
          <Section title="Items received"
                   subtitle="Summary of goods received against this PO">
            <div className="space-y-0">
              {/* Head */}
              <div className="grid grid-cols-[2fr_0.7fr_0.7fr_0.8fr]
                              py-2 border-b border-gray-100">
                {['Part','Ordered','Received','Total cost'].map(h => (
                  <p key={h}
                     className="text-[10px] font-medium text-gray-400
                                uppercase tracking-wider">{h}</p>
                ))}
              </div>
              {po?.items.map(item => (
                <div key={item.id}
                     className="grid grid-cols-[2fr_0.7fr_0.7fr_0.8fr]
                                py-3 border-b border-gray-50 last:border-0
                                items-center">
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      {item.partName}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {item.partCode}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">{item.orderedQty}</p>
                  <p className={`text-xs font-medium
                    ${item.receivedQty >= item.orderedQty
                      ? 'text-green-600' : 'text-amber-600'}`}>
                    {item.receivedQty}
                  </p>
                  <p className="text-xs text-gray-700">
                    {fmt(item.totalCost)}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ── RIGHT 1/3 ────────────────────── */}
        <div className="space-y-5">

          {/* PO summary card */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-900 mb-4">PO summary</p>
            <div className="space-y-2.5">
              {[
                { label: 'PO Number',    value: po?.poNumber     },
                { label: 'Supplier',     value: po?.supplierName },
                { label: 'PO Status',    value: po?.status       },
                { label: 'Items',        value: `${po?.receivedItems}/${po?.totalItems} received` },
                { label: 'PO Sub total', value: fmt(po?.subTotal     || 0) },
                { label: 'PO Tax',       value: fmt(po?.taxAmount    || 0) },
                { label: 'PO Total',     value: fmt(po?.totalAmount  || 0) },
              ].map(r => (
                <div key={r.label}
                     className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{r.label}</span>
                  <span className="text-xs font-medium text-gray-800">
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* What is 3-way match */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-700 mb-2">
              3-way match explained
            </p>
            <div className="space-y-2">
              {[
                { label: 'PO',      desc: 'What you ordered' },
                { label: 'GRN',     desc: 'What was received' },
                { label: 'Invoice', desc: 'What supplier is charging' },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-700
                                   flex items-center justify-center text-[10px]
                                   font-medium flex-shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-blue-800">{m.label}</p>
                    <p className="text-[10px] text-blue-600">{m.desc}</p>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-blue-600 pt-1 border-t border-blue-100">
                All three must match within 0.5% tolerance for automatic approval.
              </p>
            </div>
          </div>

          {/* After creating invoice */}
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
            <p className="text-xs font-medium text-teal-700 mb-2">
              After creating invoice
            </p>
            <ul className="space-y-1.5">
              {[
                'PO status → Invoiced',
                '3-way match runs automatically',
                'Matched → ready for payment approval',
                'Unmatched → flagged for admin review',
                'Approved → mark as Paid to close PO',
              ].map((item, i) => (
                <li key={i} className="text-[11px] text-teal-600 flex gap-1.5">
                  <IconCheck size={10} className="text-teal-400 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}