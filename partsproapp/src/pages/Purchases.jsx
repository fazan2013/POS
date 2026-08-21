
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconPlus, IconSearch, IconRefresh, IconFileInvoice,
  IconTruck, IconCheck, IconClock, IconCircleX,
  IconChevronLeft, IconChevronRight, IconAlertTriangle,
  IconPackage, IconBan, IconX
} from '@tabler/icons-react'
import { purchaseApi, fmt } from '../services/api'

// ── Constants ─────────────────────────────────────
const STATUSES = [
  'All', 'Draft', 'Approved', 'Sent',
  'PartiallyReceived', 'FullyReceived', 'Invoiced', 'Closed', 'Cancelled'
]

const STATUS_STYLE = {
  Draft:             { bg:'bg-gray-100',   text:'text-gray-600',   dot:'bg-gray-400'   },
  Approved:          { bg:'bg-blue-50',    text:'text-blue-700',   dot:'bg-blue-500'   },
  Sent:              { bg:'bg-purple-50',  text:'text-purple-700', dot:'bg-purple-500' },
  PartiallyReceived: { bg:'bg-amber-50',   text:'text-amber-700',  dot:'bg-amber-500'  },
  FullyReceived:     { bg:'bg-green-50',   text:'text-green-700',  dot:'bg-green-500'  },
  Invoiced:          { bg:'bg-teal-50',    text:'text-teal-700',   dot:'bg-teal-500'   },
  Closed:            { bg:'bg-slate-100',  text:'text-slate-600',  dot:'bg-slate-400'  },
  Cancelled:         { bg:'bg-red-50',     text:'text-red-600',    dot:'bg-red-400'    },
}

const PAGE_SIZE = 10

// ── Helpers ───────────────────────────────────────
function Spinner() {
  return <div className="w-6 h-6 border-2 border-gray-200 border-t-slate-700 rounded-full animate-spin" />
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Draft
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5
                      rounded-full text-[10px] font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status === 'PartiallyReceived' ? 'Partial' :
       status === 'FullyReceived'     ? 'Received' : status}
    </span>
  )
}

// ── Summary cards ─────────────────────────────────
function SummaryCards({ summary }) {
  if (!summary) return null
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
      {[
        { label:'Total POs',        value: summary.totalPOs,
          color:'text-gray-900' },
        { label:'Drafts',           value: summary.draftPOs,
          color:'text-gray-500' },
        { label:'Pending receive',  value: summary.pendingReceive,
          color:'text-amber-600' },
        { label:'Pending invoice',  value: summary.pendingInvoice,
          color:'text-blue-600' },
        { label:'Total value',      value: fmt(summary.totalPurchaseValue),
          color:'text-green-600' },
        { label:'Unpaid amount',    value: fmt(summary.totalUnpaidAmount),
          color:'text-red-500' },
      ].map(c => (
        <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            {c.label}
          </p>
          <p className={`text-lg font-medium ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────
export default function Purchases() {
  const navigate = useNavigate()

  const [data,     setData]     = useState([])
  const [summary,  setSummary]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('All')
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(0)
  const [pages,    setPages]    = useState(1)
  const [acting,   setActing]   = useState(null) // id of PO being acted on

  const [toast, setToast] = useState(null)
  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  // ── Fetch ─────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, sum] = await Promise.all([
        purchaseApi.getAll(page, PAGE_SIZE, status === 'All' ? '' : status),
        purchaseApi.getSummary(),
      ])
      setData(list)
      setSummary(sum)
      setTotal(list.length)
      setPages(Math.ceil(list.length / PAGE_SIZE) || 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { setPage(1) }, [status])

  // ── Quick actions ─────────────────────────────
  async function handleApprove(po) {
    setActing(po.id)
    try {
      await purchaseApi.approve(po.id)
      showToast(`${po.poNumber} approved ✓`)
      fetchAll()
    } catch (err) { showToast(err.message, 'error') }
    finally { setActing(null) }
  }

  async function handleSend(po) {
    setActing(po.id)
    try {
      await purchaseApi.send(po.id)
      showToast(`${po.poNumber} sent to supplier ✓`)
      fetchAll()
    } catch (err) { showToast(err.message, 'error') }
    finally { setActing(null) }
  }

  async function handleCancel(po) {
    if (!confirm(`Cancel ${po.poNumber}? This cannot be undone.`)) return
    setActing(po.id)
    try {
      await purchaseApi.cancel(po.id)
      showToast(`${po.poNumber} cancelled`)
      fetchAll()
    } catch (err) { showToast(err.message, 'error') }
    finally { setActing(null) }
  }

  // ── Filter by search ──────────────────────────
  const filtered = data.filter(p =>
    p.poNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3
                         rounded-xl shadow-lg text-sm font-medium
                         ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}
                         text-white`}>
          {toast.type === 'error'
            ? <IconAlertTriangle size={15} /> : <IconCheck size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Purchase orders</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage supplier orders and goods receiving
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll}
                  className="w-8 h-8 flex items-center justify-center border
                             border-gray-200 rounded-lg text-gray-500
                             hover:border-gray-300 bg-white">
            <IconRefresh size={14} />
          </button>
          <button onClick={() => navigate('/purchases/new')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900
                             text-white rounded-lg text-xs font-medium
                             hover:bg-slate-700">
            <IconPlus size={13} /> New PO
          </button>
        </div>
      </div>

      {/* Summary */}
      <SummaryCards summary={summary} />

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

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-100
                        flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-44">
            <IconSearch size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search PO number or supplier…"
                   value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg
                              text-xs focus:outline-none focus:border-blue-400 bg-gray-50" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['All','Draft','Approved','Sent','PartiallyReceived','FullyReceived','Invoiced','Closed'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${status === s
                          ? 'bg-slate-900 text-white'
                          : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {s === 'PartiallyReceived' ? 'Partial' :
                 s === 'FullyReceived'     ? 'Received' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Table head */}
        <div className="hidden md:grid
                        grid-cols-[1.2fr_1.8fr_1fr_1fr_0.8fr_0.8fr_0.8fr]
                        px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          {['PO Number','Supplier','Order Date','Expected','Items','Total','Status',''].map(h => (
            <p key={h} className="text-[10px] font-medium text-gray-400
                                  uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2
                          text-gray-400">
            <IconFileInvoice size={32} className="text-gray-200" />
            <p className="text-sm">No purchase orders found</p>
          </div>
        ) : filtered.map(po => (
          <div key={po.id}
               className="grid grid-cols-1
                          md:grid-cols-[1.2fr_1.8fr_1fr_1fr_0.8fr_0.8fr_0.8fr]
                          px-4 py-3.5 border-b border-gray-50 last:border-0
                          hover:bg-gray-50 transition-colors items-center
                          gap-2 md:gap-0">

            {/* PO Number */}
            <div>
              <button
                onClick={() => navigate(`/purchases/${po.id}`)}
                className="text-xs font-medium text-blue-600 hover:underline">
                {po.poNumber}
              </button>
            </div>

            {/* Supplier */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center
                              justify-center text-[10px] font-medium text-slate-600
                              flex-shrink-0">
                {po.supplierName?.charAt(0)}
              </div>
              <p className="text-xs text-gray-800 truncate">{po.supplierName}</p>
            </div>

            {/* Dates */}
            <p className="text-xs text-gray-600">
              {new Date(po.orderDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-600">
              {po.expectedDate
                ? new Date(po.expectedDate).toLocaleDateString()
                : '—'}
            </p>

            {/* Items progress */}
            <div>
              <p className="text-xs text-gray-700">
                {po.receivedCount}/{po.itemCount} items
              </p>
              <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full"
                     style={{ width: po.itemCount > 0
                       ? `${(po.receivedCount / po.itemCount) * 100}%` : '0%' }} />
              </div>
            </div>

            {/* Total */}
            <p className="text-xs font-medium text-gray-900">
              {fmt(po.totalAmount)}
            </p>

            {/* Status */}
            <StatusBadge status={po.status} />

            {/* Actions */}
            <div className="flex gap-1.5 justify-end">
              {po.status === 'Draft' && (
                <button
                  onClick={() => handleApprove(po)}
                  disabled={acting === po.id}
                  title="Approve"
                  className="px-2.5 py-1.5 bg-blue-500 text-white rounded-lg
                             text-[10px] font-medium hover:bg-blue-600
                             disabled:opacity-50">
                  Approve
                </button>
              )}
              {po.status === 'Approved' && (
                <button
                  onClick={() => handleSend(po)}
                  disabled={acting === po.id}
                  title="Send to supplier"
                  className="px-2.5 py-1.5 bg-purple-500 text-white rounded-lg
                             text-[10px] font-medium hover:bg-purple-600
                             disabled:opacity-50">
                  Send
                </button>
              )}
              {po.status === 'Sent' || po.status === 'PartiallyReceived' ? (
                <button
                  onClick={() => navigate(`/purchases/${po.id}/receive`)}
                  className="px-2.5 py-1.5 bg-green-500 text-white rounded-lg
                             text-[10px] font-medium hover:bg-green-600">
                  Receive
                </button>
              ) : null}
              {po.status === 'FullyReceived' && (
                <button
                  onClick={() => navigate(`/purchases/${po.id}/invoice`)}
                  className="px-2.5 py-1.5 bg-teal-500 text-white rounded-lg
                             text-[10px] font-medium hover:bg-teal-600">
                  Invoice
                </button>
              )}
              {['Draft','Approved','Sent'].includes(po.status) && (
                <button
                  onClick={() => handleCancel(po)}
                  disabled={acting === po.id}
                  title="Cancel"
                  className="w-7 h-7 flex items-center justify-center border
                             border-gray-200 rounded-lg text-gray-400
                             hover:border-red-300 hover:text-red-500
                             transition-colors disabled:opacity-50">
                  <IconBan size={13} />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3
                        border-t border-gray-100">
          <p className="text-xs text-gray-400">{total} orders</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center border
                               border-gray-200 rounded-lg text-gray-500
                               disabled:opacity-40">
              <IconChevronLeft size={13} />
            </button>
            <span className="w-7 h-7 flex items-center justify-center text-xs
                             font-medium text-gray-700">
              {page}
            </span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))}
                    disabled={page === pages}
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