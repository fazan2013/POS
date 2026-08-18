// ================================================
// src/pages/Orders.jsx — with Cancel order button
// ================================================
import { useState, useEffect, useCallback } from 'react'
import {
  IconSearch, IconDownload, IconPrinter,
  IconX, IconCheck, IconClock, IconTruck,
  IconCircleX, IconChevronLeft, IconChevronRight,
  IconPackage, IconCash, IconCreditCard,
  IconBuildingBank, IconRefresh, IconBan,
  IconAlertTriangle
} from '@tabler/icons-react'
import { ordersApi } from '../services/api'
import { getUser } from '../services/api'

// ── Constants ─────────────────────────────────────
const STATUSES  = ['All', 'Completed', 'Processing', 'Shipped', 'Cancelled']
const PAGE_SIZE = 10

const STATUS_STYLES = {
  Completed:  { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  icon: <IconCheck size={10} />     },
  Processing: { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500',   icon: <IconClock size={10} />     },
  Shipped:    { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', icon: <IconTruck size={10} />     },
  Cancelled:  { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400',    icon: <IconCircleX size={10} />   },
}

const PAY_ICONS = {
  Cash:     <IconCash size={13} className="text-gray-400" />,
  Card:     <IconCreditCard size={13} className="text-gray-400" />,
  Transfer: <IconBuildingBank size={13} className="text-gray-400" />,
}

// ── Helpers ───────────────────────────────────────
function Spinner() {
  return (
    <span className="w-4 h-4 border-2 border-white/30 border-t-white
                     rounded-full animate-spin inline-block" />
  )
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || {
    bg: 'bg-gray-50', text: 'text-gray-500',
    dot: 'bg-gray-400', icon: null
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5
                      rounded-full text-[10px] font-medium ${s.bg} ${s.text}`}>
      {s.icon}{status}
    </span>
  )
}

// ── Cancel Confirm Modal ──────────────────────────
function CancelModal({ order, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center
                        justify-center mx-auto mb-4">
          <IconBan size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-medium text-gray-900 text-center mb-2">
          Cancel this order?
        </h3>
        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-center">
          <p className="text-xs font-medium text-blue-600">{order.orderNumber}</p>
          <p className="text-xs text-gray-500 mt-1">{order.customerName}</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            ${order.total?.toFixed(2)}
          </p>
        </div>
        <p className="text-xs text-gray-400 text-center mb-5">
          This will mark the order as cancelled.
          Stock will not be automatically restored.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl
                       text-sm text-gray-600 hover:border-gray-300
                       disabled:opacity-50"
          >
            Keep order
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl
                       text-sm font-medium hover:bg-red-600
                       flex items-center justify-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <><Spinner /> Cancelling…</> : 'Yes, cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Order Detail Modal ────────────────────────────
function OrderModal({ order, onClose, onStatusUpdate, onCancelRequest }) {
  const [updating, setUpdating] = useState(false)
  const currentUser = getUser()
  const isAdmin     = ['Administrator', 'Store Manager'].includes(currentUser?.role)

  async function handleStatus(status) {
    setUpdating(true)
    try {
      await ordersApi.updateStatus(order.id, status)
      onStatusUpdate()
      onClose()
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (!order) return null

  const canCancel = order.status !== 'Cancelled'
  const fmt = v => '$' + (v ?? 0).toFixed(2)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                    justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md
                      overflow-hidden max-h-[90vh] flex flex-col"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4
                        border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {order.orderNumber}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <button onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center
                               border border-gray-200 rounded-lg text-gray-400
                               hover:border-gray-300">
              <IconX size={14} />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1">

          {/* Customer + Payment */}
          <div className="px-5 py-3 border-b border-gray-100
                          flex justify-between">
            <div>
              <p className="text-xs text-gray-400">Customer</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {order.customerName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Payment</p>
              <div className="flex items-center gap-1 mt-0.5 justify-end">
                {PAY_ICONS[order.paymentMethod]}
                <p className="text-sm font-medium text-gray-900">
                  {order.paymentMethod}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wider mb-3">Items</p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-800">{item.partName}</p>
                    <p className="text-xs text-gray-400">
                      ${item.unitPrice?.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ${item.total?.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="px-5 py-3 border-b border-gray-100 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Tax (5%)</span><span>{fmt(order.tax)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Discount</span>
                <span>-{fmt(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-medium
                            text-gray-900 border-t border-gray-100 pt-2">
              <span>Total</span>
              <span>{fmt(order.total)}</span>
            </div>
          </div>

          {/* Admin status controls */}
          {isAdmin && order.status !== 'Cancelled' &&
           order.status !== 'Completed' && (
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Update status</p>
              <div className="flex gap-2 flex-wrap">
                {STATUSES
                  .filter(s => s !== 'All' && s !== order.status && s !== 'Cancelled')
                  .map(s => (
                    <button key={s} onClick={() => handleStatus(s)}
                            disabled={updating}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg
                                       text-xs text-gray-600 hover:border-gray-300
                                       disabled:opacity-50">
                      {updating ? '…' : s}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 flex-shrink-0">

          {/* Cancel button — visible to everyone if not already cancelled */}
          {canCancel && (
            <button
              onClick={() => {
                onClose()
                onCancelRequest(order)
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 border
                         border-red-200 rounded-xl text-xs text-red-500
                         hover:bg-red-50 transition-colors"
            >
              <IconBan size={13} /> Cancel order
            </button>
          )}

          <button onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200
                             rounded-xl text-sm text-gray-600
                             hover:border-gray-300">
            Close
          </button>

          <button onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl
                             text-sm font-medium hover:bg-slate-700
                             flex items-center justify-center gap-2">
            <IconPrinter size={14} /> Print
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Orders Page ──────────────────────────────
export default function Orders() {
  const [data,         setData]         = useState({ data: [], totalCount: 0, totalPages: 1 })
  const [summary,      setSummary]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [activeStatus, setActiveStatus] = useState('All')
  const [page,         setPage]         = useState(1)
  const [selected,     setSelected]     = useState(null)    // order detail modal
  const [cancelTarget, setCancelTarget] = useState(null)    // cancel confirm modal
  const [cancelling,   setCancelling]   = useState(false)
  const [toast,        setToast]        = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  // ── Fetch ─────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [orders, sum] = await Promise.all([
        ordersApi.getAll(
          page, PAGE_SIZE,
          activeStatus === 'All' ? '' : activeStatus
        ),
        ordersApi.getSummary(),
      ])
      setData(orders)
      setSummary(sum)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, activeStatus])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useEffect(() => { setPage(1) },   [activeStatus])

  // ── Cancel order ──────────────────────────────
  async function handleCancelConfirm() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await ordersApi.updateStatus(cancelTarget.id, 'Cancelled')
      showToast(`Order ${cancelTarget.orderNumber} cancelled`, 'success')
      setCancelTarget(null)
      fetchOrders()
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error')
    } finally {
      setCancelling(false)
    }
  }

  // ── Filter by search ──────────────────────────
  const filtered = data.data.filter(o =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5
                         px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                         ${toast.type === 'error'
                           ? 'bg-red-500 text-white'
                           : 'bg-green-600 text-white'}`}>
          {toast.type === 'error'
            ? <IconAlertTriangle size={16} />
            : <IconCheck size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Order detail modal */}
      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={fetchOrders}
          onCancelRequest={order => setCancelTarget(order)}
        />
      )}

      {/* Cancel confirm modal */}
      {cancelTarget && (
        <CancelModal
          order={cancelTarget}
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelTarget(null)}
          loading={cancelling}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Orders</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Track and manage all customer sales
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders}
                  className="w-8 h-8 flex items-center justify-center border
                             border-gray-200 rounded-lg text-gray-500
                             hover:border-gray-300 bg-white">
            <IconRefresh size={14} />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-900
                             text-white rounded-lg text-xs font-medium
                             hover:bg-slate-700">
            <IconDownload size={13} /> Export
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total orders',    value: summary.totalOrders,                    color: 'text-gray-900'   },
            { label: 'Today orders',    value: summary.todayOrders,                    color: 'text-blue-600'   },
            { label: "Today's revenue", value: `$${summary.todayRevenue?.toFixed(2)}`, color: 'text-green-600'  },
            { label: 'Monthly revenue', value: `$${summary.monthlyRevenue?.toFixed(2)}`,color: 'text-purple-600'},
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
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-100
                        flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-44">
            <IconSearch size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search order or customer…"
                   value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg
                              text-xs focus:outline-none focus:border-blue-400 bg-gray-50" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setActiveStatus(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium
                                  transition-all
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
                        grid-cols-[1fr_1.5fr_1.8fr_0.8fr_0.8fr_0.6fr_0.5fr]
                        px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          {['Order ID','Customer','Items','Payment','Status','Total',''].map(h => (
            <p key={h}
               className="text-[10px] font-medium text-gray-400
                          uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-slate-700
                            rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center
                          py-16 text-gray-400 gap-2">
            <IconPackage size={32} className="text-gray-200" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : filtered.map(order => (
          <div key={order.id}
               className="grid grid-cols-1
                          md:grid-cols-[1fr_1.5fr_1.8fr_0.8fr_0.8fr_0.6fr_0.5fr]
                          px-4 py-3.5 border-b border-gray-50 last:border-0
                          hover:bg-gray-50 transition-colors items-center
                          gap-2 md:gap-0">

            {/* Order ID */}
            <div>
              <p className="text-xs font-medium text-blue-600 cursor-pointer
                            hover:underline"
                 onClick={() => setSelected(order)}>
                {order.orderNumber}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Customer */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center
                              justify-center text-[10px] font-medium text-slate-600
                              flex-shrink-0">
                {order.customerName?.charAt(0)}
              </div>
              <p className="text-xs text-gray-800 truncate">{order.customerName}</p>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs text-gray-700 truncate">
                {order.items?.map(i => `${i.partName} ×${i.quantity}`).join(', ')}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {order.items?.reduce((a, i) => a + i.quantity, 0)} parts
              </p>
            </div>

            {/* Payment */}
            <div className="flex items-center gap-1.5">
              {PAY_ICONS[order.paymentMethod]}
              <span className="text-xs text-gray-600">{order.paymentMethod}</span>
            </div>

            {/* Status */}
            <StatusBadge status={order.status} />

            {/* Total */}
            <p className="text-xs font-medium text-gray-900">
              ${order.total?.toFixed(2)}
            </p>

            {/* Cancel button — inline on row */}
            <div className="flex justify-end">
              {order.status !== 'Cancelled' ? (
                <button
                  onClick={e => { e.stopPropagation(); setCancelTarget(order) }}
                  title="Cancel order"
                  className="w-7 h-7 flex items-center justify-center border
                             border-gray-200 rounded-lg text-gray-400
                             hover:border-red-300 hover:text-red-500
                             transition-colors"
                >
                  <IconBan size={13} />
                </button>
              ) : (
                <span className="w-7 h-7 flex items-center justify-center
                                 text-gray-200">
                  <IconBan size={13} />
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3
                        border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {data.totalCount} total orders
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center border
                               border-gray-200 rounded-lg text-gray-500
                               disabled:opacity-40 hover:border-gray-300">
              <IconChevronLeft size={13} />
            </button>
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 flex items-center justify-center
                                  rounded-lg text-xs
                        ${page === p
                          ? 'bg-slate-900 text-white'
                          : 'border border-gray-200 text-gray-500'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="w-7 h-7 flex items-center justify-center border
                               border-gray-200 rounded-lg text-gray-500
                               disabled:opacity-40 hover:border-gray-300">
              <IconChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}