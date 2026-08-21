// ================================================
// src/pages/PurchaseDetail.jsx
// PO detail — items, GRN history, invoice payment
// ================================================
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  IconArrowLeft, IconCheck, IconTruck, IconFileInvoice,
  IconPackage, IconAlertTriangle, IconEdit,
  IconCash, IconCreditCard, IconBuildingBank,
  IconClipboardCheck, IconX
} from '@tabler/icons-react'
import { purchaseApi, grnApi, invoiceApi, fmt } from '../services/api'

// ── Status styles ─────────────────────────────────
const STATUS_STYLE = {
  Draft:             'bg-gray-100 text-gray-600',
  Approved:          'bg-blue-50 text-blue-700',
  Sent:              'bg-purple-50 text-purple-700',
  PartiallyReceived: 'bg-amber-50 text-amber-700',
  FullyReceived:     'bg-green-50 text-green-700',
  Invoiced:          'bg-teal-50 text-teal-700',
  Closed:            'bg-slate-100 text-slate-600',
  Cancelled:         'bg-red-50 text-red-600',
}

// ── Payment modal ─────────────────────────────────
function PaymentModal({ invoice, onConfirm, onCancel, loading }) {
  const [payMethod, setPayMethod] = useState('Bank Transfer')
  const refRef = useRef(null)

  function handleSubmit() {
    const ref = refRef.current?.value?.trim() || ''
    onConfirm(payMethod, ref)
  }

  const PAY_METHODS = [
    { value: 'Bank Transfer', icon: <IconBuildingBank size={15} /> },
    { value: 'Cash',          icon: <IconCash size={15} />         },
    { value: 'Card',          icon: <IconCreditCard size={15} />   },
    { value: 'Cheque',        icon: <IconClipboardCheck size={15} /> },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                    justify-center p-4"
         onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-center">
          <div className="w-10 h-10 bg-green-400 rounded-full flex items-center
                          justify-center mx-auto mb-3">
            <IconCash size={20} className="text-slate-900" />
          </div>
          <p className="text-base font-medium text-white">Record payment</p>
          <p className="text-xs text-slate-400 mt-1">
            {invoice.invoiceNumber} · {fmt(invoice.totalAmount)}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Payment method */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase
                          tracking-wider mb-2">Payment method</p>
            <div className="grid grid-cols-2 gap-2">
              {PAY_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPayMethod(m.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl
                              border text-xs transition-all
                              ${payMethod === m.value
                                ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <span className={payMethod === m.value
                    ? 'text-blue-500' : 'text-gray-400'}>
                    {m.icon}
                  </span>
                  {m.value}
                </button>
              ))}
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase
                              tracking-wider mb-1.5">
              Payment reference
              <span className="text-gray-400 normal-case font-normal ml-1">
                (optional)
              </span>
            </label>
            <input
              ref={refRef}
              type="text"
              placeholder="e.g. TXN-2026-001234, Cheque #456"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                         text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-1.5">
            {[
              { label: 'Invoice',  value: invoice.invoiceNumber },
              { label: 'Supplier', value: invoice.supplierName  },
              { label: 'Amount',   value: fmt(invoice.totalAmount) },
              { label: 'Due date', value: invoice.dueDate
                  ? new Date(invoice.dueDate).toLocaleDateString() : '—' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{r.label}</span>
                <span className="text-xs font-medium text-gray-800">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl
                             text-sm text-gray-600 hover:border-gray-300">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl
                             text-sm font-medium hover:bg-green-700
                             flex items-center justify-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin" /> Recording…</>
              : <><IconCheck size={15} /> Mark as paid</>}
          </button>
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════
export default function PurchaseDetail() {
  const navigate = useNavigate()
  const { id }   = useParams()

  const [po,       setPo]      = useState(null)
  const [grns,     setGrns]    = useState([])
  const [invoices, setInvoices]= useState([])
  const [loading,  setLoading] = useState(true)
  const [acting,   setActing]  = useState(null)   // PO action (approve/send)
  const [actingInv,setActingInv]=useState(null)   // invoice action id
  const [payModal, setPayModal] = useState(null)  // invoice to pay
  const [toast,    setToast]   = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  // ── Load all data ──────────────────────────────
  async function loadAll() {
    setLoading(true)
    try {
      const [poData, grnData, invData] = await Promise.all([
        purchaseApi.getById(id),
        grnApi.getAll(1, 50, parseInt(id)),
        invoiceApi.getAll(1, 50),
      ])
      setPo(poData)
      setGrns(grnData || [])
      setInvoices((invData || []).filter(
        i => i.purchaseOrderId === parseInt(id)))
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [id])

  // ── PO actions ────────────────────────────────
  async function handleApprove() {
    setActing('approve')
    try {
      await purchaseApi.approve(id)
      showToast('PO approved ✓')
      await loadAll()
    } catch (err) { showToast(err.message, 'error') }
    finally { setActing(null) }
  }

  async function handleSend() {
    setActing('send')
    try {
      await purchaseApi.send(id)
      showToast('Sent to supplier ✓')
      await loadAll()
    } catch (err) { showToast(err.message, 'error') }
    finally { setActing(null) }
  }

  // ── Invoice actions ───────────────────────────
  async function handleApproveInvoice(inv) {
    setActingInv(inv.id)
    try {
      await invoiceApi.updateStatus(inv.id, {
        status: 'Approved',
        notes:  'Approved for payment',
      })
      showToast('Invoice approved ✓')
      await loadAll()
    } catch (err) { showToast(err.message, 'error') }
    finally { setActingInv(null) }
  }

  async function handleMarkPaid(inv, paymentMethod, paymentReference) {
    setActingInv(inv.id)
    try {
      await invoiceApi.updateStatus(inv.id, {
        status:           'Paid',
        paymentMethod,
        paymentReference: paymentReference || null,
      })
      showToast('Payment recorded — PO is now Closed ✓')
      setPayModal(null)
      await loadAll()
    } catch (err) { showToast(err.message, 'error') }
    finally { setActingInv(null) }
  }

  async function handleDisputeInvoice(inv) {
    const reason = prompt('Reason for dispute:')
    if (!reason) return
    setActingInv(inv.id)
    try {
      await invoiceApi.updateStatus(inv.id, {
        status: 'Disputed',
        notes:  reason,
      })
      showToast('Invoice marked as disputed')
      await loadAll()
    } catch (err) { showToast(err.message, 'error') }
    finally { setActingInv(null) }
  }

  // ── Loading state ─────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
        <div className="w-7 h-7 border-2 border-gray-200 border-t-slate-700
                        rounded-full animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    )
  }

  if (!po) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <IconAlertTriangle size={28} className="text-red-400" />
        <p className="text-sm text-gray-600">Purchase order not found</p>
        <button onClick={() => navigate('/purchases')}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">
          Back to purchases
        </button>
      </div>
    )
  }

  const statusClass = STATUS_STYLE[po.status] || 'bg-gray-100 text-gray-600'

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

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

      {/* Payment modal */}
      {payModal && (
        <PaymentModal
          invoice={payModal}
          loading={actingInv === payModal.id}
          onCancel={() => setPayModal(null)}
          onConfirm={(method, ref) => handleMarkPaid(payModal, method, ref)}
        />
      )}

      {/* ── Header ──────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/purchases')}
                  className="w-8 h-8 flex items-center justify-center border
                             border-gray-200 rounded-lg text-gray-500">
            <IconArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-medium text-gray-900">{po.poNumber}</h1>
              <span className={`text-[10px] font-medium px-2 py-0.5
                               rounded-full ${statusClass}`}>
                {po.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {po.supplierName} · Created{' '}
              {new Date(po.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* PO action buttons */}
        <div className="flex gap-2 flex-wrap">
          {po.status === 'Draft' && (
            <>
              <button onClick={() => navigate(`/purchases/${id}/edit`)}
                      className="flex items-center gap-1.5 px-3 py-2 border
                                 border-gray-200 rounded-lg text-xs text-gray-600
                                 hover:border-gray-300">
                <IconEdit size={13} /> Edit
              </button>
              <button onClick={handleApprove} disabled={acting === 'approve'}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-500
                                 text-white rounded-lg text-xs font-medium
                                 hover:bg-blue-600 disabled:opacity-50">
                <IconCheck size={13} />
                {acting === 'approve' ? 'Approving…' : 'Approve PO'}
              </button>
            </>
          )}
          {po.status === 'Approved' && (
            <button onClick={handleSend} disabled={acting === 'send'}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-500
                               text-white rounded-lg text-xs font-medium
                               hover:bg-purple-600 disabled:opacity-50">
              <IconTruck size={13} />
              {acting === 'send' ? 'Sending…' : 'Send to supplier'}
            </button>
          )}
          {(po.status === 'Sent' || po.status === 'PartiallyReceived') && (
            <button onClick={() => navigate(`/purchases/${id}/receive`)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-600
                               text-white rounded-lg text-xs font-medium
                               hover:bg-green-700">
              <IconPackage size={13} /> Receive goods
            </button>
          )}
          {po.status === 'FullyReceived' && (
            <button onClick={() => navigate(`/purchases/${id}/invoice`)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-teal-600
                               text-white rounded-lg text-xs font-medium
                               hover:bg-teal-700">
              <IconFileInvoice size={13} /> Create invoice
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT 2/3 ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* PO Items table */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">Order items</p>
            </div>

            {/* Head */}
            <div className="grid grid-cols-[2fr_0.7fr_0.7fr_0.7fr_0.8fr_0.8fr]
                            px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              {['Part','Ordered','Received','Pending','Unit cost','Total'].map(h => (
                <p key={h} className="text-[9px] font-medium text-gray-400
                                      uppercase tracking-wider">{h}</p>
              ))}
            </div>

            {po.items.map(item => (
              <div key={item.id}
                   className="grid grid-cols-[2fr_0.7fr_0.7fr_0.7fr_0.8fr_0.8fr]
                              px-5 py-3.5 border-b border-gray-50 last:border-0
                              items-center">
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {item.partName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {item.partCode}
                  </p>
                </div>
                <p className="text-xs text-gray-700">
                  {item.orderedQty} {item.unit}
                </p>
                <p className="text-xs text-green-600 font-medium">
                  {item.receivedQty}
                </p>
                <p className={`text-xs font-medium
                  ${item.pendingQty > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {item.pendingQty}
                </p>
                <p className="text-xs text-gray-700">{fmt(item.unitCost)}</p>
                <p className="text-xs font-medium text-gray-900">
                  {fmt(item.totalCost)}
                </p>
              </div>
            ))}

            {/* Total row */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100
                            flex justify-between items-center">
              <p className="text-xs font-medium text-gray-700">
                {po.receivedItems}/{po.totalItems} items received
              </p>
              <p className="text-sm font-medium text-gray-900">
                {fmt(po.totalAmount)}
              </p>
            </div>
          </div>

          {/* GRN History */}
          {grns.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  Goods receive history
                </p>
              </div>
              {grns.map(grn => (
                <div key={grn.id}
                     className="flex items-center justify-between px-5 py-3.5
                                border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-blue-600">
                      {grn.grnNumber}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(grn.receivedDate).toLocaleDateString()} ·{' '}
                      {grn.itemCount} items
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5
                                   rounded-full
                    ${grn.status === 'FullyReceived'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'}`}>
                    {grn.status === 'FullyReceived' ? 'Fully received' : 'Partial'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── Invoice panel with payment UI ───── */}
          {invoices.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  Supplier invoice
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Payment status and approval
                </p>
              </div>

              {invoices.map(inv => (
                <div key={inv.id} className="p-5 border-b border-gray-50 last:border-0">

                  {/* Invoice header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                        {inv.dueDate && (
                          <span className={
                            new Date(inv.dueDate) < new Date() &&
                            inv.status !== 'Paid'
                              ? ' text-red-400' : ''
                          }>
                            {' '}· Due{' '}
                            {new Date(inv.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900">
                        {fmt(inv.totalAmount)}
                      </p>
                      <span className={`text-[10px] font-medium px-2 py-0.5
                                       rounded-full inline-block mt-1
                        ${inv.status === 'Paid'
                          ? 'bg-green-50 text-green-700'
                          : inv.status === 'Approved'
                          ? 'bg-blue-50 text-blue-700'
                          : inv.status === 'Matched'
                          ? 'bg-teal-50 text-teal-700'
                          : inv.status === 'Disputed'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gray-100 text-gray-600'}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>

                  {/* 3-way match result */}
                  <div className={`flex items-start gap-2.5 px-3 py-2.5
                                   rounded-xl border mb-4
                    ${inv.isMatched
                      ? 'bg-green-50 border-green-100'
                      : 'bg-amber-50 border-amber-100'}`}>
                    {inv.isMatched
                      ? <IconCheck size={14}
                          className="text-green-500 flex-shrink-0 mt-0.5" />
                      : <IconAlertTriangle size={14}
                          className="text-amber-500 flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className={`text-xs font-medium
                        ${inv.isMatched ? 'text-green-700' : 'text-amber-700'}`}>
                        {inv.isMatched
                          ? '3-way match passed'
                          : '3-way match — discrepancy found'}
                      </p>
                      {inv.discrepancyNotes && (
                        <p className="text-[10px] text-amber-600 mt-0.5">
                          {inv.discrepancyNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment details — shown when Paid */}
                  {inv.status === 'Paid' && (
                    <div className="bg-green-50 border border-green-100
                                    rounded-xl px-4 py-3 mb-4">
                      <p className="text-[10px] font-medium text-green-600
                                    uppercase tracking-wider mb-2">
                        Payment recorded
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Paid on',
                            value: inv.paidDate
                              ? new Date(inv.paidDate).toLocaleDateString()
                              : '—' },
                          { label: 'Method',
                            value: inv.paymentMethod || '—' },
                          { label: 'Reference',
                            value: inv.paymentReference || '—' },
                        ].map(r => (
                          <div key={r.label}>
                            <p className="text-[10px] text-green-600">{r.label}</p>
                            <p className="text-xs font-medium text-green-800 mt-0.5">
                              {r.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">

                    {/* Approve — for Pending or Matched */}
                    {(inv.status === 'Pending' || inv.status === 'Matched') && (
                      <button
                        onClick={() => handleApproveInvoice(inv)}
                        disabled={actingInv === inv.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-500
                                   text-white rounded-xl text-xs font-medium
                                   hover:bg-blue-600 disabled:opacity-50
                                   transition-colors">
                        {actingInv === inv.id
                          ? <><span className="w-3.5 h-3.5 border border-white/30
                                               border-t-white rounded-full
                                               animate-spin" /> Approving…</>
                          : <><IconClipboardCheck size={13} /> Approve invoice</>}
                      </button>
                    )}

                    {/* Mark as paid — for Approved */}
                    {inv.status === 'Approved' && (
                      <button
                        onClick={() => setPayModal(inv)}
                        disabled={actingInv === inv.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600
                                   text-white rounded-xl text-xs font-medium
                                   hover:bg-green-700 disabled:opacity-50
                                   transition-colors">
                        <IconCash size={13} /> Record payment
                      </button>
                    )}

                    {/* Dispute — for Pending/Matched/Approved */}
                    {['Pending', 'Matched', 'Approved'].includes(inv.status) && (
                      <button
                        onClick={() => handleDisputeInvoice(inv)}
                        disabled={actingInv === inv.id}
                        className="flex items-center gap-1.5 px-4 py-2 border
                                   border-red-200 text-red-500 rounded-xl text-xs
                                   font-medium hover:bg-red-50 disabled:opacity-50
                                   transition-colors">
                        <IconAlertTriangle size={13} /> Dispute
                      </button>
                    )}

                    {/* Paid badge */}
                    {inv.status === 'Paid' && (
                      <div className="flex items-center gap-1.5 px-4 py-2
                                      bg-green-100 text-green-700 rounded-xl
                                      text-xs font-medium">
                        <IconCheck size={13} /> Payment complete
                      </div>
                    )}

                    {/* Disputed badge */}
                    {inv.status === 'Disputed' && (
                      <div className="flex items-center gap-1.5 px-4 py-2
                                      bg-red-50 text-red-600 rounded-xl
                                      text-xs font-medium">
                        <IconAlertTriangle size={13} /> Under dispute — contact admin
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT 1/3 ─────────────────────────── */}
        <div className="space-y-5">

          {/* PO details card */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-900 mb-4">Details</p>
            <div className="space-y-3">
              {[
                { label: 'Supplier',
                  value: po.supplierName },
                { label: 'Reference',
                  value: po.reference || '—' },
                { label: 'Order date',
                  value: new Date(po.orderDate).toLocaleDateString() },
                { label: 'Expected date',
                  value: po.expectedDate
                    ? new Date(po.expectedDate).toLocaleDateString() : '—' },
                { label: 'Sub total',
                  value: fmt(po.subTotal) },
                { label: 'Tax',
                  value: fmt(po.taxAmount) },
                { label: 'Total',
                  value: fmt(po.totalAmount) },
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

          {/* Notes */}
          {po.notes && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-xs text-gray-700 leading-relaxed">{po.notes}</p>
            </div>
          )}

          {/* Status timeline */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wider mb-4">
              Status timeline
            </p>
            <div className="space-y-3">
              {[
                {
                  label:   'Draft',
                  done:    true,
                  current: po.status === 'Draft',
                },
                {
                  label:   'Approved',
                  done:    ['Approved','Sent','PartiallyReceived',
                            'FullyReceived','Invoiced','Closed'].includes(po.status),
                  current: po.status === 'Approved',
                },
                {
                  label:   'Sent to supplier',
                  done:    ['Sent','PartiallyReceived','FullyReceived',
                            'Invoiced','Closed'].includes(po.status),
                  current: po.status === 'Sent',
                },
                {
                  label:   'Goods received',
                  done:    ['PartiallyReceived','FullyReceived',
                            'Invoiced','Closed'].includes(po.status),
                  current: po.status === 'PartiallyReceived'
                           || po.status === 'FullyReceived',
                  partial: po.status === 'PartiallyReceived',
                },
                {
                  label:   'Invoiced',
                  done:    ['Invoiced','Closed'].includes(po.status),
                  current: po.status === 'Invoiced',
                },
                {
                  label:   'Closed',
                  done:    po.status === 'Closed',
                  current: po.status === 'Closed',
                },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center
                                   justify-center flex-shrink-0 transition-colors
                    ${step.current && !step.done
                      ? 'bg-blue-200 ring-2 ring-blue-300'
                      : step.done
                      ? step.partial
                        ? 'bg-amber-400'
                        : 'bg-green-500'
                      : 'bg-gray-200'}`}>
                    {step.done && (
                      <IconCheck size={11} className="text-white" />
                    )}
                  </div>
                  <p className={`text-xs
                    ${step.current
                      ? 'text-gray-900 font-medium'
                      : step.done
                      ? 'text-gray-700'
                      : 'text-gray-400'}`}>
                    {step.label}
                    {step.partial && (
                      <span className="text-amber-500 ml-1">(partial)</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}