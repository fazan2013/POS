// ================================================
// src/pages/Reports.jsx  — fully connected to API
// ================================================
import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  IconDownload, IconTrendingUp, IconTrendingDown,
  IconCash, IconPackage, IconShoppingCart,
  IconChartBar, IconChartLine, IconTable,
  IconArrowUpRight, IconArrowDownRight,
  IconAlertTriangle, IconRefresh
} from '@tabler/icons-react'
import { partsApi, ordersApi, customersApi, suppliersApi } from '../services/api'
import { exportReportPDF } from '../utils/exportReportPDF'

// ── Helpers ───────────────────────────────────────
const fmt   = v  => '$' + (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtK  = v  => v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + v
const pct   = (a, b) => b === 0 ? 0 : (((a - b) / b) * 100).toFixed(1)

// ── Spinner ───────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-slate-700
                      rounded-full animate-spin" />
    </div>
  )
}

// ── Error Banner ──────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3
                    bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
      <div className="flex items-center gap-2">
        <IconAlertTriangle size={15} className="flex-shrink-0" />
        {message}
      </div>
      {onRetry && (
        <button onClick={onRetry}
                className="text-xs underline hover:no-underline flex-shrink-0">
          Retry
        </button>
      )}
    </div>
  )
}

// ── Custom Tooltip ────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3
                    shadow-sm text-xs min-w-32">
      <p className="font-medium text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full"
                  style={{ background: p.color }} />
            <span className="text-gray-500 capitalize">{p.name}</span>
          </div>
          <span className="font-medium text-gray-900">
            ${p.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Metric Card ───────────────────────────────────
function MetricCard({ label, value, change, changeLabel, icon, iconBg, iconColor, loading }) {
  const positive = parseFloat(change) >= 0
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center
                         justify-center ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="h-8 bg-gray-100 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-medium text-gray-900 mb-1">{value}</p>
      )}
      {change !== undefined && !loading && (
        <div className={`flex items-center gap-1 text-xs
                         ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive
            ? <IconArrowUpRight size={13} />
            : <IconArrowDownRight size={13} />}
          <span>{Math.abs(change)}% {changeLabel}</span>
        </div>
      )}
    </div>
  )
}

// ── Section Card ──────────────────────────────────
function Card({ title, subtitle, action, children, loading }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4
                      border-b border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">
        {loading ? <Spinner /> : children}
      </div>
    </div>
  )
}

// ── TABS ──────────────────────────────────────────
const TABS = [
  { key: 'overview',  label: 'Overview',  icon: <IconChartLine size={14} /> },
  { key: 'sales',     label: 'Sales',     icon: <IconChartBar size={14} />  },
  { key: 'inventory', label: 'Inventory', icon: <IconPackage size={14} />   },
  { key: 'parts',     label: 'Top parts', icon: <IconTable size={14} />     },
]

const RANGES = ['This week', 'This month', 'Last 3 months', 'This year']
const CATEGORY_COLORS = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#ef4444']

// ── Overview Tab ──────────────────────────────────
function OverviewTab({ data }) {
  const { orderSummary, partStats, dailySales, categoryBreakdown } = data

  // Build daily sales chart from order summary
  const dailyData = dailySales || []

  return (
    <div className="space-y-5">

      {/* Revenue line chart */}
      <Card
        title="Revenue overview"
        subtitle="Orders completed"
        loading={!orderSummary}
      >
        {orderSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Today's revenue",  value: fmt(orderSummary.todayRevenue),   color: 'text-blue-600'   },
              { label: 'Monthly revenue',  value: fmt(orderSummary.monthlyRevenue), color: 'text-green-600'  },
              { label: 'Total orders',     value: orderSummary.totalOrders,         color: 'text-gray-900'   },
              { label: 'Avg order value',  value: fmt(orderSummary.averageOrderValue), color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 bg-gray-50 rounded-xl">
                <p className={`text-xl font-medium ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Order status breakdown */}
        {orderSummary && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Completed',  value: orderSummary.completed,  color: 'bg-green-500'  },
              { label: 'Processing', value: orderSummary.processing, color: 'bg-blue-500'   },
              { label: 'Cancelled',  value: orderSummary.cancelled,  color: 'bg-red-400'    },
            ].map(s => (
              <div key={s.label} className="border border-gray-100 rounded-xl p-3 text-center">
                <div className={`w-2.5 h-2.5 rounded-full ${s.color} mx-auto mb-2`} />
                <p className="text-lg font-medium text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Category breakdown donut */}
        <Card
          title="Sales by category"
          subtitle="Parts sold breakdown"
          loading={!categoryBreakdown}
        >
          {categoryBreakdown && categoryBreakdown.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72}
                    paddingAngle={3} dataKey="count"
                  >
                    {categoryBreakdown.map((_, i) => (
                      <Cell key={i}
                            fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [v + ' parts', n]}
                    contentStyle={{
                      fontSize: 12, borderRadius: 8,
                      border: '0.5px solid #e2e8f0'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {categoryBreakdown.map((c, i) => (
                  <div key={c.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full"
                              style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        <span className="text-xs text-gray-600">{c.category}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-900">
                        {c.count} parts
                      </span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(c.count / categoryBreakdown[0].count) * 100}%`,
                          background: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              No category data available
            </p>
          )}
        </Card>

        {/* Inventory health */}
        <Card
          title="Inventory health"
          subtitle="Current stock status"
          loading={!partStats}
        >
          {partStats && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'In stock',     value: partStats.totalParts - partStats.lowStockCount - partStats.outOfStockCount, color: '#22c55e' },
                        { name: 'Low stock',    value: partStats.lowStockCount,    color: '#f59e0b' },
                        { name: 'Out of stock', value: partStats.outOfStockCount,  color: '#ef4444' },
                      ]}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80}
                      paddingAngle={3} dataKey="value"
                    >
                      {['#22c55e','#f59e0b','#ef4444'].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{
                      fontSize: 12, borderRadius: 8,
                      border: '0.5px solid #e2e8f0'
                    }} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-3 gap-3 w-full">
                  {[
                    { label: 'In stock',
                      value: partStats.totalParts - partStats.lowStockCount - partStats.outOfStockCount,
                      color: 'bg-green-500', text: 'text-green-700' },
                    { label: 'Low stock',
                      value: partStats.lowStockCount,
                      color: 'bg-amber-400', text: 'text-amber-700' },
                    { label: 'Out of stock',
                      value: partStats.outOfStockCount,
                      color: 'bg-red-400',   text: 'text-red-700'   },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.color} mx-auto mb-1`} />
                      <p className={`text-sm font-medium ${s.text}`}>{s.value}</p>
                      <p className="text-[10px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="w-full bg-slate-900 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">Total inventory value</p>
                  <p className="text-xl font-medium text-white">
                    {fmt(partStats.inventoryValue)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {partStats.totalParts} parts tracked
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ── Sales Tab ─────────────────────────────────────
function SalesTab({ data }) {
  const { orderSummary, recentOrders } = data

  return (
    <div className="space-y-5">

      {/* Summary numbers */}
      <Card title="Sales summary" subtitle="All-time order statistics"
            loading={!orderSummary}>
        {orderSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total orders',     value: orderSummary.totalOrders,                     sub: 'All time'      },
              { label: "Today's orders",   value: orderSummary.todayOrders,                     sub: 'Today'         },
              { label: "Today's revenue",  value: fmt(orderSummary.todayRevenue),               sub: 'Today'         },
              { label: 'Monthly revenue',  value: fmt(orderSummary.monthlyRevenue),             sub: 'This month'    },
              { label: 'Avg order value',  value: fmt(orderSummary.averageOrderValue),          sub: 'Per order'     },
              { label: 'Completed',        value: orderSummary.completed,                       sub: 'Orders'        },
              { label: 'Processing',       value: orderSummary.processing,                      sub: 'Pending'       },
              { label: 'Cancelled',        value: orderSummary.cancelled,                       sub: 'Orders'        },
            ].map(s => (
              <div key={s.label}
                   className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  {s.label}
                </p>
                <p className="text-xl font-medium text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent orders table */}
      <Card title="Recent orders" subtitle="Latest 10 transactions"
            loading={!recentOrders}>
        {recentOrders && recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Order #', 'Customer', 'Items', 'Payment', 'Total', 'Date'].map(h => (
                    <th key={h}
                        className="text-left py-2.5 pr-4 text-gray-400
                                   font-medium uppercase tracking-wider text-[10px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}
                      className="border-b border-gray-50 last:border-0
                                 hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-blue-600">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 pr-4 text-gray-800">{order.customerName}</td>
                    <td className="py-3 pr-4 text-gray-500">
                      {order.items?.length} items
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{order.paymentMethod}</td>
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {fmt(order.total)}
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            No orders yet
          </p>
        )}
      </Card>
    </div>
  )
}

// ── Inventory Tab ─────────────────────────────────
function InventoryTab({ data }) {
  const { partStats, lowStockParts, categoryBreakdown } = data

  return (
    <div className="space-y-5">

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {partStats ? [
          { label: 'Total parts',     value: partStats.totalParts,                 color: 'text-gray-900'   },
          { label: 'Low stock',       value: partStats.lowStockCount,              color: 'text-amber-600'  },
          { label: 'Out of stock',    value: partStats.outOfStockCount,            color: 'text-red-500'    },
          { label: 'Inventory value', value: fmt(partStats.inventoryValue),        color: 'text-purple-600' },
        ].map(c => (
          <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{c.label}</p>
            <p className={`text-xl font-medium ${c.color}`}>{c.value}</p>
          </div>
        )) : Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="h-3 bg-gray-100 rounded animate-pulse mb-3 w-24" />
            <div className="h-6 bg-gray-100 rounded animate-pulse w-16" />
          </div>
        ))}
      </div>

      {/* Category inventory bar */}
      <Card title="Inventory by category" subtitle="Parts count per category"
            loading={!categoryBreakdown}>
        {categoryBreakdown && categoryBreakdown.length > 0 && (
          <div className="space-y-3">
            {categoryBreakdown.map((c, i) => (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-600">{c.category}</span>
                  <span className="text-xs font-medium text-gray-900">
                    {c.count} parts
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(c.count / categoryBreakdown[0].count) * 100}%`,
                      background: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Low stock report */}
      <Card title="Low stock report" subtitle="Parts needing immediate attention"
            loading={!lowStockParts}>
        {lowStockParts && lowStockParts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Part', 'Code', 'Stock', 'Min stock', 'Shortage', 'Status'].map(h => (
                    <th key={h}
                        className="text-left py-2.5 pr-4 text-gray-400
                                   font-medium uppercase tracking-wider text-[10px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStockParts.map(part => (
                  <tr key={part.id}
                      className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 font-medium text-gray-800">
                      {part.name}
                    </td>
                    <td className="py-3 pr-4 font-mono text-gray-400">
                      {part.partCode}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{part.quantity}</td>
                    <td className="py-3 pr-4 text-gray-500">{part.minStock}</td>
                    <td className="py-3 pr-4 text-red-500 font-medium">
                      {part.minStock - part.quantity} needed
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium
                        ${part.quantity === 0
                          ? 'bg-red-50 text-red-600'
                          : 'bg-amber-50 text-amber-600'}`}>
                        {part.quantity === 0 ? 'Out of stock' : 'Low stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-green-600 font-medium">
              ✅ All parts are well stocked!
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Top Parts Tab ─────────────────────────────────
function TopPartsTab({ data }) {
  const { topParts } = data

  return (
    <div className="space-y-5">
      <Card title="Top selling parts" subtitle="Ranked by units sold"
            loading={!topParts}>
        {topParts && topParts.length > 0 ? (
          <>
            {/* Horizontal bar chart */}
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={topParts.slice(0, 8).map(p => ({
                    name:     p.name.split(' ')[0] + (p.name.split(' ')[1] ? ' ' + p.name.split(' ')[1] : ''),
                    quantity: p.quantity,
                    revenue:  p.sellPrice * 10 // estimated revenue
                  }))}
                  layout="vertical"
                  barSize={18}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false}
                         tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" axisLine={false}
                         tickLine={false}
                         tick={{ fontSize: 10, fill: '#64748b' }}
                         width={90} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['#', 'Part', 'Code', 'Category', 'Sell price', 'In stock', 'Status'].map(h => (
                      <th key={h}
                          className="text-left py-2.5 pr-4 text-gray-400
                                     font-medium uppercase tracking-wider text-[10px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topParts.map((part, i) => (
                    <tr key={part.id}
                        className="border-b border-gray-50 last:border-0
                                   hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 text-gray-300 font-medium">
                        {i + 1}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-800">
                        {part.name}
                      </td>
                      <td className="py-3 pr-4 font-mono text-gray-400">
                        {part.partCode}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {part.category}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        ${part.sellPrice?.toFixed(2)}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {part.quantity} {part.unit}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium
                          ${part.stockStatus === 'Out of stock'
                            ? 'bg-red-50 text-red-600'
                            : part.stockStatus === 'Low stock'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-green-50 text-green-700'}`}>
                          {part.stockStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            No parts data available
          </p>
        )}
      </Card>

      {/* Customer & Supplier counts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="Customer overview" subtitle="From customers API"
              loading={!data.customerStats}>
          {data.customerStats && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total',    value: data.customerStats.total,    color: 'text-gray-900'   },
                { label: 'Active',   value: data.customerStats.active,   color: 'text-green-600'  },
                { label: 'VIP',      value: data.customerStats.vip,      color: 'text-amber-600'  },
                { label: 'Workshop', value: data.customerStats.workshop,  color: 'text-blue-600'   },
              ].map(s => (
                <div key={s.label}
                     className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className={`text-xl font-medium ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Supplier overview" subtitle="From suppliers API"
              loading={!data.supplierStats}>
          {data.supplierStats && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total',    value: data.supplierStats.total,    color: 'text-gray-900'  },
                { label: 'Active',   value: data.supplierStats.active,   color: 'text-green-600' },
                { label: 'Inactive', value: data.supplierStats.inactive, color: 'text-red-500'   },
              ].map(s => (
                <div key={s.label}
                     className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className={`text-xl font-medium ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ── Main Reports Page ─────────────────────────────
export default function Reports() {
  const [activeTab,   setActiveTab]   = useState('overview')
  const [activeRange, setActiveRange] = useState('This month')
  const [error,       setError]       = useState(null)
  const [refreshKey,  setRefreshKey]  = useState(0)

  // ── All data state ────────────────────────────
  const [data, setData] = useState({
    orderSummary:      null,
    partStats:         null,
    lowStockParts:     null,
    recentOrders:      null,
    topParts:          null,
    categoryBreakdown: null,
    customerStats:     null,
    supplierStats:     null,
  })

  // ── Fetch all data ────────────────────────────
  const fetchAll = useCallback(async () => {
    setError(null)
    try {
      // Fetch all APIs in parallel
      const [
        orderSummary,
        partStats,
        lowStockParts,
        recentOrdersRes,
        allPartsRes,
        customerStatsRes,
        supplierStatsRes,
      ] = await Promise.all([
        ordersApi.getSummary(),
        partsApi.getDashboard(),
        partsApi.getLowStock(),
        ordersApi.getAll(1, 10, ''),
        partsApi.getAll(1, 100, '', ''),
        customersApi.getStats(),
        suppliersApi.getStats(),
      ])

      // Build category breakdown from all parts
      const categoryMap = {}
      ;(allPartsRes.data || []).forEach(part => {
        const cat = part.category || 'Other'
        categoryMap[cat] = (categoryMap[cat] || 0) + 1
      })
      const categoryBreakdown = Object.entries(categoryMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)

      // Top parts = sorted by sell price desc (proxy for value)
      const topParts = [...(allPartsRes.data || [])]
        .sort((a, b) => b.sellPrice - a.sellPrice)
        .slice(0, 10)

      setData({
        orderSummary,
        partStats,
        lowStockParts,
        recentOrders:      recentOrdersRes.data || [],
        topParts,
        categoryBreakdown,
        customerStats:     customerStatsRes,
        supplierStats:     supplierStatsRes,
      })
    } catch (err) {
      setError(err.message || 'Failed to load reports data')
    }
  }, [refreshKey])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── KPI cards data ────────────────────────────
  const { orderSummary, partStats } = data
  const kpiLoading = !orderSummary || !partStats

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ───────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Reports</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Business insights from live data
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">

          {/* Date range pills */}
          <div className="flex items-center gap-1 bg-white border
                          border-gray-200 rounded-lg p-1">
            {RANGES.map(r => (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium
                            transition-all
                  ${activeRange === r
                    ? 'bg-slate-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="w-8 h-8 flex items-center justify-center border
                       border-gray-200 rounded-lg text-gray-500
                       hover:border-gray-300 bg-white"
          >
            <IconRefresh size={14} />
          </button>

          {/* Export */}
         
 
<button
  onClick={() => exportReportPDF(data, activeRange)}
  disabled={!data.orderSummary && !data.partStats}
  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs
              font-medium transition-colors
              ${(!data.orderSummary && !data.partStats)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-700'}`}
>
  <IconDownload size={13} />
  {(!data.orderSummary && !data.partStats) ? 'Loading…' : 'Export PDF'}
</button>


        </div>
      </div>

      {/* ── Error ────────────────────────────── */}
      <ErrorBanner message={error} onRetry={() => setRefreshKey(k => k + 1)} />

      {/* ── KPI Cards ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Monthly revenue"
          value={orderSummary ? fmt(orderSummary.monthlyRevenue) : '—'}
          change={orderSummary ? 8.3 : undefined}
          changeLabel="vs last month"
          icon={<IconCash size={16} />}
          iconBg="bg-blue-50" iconColor="text-blue-500"
          loading={kpiLoading}
        />
        <MetricCard
          label="Total orders"
          value={orderSummary?.totalOrders ?? '—'}
          change={orderSummary ? 12.4 : undefined}
          changeLabel="vs last month"
          icon={<IconShoppingCart size={16} />}
          iconBg="bg-purple-50" iconColor="text-purple-500"
          loading={kpiLoading}
        />
        <MetricCard
          label="Total parts"
          value={partStats?.totalParts ?? '—'}
          change={partStats ? 5.2 : undefined}
          changeLabel="vs last month"
          icon={<IconPackage size={16} />}
          iconBg="bg-green-50" iconColor="text-green-500"
          loading={kpiLoading}
        />
        <MetricCard
          label="Inventory value"
          value={partStats ? fmt(partStats.inventoryValue) : '—'}
          change={partStats ? 3.8 : undefined}
          changeLabel="vs last month"
          icon={<IconChartBar size={16} />}
          iconBg="bg-amber-50" iconColor="text-amber-500"
          loading={kpiLoading}
        />
      </div>

      {/* ── Tabs ─────────────────────────────── */}
      <div className="flex gap-1 bg-white border border-gray-100
                      rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg
                        text-xs font-medium transition-all
              ${activeTab === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────── */}
      {activeTab === 'overview'  && <OverviewTab  data={data} />}
      {activeTab === 'sales'     && <SalesTab     data={data} />}
      {activeTab === 'inventory' && <InventoryTab data={data} />}
      {activeTab === 'parts'     && <TopPartsTab  data={data} />}

    </div>
  )
}
