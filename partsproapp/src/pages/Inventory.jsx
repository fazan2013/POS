// ================================================
// src/pages/Inventory.jsx  — fixed version
// ================================================
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconSearch, IconPlus, IconDownload, IconEdit,
  IconTrash, IconChevronLeft, IconChevronRight,
  IconRefresh, IconPackage
} from '@tabler/icons-react'
import { partsApi } from '../services/api'

// ── Simple inline helpers (no external hook needed) ──
function Spinner() {
  return (
    <div className="w-6 h-6 border-2 border-gray-200 border-t-slate-700
                    rounded-full animate-spin" />
  )
}

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3
                    bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
      <span>⚠️ {message}</span>
      <button onClick={onDismiss}
              className="text-red-400 hover:text-red-600 text-lg leading-none font-bold">
        ×
      </button>
    </div>
  )
}

// ── Constants ─────────────────────────────────────
const CATEGORIES = ['All', 'Engine', 'Brakes', 'Filter', 'Electrical', 'Suspension']
const PAGE_SIZE  = 10

const CAT_STYLES = {
  Engine:     'bg-blue-100 text-blue-700',
  Brakes:     'bg-pink-100 text-pink-700',
  Filter:     'bg-sky-100 text-sky-700',
  Electrical: 'bg-yellow-100 text-yellow-700',
  Suspension: 'bg-purple-100 text-purple-700',
}

// ── Main Component ────────────────────────────────
export default function Inventory() {
  const navigate = useNavigate()

  const [data,     setData]     = useState({ data: [], totalCount: 0, totalPages: 1 })
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const [page,     setPage]     = useState(1)
  const [deleting, setDeleting] = useState(null)

  // ── Fetch parts from API ──────────────────────
  const fetchParts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await partsApi.getAll(
        page,
        PAGE_SIZE,
        search,
        category === 'All' ? '' : category
      )
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load parts')
    } finally {
      setLoading(false)
    }
  }, [page, search, category])

  useEffect(() => { fetchParts() }, [fetchParts])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [search, category])

  // ── Delete part ───────────────────────────────
  async function handleDelete(part) {
    if (!confirm(`Delete "${part.name}"? This cannot be undone.`)) return
    setDeleting(part.id)
    try {
      await partsApi.delete(part.id)
      fetchParts()
    } catch (err) {
      setError(err.message || 'Failed to delete part')
    } finally {
      setDeleting(null)
    }
  }

  // ── Stock status helpers ──────────────────────
  function getStatusColor(status) {
    if (status === 'Out of stock') return 'text-red-500'
    if (status === 'Low stock')    return 'text-amber-500'
    return 'text-green-600'
  }

  function getBarColor(status) {
    if (status === 'Out of stock') return 'bg-red-400'
    if (status === 'Low stock')    return 'bg-amber-400'
    return 'bg-green-500'
  }

  function getBarWidth(part) {
    if (part.quantity === 0) return '0%'
    const max = Math.max(part.minStock * 5, part.quantity)
    return `${Math.min((part.quantity / max) * 100, 100)}%`
  }

  // ── Pagination helpers ────────────────────────
  function getPageNumbers() {
    const pages = []
    for (let i = 1; i <= data.totalPages; i++) {
      if (
        i === 1 ||
        i === data.totalPages ||
        (i >= page - 1 && i <= page + 1)
      ) {
        pages.push(i)
      }
    }
    return pages
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Page Header ──────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium text-gray-900">Parts inventory</h1>
          <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5
                           rounded-full font-medium">
            {data.totalCount} parts
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <IconSearch size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search part or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs
                         focus:outline-none focus:border-blue-400 bg-white w-48"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchParts}
            className="w-8 h-8 flex items-center justify-center border border-gray-200
                       rounded-lg text-gray-500 hover:border-gray-300 bg-white"
          >
            <IconRefresh size={14} />
          </button>

          {/* Export */}
          <button
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200
                       rounded-lg text-xs bg-white text-gray-600 hover:border-gray-300"
          >
            <IconDownload size={13} /> Export
          </button>

          {/* Add part */}
          <button
            onClick={() => navigate('/parts/add')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white
                       rounded-lg text-xs font-medium hover:bg-slate-700"
          >
            <IconPlus size={13} /> Add part
          </button>
        </div>
      </div>

      {/* ── Error Banner ─────────────── */}
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* ── Category Filter Tabs ──────── */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all
              ${category === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Table Card ───────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

        {/* Table Head */}
        <div className="hidden md:grid
                        grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_0.7fr]
                        px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          {['Part', 'Category', 'Stock', 'Unit price', 'Status', 'Actions'].map(h => (
            <p key={h}
               className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              {h}
            </p>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        )}

        {/* Empty state */}
        {!loading && data.data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16
                          text-gray-400 gap-3">
            <IconPackage size={36} className="text-gray-200" />
            <p className="text-sm">No parts found</p>
            <p className="text-xs text-gray-300">
              Try a different search or category
            </p>
          </div>
        )}

        {/* Part rows */}
        {!loading && data.data.map(part => (
          <div
            key={part.id}
            className="grid grid-cols-1
                       md:grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_0.7fr]
                       px-4 py-3.5 border-b border-gray-50 last:border-0
                       hover:bg-gray-50 transition-colors items-center
                       gap-2 md:gap-0"
          >
            {/* Part name + code */}
            <div>
              <p className="text-xs font-medium text-gray-900">{part.name}</p>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                {part.partCode}
              </p>
            </div>

            {/* Category badge */}
            <div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                ${CAT_STYLES[part.category] || 'bg-gray-100 text-gray-600'}`}>
                {part.category}
              </span>
            </div>

            {/* Stock bar + qty */}
            <div className="flex items-center gap-2">
              <div className="w-14 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(part.stockStatus)}`}
                  style={{ width: getBarWidth(part) }}
                />
              </div>
              <span className="text-xs text-gray-700">
                {part.quantity} {part.unit}
              </span>
            </div>

            {/* Sell price */}
            <p className="text-xs text-gray-700">
              ${part.sellPrice?.toFixed(2)}
            </p>

            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full inline-block
                ${part.stockStatus === 'Out of stock' ? 'bg-red-400'
                  : part.stockStatus === 'Low stock'  ? 'bg-amber-400'
                  : 'bg-green-500'}`}
              />
              <span className={`text-xs ${getStatusColor(part.stockStatus)}`}>
                {part.stockStatus}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={() => navigate(`/parts/edit/${part.id}`)}
                className="w-7 h-7 flex items-center justify-center border
                           border-gray-200 rounded-lg text-gray-400
                           hover:border-gray-300 hover:text-gray-700
                           transition-colors"
              >
                <IconEdit size={13} />
              </button>
              <button
                onClick={() => handleDelete(part)}
                disabled={deleting === part.id}
                className="w-7 h-7 flex items-center justify-center border
                           border-gray-200 rounded-lg text-gray-400
                           hover:border-red-300 hover:text-red-500
                           transition-colors disabled:opacity-50"
              >
                {deleting === part.id
                  ? <Spinner />
                  : <IconTrash size={13} />}
              </button>
            </div>
          </div>
        ))}

        {/* ── Pagination ───────────────── */}
        <div className="flex items-center justify-between px-4 py-3
                        border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {data.totalCount > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, data.totalCount)} of ${data.totalCount} parts`
              : 'No parts'}
          </p>

          <div className="flex gap-1 items-center">
            {/* Prev */}
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center border
                         border-gray-200 rounded-lg text-gray-500
                         disabled:opacity-40 hover:border-gray-300"
            >
              <IconChevronLeft size={13} />
            </button>

            {/* Page numbers */}
            {getPageNumbers().map((p, idx, arr) => (
              <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="w-7 h-7 flex items-center justify-center
                                   text-xs text-gray-400">
                    …
                  </span>
                )}
                <button
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 flex items-center justify-center
                              rounded-lg text-xs transition-colors
                    ${page === p
                      ? 'bg-slate-900 text-white'
                      : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {p}
                </button>
              </span>
            ))}

            {/* Next */}
            <button
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages || data.totalPages === 0}
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
