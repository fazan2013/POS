// ================================================
// src/pages/Orders.jsx  — connected to real API
// ================================================
import { useState, useEffect, useCallback } from 'react'
import {
  IconSearch, IconDownload, IconEye, IconPrinter,
  IconX, IconCheck, IconClock, IconTruck,
  IconCircleX, IconChevronLeft, IconChevronRight,
  IconPackage, IconCash, IconCreditCard, IconBuildingBank,
  IconRefresh
} from '@tabler/icons-react'
import { ordersApi } from '../services/api'
import { PageLoader, ErrorBanner, Spinner } from '../hooks/useApi'

const STATUSES   = ['All', 'Completed', 'Processing', 'Shipped', 'Cancelled']
const PAGE_SIZE  = 10

const STATUS_STYLES = {
  Completed:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: <IconCheck size={10} />     },
  Processing: { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: <IconClock size={10} />     },
  Shipped:    { bg: 'bg-purple-50', text: 'text-purple-700', icon: <IconTruck size={10} />     },
  Cancelled:  { bg: 'bg-red-50',    text: 'text-red-700',    icon: <IconCircleX size={10} />   },
}

const PAY_ICONS = {
  Cash:     <IconCash size={13} className="text-gray-400" />,
  Card:     <IconCreditCard size={13} className="text-gray-400" />,
  Transfer: <IconBuildingBank size={13} className="text-gray-400" />,
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: 'bg-gray-50', text: 'text-gray-500', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                      text-[10px] font-medium ${s.bg} ${s.text}`}>
      {s.icon}{status}
    </span>
  )
}

function OrderModal({ order, onClose, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false)

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
  const subtotal = order.subtotal
  const tax      = order.tax
  const discount = order.discount
  const total    = order.total

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <button onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400">
              <IconX size={14} />
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 flex justify-between">
          <div>
            <p className="text-xs text-gray-400">Customer</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{order.customerName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Payment</p>
            <div className="flex items-center gap-1 mt-0.5 justify-end">
              {PAY_ICONS[order.paymentMethod]}
              <p className="text-sm font-medium text-gray-900">{order.paymentMethod}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Items</p>
          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-800">{item.partName}</p>
                  <p className="text-xs text-gray-400">${item.unitPrice?.toFixed(2)} × {item.quantity}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">${item.total?.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span><span>${subtotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Tax (5%)</span><span>${tax?.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>Discount (3%)</span><span>-${discount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-medium text-gray-900 border-t border-gray-100 pt-2">
            <span>Total</span><span>${total?.toFixed(2)}</span>
          </div>
        </div>

        {/* Status update buttons */}
        {order.status !== 'Cancelled' && order.status !== 'Completed' && (
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Update status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.filter(s => s !== 'All' && s !== order.status).map(s => (
                <button key={s} onClick={() => handleStatus(s)} disabled={updating}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs
                                   text-gray-600 hover:border-gray-300 disabled:opacity-50">
                  {updating ? '…' : s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 px-5 py-4">
          <button onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">
            Close
          </button>
          <button className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium
                             flex items-center justify-center gap-2 hover:bg-slate-700">
            <IconPrinter size={14} /> Print invoice
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const [data,         setData]         = useState({ data: [], totalCount: 0, totalPages: 1 })
  const [summary,      setSummary]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [activeStatus, setActiveStatus] = useState('All')
  const [page,         setPage]         = useState(1)
  const [selected,     setSelected]     = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [orders, sum] = await Promise.all([
        ordersApi.getAll(page, PAGE_SIZE, activeStatus === 'All' ? '' : activeStatus),
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

  const filtered = data.data.filter(o =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6 space-y-5">
      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={fetchOrders}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Orders</h1>
          <p className="text-xs text-gray-400 mt-0.5">Track and manage all customer sales</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200
                             rounded-lg text-gray-500 hover:border-gray-300 bg-white">
            <IconRefresh size={14} />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white
                             rounded-lg text-xs font-medium hover:bg-slate-700">
            <IconDownload size={13} /> Export
          </button>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total orders',    value: summary.totalOrders,                              color: 'text-gray-900'   },
            { label: 'Today orders',    value: summary.todayOrders,                              color: 'text-blue-600'   },
            { label: "Today's revenue", value: `$${summary.todayRevenue?.toFixed(2)}`,           color: 'text-green-600'  },
            { label: 'Monthly revenue', value: `$${summary.monthlyRevenue?.toFixed(2)}`,         color: 'text-purple-600' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{c.label}</p>
              <p className={`text-2xl font-medium ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-44">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search order or customer…"
                   value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs
                              focus:outline-none focus:border-blue-400 bg-gray-50" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setActiveStatus(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${activeStatus === s ? 'bg-slate-900 text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table Head */}
        <div className="hidden md:grid grid-cols-[1fr_1.5fr_1.8fr_0.8fr_0.8fr_0.6fr]
                        px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          {['Order ID', 'Customer', 'Items', 'Payment', 'Status', 'Total'].map(h => (
            <p key={h} className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <IconPackage size={32} className="text-gray-200" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : filtered.map(order => (
          <div key={order.id} onClick={() => setSelected(order)}
               className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1.8fr_0.8fr_0.8fr_0.6fr]
                          px-4 py-3.5 border-b border-gray-50 last:border-0
                          hover:bg-gray-50 cursor-pointer transition-colors items-center gap-2 md:gap-0">
            <div>
              <p className="text-xs font-medium text-blue-600">{order.orderNumber}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center
                              text-[10px] font-medium text-slate-600 flex-shrink-0">
                {order.customerName?.charAt(0)}
              </div>
              <p className="text-xs text-gray-800 truncate">{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-700 truncate">
                {order.items?.map(i => `${i.partName} ×${i.quantity}`).join(', ')}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {order.items?.reduce((a, i) => a + i.quantity, 0)} parts
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {PAY_ICONS[order.paymentMethod]}
              <span className="text-xs text-gray-600">{order.paymentMethod}</span>
            </div>
            <StatusBadge status={order.status} />
            <p className="text-xs font-medium text-gray-900">${order.total?.toFixed(2)}</p>
          </div>
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {data.totalCount} total orders
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center border border-gray-200
                               rounded-lg text-gray-500 disabled:opacity-40 hover:border-gray-300">
              <IconChevronLeft size={13} />
            </button>
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs
                        ${page === p ? 'bg-slate-900 text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="w-7 h-7 flex items-center justify-center border border-gray-200
                               rounded-lg text-gray-500 disabled:opacity-40 hover:border-gray-300">
              <IconChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
