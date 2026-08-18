
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  IconShoppingCart, IconPackage, IconAlertTriangle,
  IconChartBar, IconTrendingUp, IconDownload, IconCalendar
} from '@tabler/icons-react'
import { partsApi, ordersApi,fmt } from '../services/api'
import { PageLoader, ErrorBanner } from '../hooks/useApi'

const CATEGORY_COLORS = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#ef4444']

function MetricCard({ label, value, sub, subColor, icon, iconBg }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-medium text-gray-900 mb-1">{value ?? '—'}</p>
      <p className={`text-xs flex items-center gap-1 ${subColor}`}>
        <IconTrendingUp size={12} />{sub}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [s, o] = await Promise.all([
          partsApi.getDashboard(),
          ordersApi.getSummary(),
        ])
        setStats(s)
        setSummary(o)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  if (loading) return <div className="p-6"><PageLoader /></div>

  return (
    <div className="p-4 md:p-6 space-y-5">
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200
                             rounded-lg text-xs bg-white text-gray-600 hover:border-gray-300">
            <IconCalendar size={13} /> This month
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white
                             rounded-lg text-xs font-medium hover:bg-slate-700">
            <IconDownload size={13} /> Export
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Today's sales"
          value={summary ? `${fmt(summary.todayRevenue?.toFixed(2))}` : '—'}
          sub={`${summary?.todayOrders ?? 0} orders today`}
          subColor="text-green-500"
          icon={<IconShoppingCart size={16} className="text-blue-500" />}
          iconBg="bg-blue-50"
        />
        <MetricCard
          label="Total parts"
          value={stats?.totalParts?.toLocaleString() ?? '—'}
          sub={`${stats?.lowStockCount ?? 0} low stock`}
          subColor="text-amber-500"
          icon={<IconPackage size={16} className="text-green-500" />}
          iconBg="bg-green-50"
        />
        <MetricCard
          label="Low stock alerts"
          value={stats?.lowStockCount ?? '—'}
          sub={`${stats?.outOfStockCount ?? 0} out of stock`}
          subColor="text-red-500"
          icon={<IconAlertTriangle size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <MetricCard
          label="Monthly revenue"
          value={summary ? `${fmt(summary.monthlyRevenue?.toFixed(2))}` : '—'}
          sub={`${summary?.completed ?? 0} completed orders`}
          subColor="text-green-500"
          icon={<IconChartBar size={16} className="text-purple-500" />}
          iconBg="bg-purple-50"
        />
      </div>

      {/* Order status summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total orders', value: summary.totalOrders,  color: 'text-gray-900' },
            { label: 'Completed',    value: summary.completed,    color: 'text-green-600' },
            { label: 'Processing',   value: summary.processing,   color: 'text-blue-600'  },
            { label: 'Cancelled',    value: summary.cancelled,    color: 'text-red-500'   },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
              <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Inventory value highlight */}
      {stats && (
        <div className="bg-slate-900 text-white rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total inventory value</p>
            <p className="text-3xl font-medium">{fmt(stats.inventoryValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</p>
            <p className="text-xs text-slate-400 mt-1">{stats.totalParts} parts across all categories</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-1">Out of stock</p>
            <p className="text-2xl font-medium text-red-400">{stats.outOfStockCount}</p>
            <p className="text-xs text-slate-400 mt-1">parts need restocking</p>
          </div>
        </div>
      )}

      {/* Average order value */}
      {summary && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-900 mb-1">Average order value</p>
          <p className="text-3xl font-medium text-blue-600">
            {fmt(summary.averageOrderValue?.toFixed(2)) ?? '0.00'}
          </p>
          <p className="text-xs text-gray-400 mt-1">across all {summary.totalOrders} orders</p>
        </div>
      )}
    </div>
  )
}
