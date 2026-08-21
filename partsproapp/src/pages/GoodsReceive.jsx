
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  IconArrowLeft, IconDeviceFloppy, IconPackage,
  IconCheck, IconAlertTriangle, IconX
} from '@tabler/icons-react'
import { purchaseApi, grnApi, fmt } from '../services/api'

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white
                          rounded-full animate-spin inline-block" />
}

function Field({ label, error, hint, children }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-gray-400 uppercase
                        tracking-wider mb-1">
        {label}
      </label>
      {children}
      {hint  && !error && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
      {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

export default function GoodsReceive() {
  const navigate = useNavigate()
  const { id }   = useParams()  // PO id

  const [po,           setPo]          = useState(null)
  const [loading,      setLoading]     = useState(true)
  const [saving,       setSaving]      = useState(false)
  const [errors,       setErrors]      = useState({})
  const [toast,        setToast]       = useState(null)

  // ── GRN form state ────────────────────────────
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split('T')[0])
  const [deliveryNote, setDeliveryNote] = useState('')
  const [notes,        setNotes]        = useState('')

  // Items state — one row per PO item with pending qty
  const [receiveItems, setReceiveItems] = useState([])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Load PO ───────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await purchaseApi.getById(id)
        if (!data) { navigate('/purchases'); return }
        setPo(data)

        // Pre-fill receive items from pending PO items
        setReceiveItems(
          data.items
            .filter(i => !i.isFullyReceived)
            .map(i => ({
              poItemId:    i.id,
              partId:      i.partId,
              partName:    i.partName,
              partCode:    i.partCode,
              unit:        i.unit,
              orderedQty:  i.orderedQty,
              receivedQty: i.receivedQty,
              pendingQty:  i.pendingQty,
              receiveNow:  i.pendingQty,  // default: receive all pending
              acceptedNow: i.pendingQty,
              rejectedNow: 0,
              unitCost:    i.unitCost,
              remarks:     '',
            }))
        )
      } catch (err) {
        showToast(err.message, 'error')
        navigate('/purchases')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  // ── Update item field ─────────────────────────
  function updateItem(idx, field, value) {
    setReceiveItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }

      // Auto-calculate accepted/rejected when receiveNow changes
      if (field === 'receiveNow') {
        const qty = parseInt(value) || 0
        updated.acceptedNow = qty - (item.rejectedNow || 0)
      }
      if (field === 'rejectedNow') {
        const rej = parseInt(value) || 0
        updated.acceptedNow = (parseInt(updated.receiveNow) || 0) - rej
      }
      return updated
    }))
    // Clear error
    if (errors[`item_${idx}`])
      setErrors(p => ({ ...p, [`item_${idx}`]: null }))
  }

  // ── Validate ──────────────────────────────────
  function validate() {
    const e = {}
    if (!receivedDate) e.date = 'Received date is required'

    const active = receiveItems.filter(i => parseInt(i.receiveNow) > 0)
    if (active.length === 0) e.items = 'Enter received quantity for at least one item'

    receiveItems.forEach((item, idx) => {
      const receive  = parseInt(item.receiveNow)  || 0
      const accepted = parseInt(item.acceptedNow) || 0
      const rejected = parseInt(item.rejectedNow) || 0

      if (receive > item.pendingQty)
        e[`item_${idx}`] =
          `Cannot exceed pending qty (${item.pendingQty})`

      if (receive > 0 && accepted + rejected !== receive)
        e[`item_${idx}`] =
          `Accepted (${accepted}) + Rejected (${rejected}) must equal received (${receive})`

      if (accepted < 0 || rejected < 0)
        e[`item_${idx}`] = 'Quantities cannot be negative'
    })
    return e
  }

  // ── Save GRN ──────────────────────────────────
  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const payload = {
      purchaseOrderId: parseInt(id),
      receivedDate:    new Date(receivedDate).toISOString(),
      deliveryNote:    deliveryNote || null,
      notes:           notes        || null,
      items: receiveItems
        .filter(i => parseInt(i.receiveNow) > 0)
        .map(i => ({
          purchaseOrderItemId: i.poItemId,
          partId:              i.partId,
          receivedQty:         parseInt(i.receiveNow),
          acceptedQty:         parseInt(i.acceptedNow) || 0,
          rejectedQty:         parseInt(i.rejectedNow) || 0,
          unitCost:            parseFloat(i.unitCost),
          remarks:             i.remarks || null,
        })),
    }

    setSaving(true)
    try {
      const grn = await grnApi.create(payload)
      showToast(`${grn.grnNumber} created — stock updated ✓`)
      setTimeout(() => navigate(`/purchases/${id}`), 1500)
    } catch (err) {
      showToast(err.message || 'Failed to create GRN', 'error')
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

  const totalReceiving = receiveItems.reduce(
    (a, i) => a + (parseInt(i.acceptedNow) || 0) * (parseFloat(i.unitCost) || 0), 0)

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
          <button onClick={() => navigate(`/purchases/${id}`)}
                  className="w-8 h-8 flex items-center justify-center border
                             border-gray-200 rounded-lg text-gray-500">
            <IconArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-xl font-medium text-gray-900">
              Goods receive
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
                                : 'bg-green-600 text-white hover:bg-green-700'}`}>
            {saving
              ? <><Spinner /> Saving…</>
              : <><IconDeviceFloppy size={13} /> Create GRN</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT 2/3 ─────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* GRN info */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-900 mb-4">
              Receive details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Received date" error={errors.date}>
                <input type="date" value={receivedDate}
                       onChange={e => {
                         setReceivedDate(e.target.value)
                         if (errors.date)
                           setErrors(p => ({ ...p, date: null }))
                       }}
                       className="w-full px-3 py-2.5 border border-gray-200
                                  rounded-lg text-sm focus:outline-none
                                  focus:border-blue-400" />
              </Field>
              <Field label="Delivery note / docket no">
                <input type="text" value={deliveryNote}
                       onChange={e => setDeliveryNote(e.target.value)}
                       placeholder="Supplier delivery note number"
                       className="w-full px-3 py-2.5 border border-gray-200
                                  rounded-lg text-sm focus:outline-none
                                  focus:border-blue-400" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Notes">
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                          rows={2} placeholder="Any notes about this delivery…"
                          className="w-full px-3 py-2.5 border border-gray-200
                                     rounded-lg text-sm focus:outline-none
                                     focus:border-blue-400 resize-none" />
              </Field>
            </div>
          </div>

          {/* Items to receive */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                Items to receive
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Enter actual quantities received from supplier
              </p>
            </div>

            {errors.items && (
              <div className="mx-5 mt-3 px-3 py-2 bg-red-50 border border-red-100
                              rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                <IconAlertTriangle size={12} />{errors.items}
              </div>
            )}

            {receiveItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2
                              text-gray-400">
                <IconPackage size={28} className="text-gray-200" />
                <p className="text-sm">All items fully received</p>
              </div>
            ) : (
              <div>
                {/* Column headers */}
                <div className="grid grid-cols-[2fr_0.6fr_0.6fr_0.6fr_0.6fr_1fr_0.6fr]
                                px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                  {['Part','Ordered','Received','Receive now',
                    'Accepted','Rejected','Unit cost'].map(h => (
                    <p key={h} className="text-[9px] font-medium text-gray-400
                                         uppercase tracking-wider">{h}</p>
                  ))}
                </div>

                {receiveItems.map((item, idx) => (
                  <div key={idx}
                       className="px-5 py-4 border-b border-gray-50 last:border-0">
                    {/* Part name row */}
                    <div className="grid grid-cols-[2fr_0.6fr_0.6fr_0.6fr_0.6fr_1fr_0.6fr]
                                    items-center gap-2 mb-2">
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          {item.partName}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {item.partCode}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600">{item.orderedQty}</p>
                      <p className="text-xs text-gray-600">{item.receivedQty}</p>

                      {/* Receive now */}
                      <input
                        type="number" min="0" max={item.pendingQty}
                        value={item.receiveNow}
                        onChange={e => updateItem(idx, 'receiveNow', e.target.value)}
                        className="w-full px-2 py-1.5 border border-blue-200
                                   rounded-lg text-xs focus:outline-none
                                   focus:border-blue-400 bg-blue-50 text-center"
                      />

                      {/* Accepted */}
                      <input
                        type="number" min="0"
                        value={item.acceptedNow}
                        onChange={e => updateItem(idx, 'acceptedNow', e.target.value)}
                        className="w-full px-2 py-1.5 border border-green-200
                                   rounded-lg text-xs focus:outline-none
                                   focus:border-green-400 bg-green-50 text-center"
                      />

                      {/* Rejected */}
                      <input
                        type="number" min="0"
                        value={item.rejectedNow}
                        onChange={e => updateItem(idx, 'rejectedNow', e.target.value)}
                        className="w-full px-2 py-1.5 border border-red-200
                                   rounded-lg text-xs focus:outline-none
                                   focus:border-red-400 bg-red-50 text-center"
                      />

                      {/* Unit cost */}
                      <input
                        type="number" min="0" step="0.01"
                        value={item.unitCost}
                        onChange={e => updateItem(idx, 'unitCost', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200
                                   rounded-lg text-xs focus:outline-none
                                   focus:border-blue-400 text-center"
                      />
                    </div>

                    {/* Remarks row */}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        Pending: {item.pendingQty} {item.unit}
                      </span>
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={e => updateItem(idx, 'remarks', e.target.value)}
                        placeholder="Remarks (e.g. 2 items damaged)…"
                        className="flex-1 px-2.5 py-1 border border-gray-200
                                   rounded-lg text-xs focus:outline-none
                                   focus:border-blue-400 bg-gray-50"
                      />
                    </div>

                    {errors[`item_${idx}`] && (
                      <p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-1">
                        <IconAlertTriangle size={10} />
                        {errors[`item_${idx}`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT 1/3 ────────────────────── */}
        <div className="space-y-5">

          {/* PO summary */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-900 mb-4">PO summary</p>
            <div className="space-y-2.5">
              {[
                { label:'PO Number',  value: po?.poNumber     },
                { label:'Supplier',   value: po?.supplierName },
                { label:'PO Total',   value: fmt(po?.totalAmount || 0) },
                { label:'Status',     value: po?.status       },
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

          {/* GRN total */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-5">
            <p className="text-xs font-medium text-green-700 mb-3">
              This GRN
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Items receiving</span>
                <span className="font-medium text-green-800">
                  {receiveItems.filter(i => parseInt(i.receiveNow) > 0).length}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Total accepted qty</span>
                <span className="font-medium text-green-800">
                  {receiveItems.reduce((a, i) => a + (parseInt(i.acceptedNow) || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-red-500">Total rejected qty</span>
                <span className="font-medium text-red-700">
                  {receiveItems.reduce((a, i) => a + (parseInt(i.rejectedNow) || 0), 0)}
                </span>
              </div>
              <div className="border-t border-green-200 pt-2 flex justify-between">
                <span className="text-sm font-medium text-green-700">
                  Stock value added
                </span>
                <span className="text-sm font-medium text-green-800">
                  {fmt(totalReceiving)}
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-700 mb-2">
              What this does
            </p>
            <ul className="space-y-1.5">
              {[
                'Creates a Goods Receive Note',
                'Adds accepted qty to part stock',
                'Updates part buy price',
                'Updates PO received status',
                'Rejected items do not enter stock',
              ].map((item, i) => (
                <li key={i} className="text-[11px] text-blue-600 flex gap-1.5">
                  <IconCheck size={10} className="text-blue-400 mt-0.5
                                                  flex-shrink-0" />
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