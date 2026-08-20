// ================================================
// src/pages/POS.jsx — with product images
// ================================================
import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  IconSearch, IconBarcode, IconCash, IconCreditCard,
  IconBuildingBank, IconPlus, IconMinus, IconX,
  IconShoppingCart, IconCheck, IconPrinter, IconTrash,
  IconAlertTriangle, IconRefresh, IconUser, IconPackage
} from '@tabler/icons-react'
import { partsApi, ordersApi, customersApi, receiptApi, categoriesApi, fmt } from '../services/api'
import { useRef } from 'react'
import { IconLock, IconEdit } from '@tabler/icons-react'
// ── Helpers ───────────────────────────────────────
function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border' : 'w-6 h-6 border-2'
  return (
    <div className={`${s} border-gray-200 border-t-slate-700
                    rounded-full animate-spin flex-shrink-0`} />
  )
}

// ── Receipt Modal ─────────────────────────────────
function ReceiptModal({ cart, totals, payMethod, customerName, invoiceNo, onClose }) {
  const now = new Date().toLocaleString()
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

        <div className="bg-slate-900 text-white px-6 py-5 text-center">
          <div className="w-10 h-10 bg-green-400 rounded-full flex items-center
                          justify-center mx-auto mb-3">
            <IconCheck size={20} className="text-white" />
          </div>
          <p className="text-lg font-medium">Sale complete!</p>
          <p className="text-xs text-slate-400 mt-1">Invoice #{invoiceNo}</p>
        </div>

        <div className="px-5 py-4 max-h-80 overflow-y-auto">
          <div className="flex justify-between text-xs text-gray-400 mb-3">
            <span>{now}</span>
            <span>{payMethod}</span>
          </div>
          {customerName && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600
                            mb-3 bg-gray-50 rounded-lg px-3 py-2">
              <IconUser size={12} className="text-gray-400" />
              {customerName}
            </div>
          )}

          <div className="space-y-2 mb-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700 flex-1">
                  {item.name}
                  <span className="text-gray-400 ml-1">×{item.qty}</span>
                </span>
                <span className="font-medium text-gray-900">
                  {fmt(item.sellPrice * item.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span><span>{fmt(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Tax ({totals.taxRate}%)</span><span>{fmt(totals.tax)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Discount ({totals.discountRate}%)</span>
                <span>-{fmt(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-medium
                            text-gray-900 border-t border-gray-100 pt-2 mt-1">
              <span>Total</span><span>{fmt(totals.total)}</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm
                             text-gray-600 hover:border-gray-300 flex items-center
                             justify-center gap-2">
            <IconShoppingCart size={15} /> New sale
          </button>
          <button onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl
                             text-sm font-medium hover:bg-slate-700 flex items-center
                             justify-center gap-2">
            <IconPrinter size={15} /> Print
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Product Card — with image ─────────────────────
function ProductCard({ product, onAdd }) {
  const isOut = product.quantity === 0
  const isLow = product.quantity > 0 && product.quantity <= product.minStock

  return (
    <div
      onClick={() => !isOut && onAdd(product)}
      className={`bg-white border rounded-xl p-3 transition-all duration-100
                  relative select-none flex flex-col gap-2
                  ${isOut
                    ? 'opacity-50 cursor-not-allowed border-gray-100'
                    : 'cursor-pointer border-gray-100 hover:border-blue-400 hover:bg-blue-50'}`}
    >
      {/* Stock badges */}
      {isOut && (
        <span className="absolute top-2 right-2 text-[9px] font-medium
                         bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full z-10">
          Out
        </span>
      )}
      {isLow && !isOut && (
        <span className="absolute top-2 right-2 text-[9px] font-medium
                         bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full z-10">
          Low
        </span>
      )}

      {/* ── Product image ── */}
      <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-50
                      border border-gray-100 flex items-center justify-center
                      flex-shrink-0">
        {product.imageBase64 ? (
          <img
            src={product.imageBase64}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-300">
            <IconPackage size={24} />
            <p className="text-[9px] text-gray-300">{product.category}</p>
          </div>
        )}
      </div>

      {/* Part info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 leading-snug
                      line-clamp-2 mb-0.5">
          {product.name}
        </p>
        <p className="text-[10px] text-gray-400 font-mono truncate">
          {product.model ? `${product.model} · ` : ''}{product.partCode}
        </p>
      </div>

      {/* Price + stock */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-sm font-medium text-gray-900">
          {fmt(product.sellPrice)}
        </span>
        <span className="text-[10px] text-gray-400">
          {isOut ? 'Out of stock' : `${product.quantity} left`}
        </span>
      </div>
    </div>
  )
}


//
function AdminAuthModal({ onSuccess, onCancel }) {
  const userRef = useRef(null)
  const passRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleVerify() {
    const email    = userRef.current?.value?.trim()
    const password = passRef.current?.value

    if (!email || !password) {
      setError('Enter admin email and password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Call login API to verify credentials
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Invalid credentials')
        return
      }

      // Must be Admin or Store Manager
      if (!['Administrator', 'Store Manager'].includes(data.role)) {
        setError('Only Administrator or Store Manager can adjust prices')
        return
      }

      // Auth success — allow price edit
      onSuccess()

    } catch {
      setError('Could not verify credentials. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center
                    justify-center p-4"
         onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6"
           onClick={e => e.stopPropagation()}>

        {/* Icon */}
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center
                        justify-center mx-auto mb-4">
          <IconLock size={22} className="text-amber-600" />
        </div>

        <h3 className="text-sm font-medium text-gray-900 text-center mb-1">
          Admin authorisation required
        </h3>
        <p className="text-xs text-gray-400 text-center mb-5">
          Enter admin credentials to adjust the price
        </p>

        <div className="space-y-3">
          <input
            ref={userRef}
            type="email"
            placeholder="Admin email"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && passRef.current?.focus()}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                       text-sm focus:outline-none focus:border-blue-400"
          />
          <input
            ref={passRef}
            type="password"
            placeholder="Password"
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                       text-sm focus:outline-none focus:border-blue-400"
          />

          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <IconAlertTriangle size={12} />{error}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onCancel}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl
                             text-sm text-gray-600 hover:border-gray-300">
            Cancel
          </button>
          <button onClick={handleVerify} disabled={loading}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl
                             text-sm font-medium hover:bg-amber-600
                             flex items-center justify-center gap-2
                             disabled:opacity-50">
            {loading ? <><Spinner size="sm" /> Verifying…</> : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  )
}
//

//
function PriceEditPopup({ item, onSave, onCancel }) {
  const priceRef = useRef(null)
  const [error, setError] = useState(null)

  function handleSave() {
    const val = parseFloat(priceRef.current?.value)
    if (isNaN(val) || val <= 0) {
      setError('Enter a valid price greater than 0')
      return
    }
    onSave(val)
  }

  return (
    <div className="absolute right-0 top-full mt-1 bg-white border border-amber-200
                    rounded-xl shadow-xl z-50 p-3 w-56"
         onClick={e => e.stopPropagation()}>

      <p className="text-[10px] font-medium text-amber-600 uppercase
                    tracking-wider mb-2 flex items-center gap-1">
        <IconEdit size={10} /> Adjust price
      </p>

      <p className="text-[10px] text-gray-400 mb-2">
        Original: {fmt(item.originalPrice ?? item.sellPrice)}
      </p>

      <div className="flex gap-2">
        <input
          ref={priceRef}
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={(item.adjustedPrice ?? item.sellPrice).toFixed(2)}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          onChange={() => setError(null)}
          className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg
                     text-sm focus:outline-none focus:border-amber-400"
        />
        <button onClick={handleSave}
                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg
                           text-xs font-medium hover:bg-amber-600">
          <IconCheck size={13} />
        </button>
        <button onClick={onCancel}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg
                           text-xs text-gray-500 hover:border-gray-300">
          <IconX size={13} />
        </button>
      </div>

      {error && (
        <p className="text-[10px] text-red-500 mt-1.5">{error}</p>
      )}

      {/* Reset to original */}
      {item.adjustedPrice && item.adjustedPrice !== item.originalPrice && (
        <button
          onClick={() => onSave(item.originalPrice)}
          className="text-[10px] text-gray-400 hover:text-gray-600 mt-2
                     underline w-full text-center"
        >
          Reset to original ({fmt(item.originalPrice)})
        </button>
      )}
    </div>
  )
}

//



// ── Cart Item Row — with thumbnail ────────────────
function CartItemRow({ item, maxQty, onQtyChange, onRemove, onPriceAdjust }) {

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPriceEdit, setShowPriceEdit] = useState(false)
  const [adminVerified, setAdminVerified] = useState(false)

  const isAdjusted = item.adjustedPrice && item.adjustedPrice !== item.originalPrice
  const displayPrice = item.adjustedPrice ?? item.sellPrice

  function handleEditClick() {
    if (adminVerified) {
      // Already verified this session — go straight to edit
      setShowPriceEdit(true)
    } else {
      setShowAuthModal(true)
    }
  }

  function handleAuthSuccess() {
    setShowAuthModal(false)
    setAdminVerified(true)
    setShowPriceEdit(true)
  }

  function handlePriceSave(newPrice) {
    onPriceAdjust(item.id, newPrice)
    setShowPriceEdit(false)
  }

  return (
    <div className="flex items-center gap-2 py-3
                    border-b border-gray-50 last:border-0 relative">

      {/* Admin Auth Modal */}
      {showAuthModal && (
        <AdminAuthModal
          onSuccess={handleAuthSuccess}
          onCancel={() => setShowAuthModal(false)}
        />
      )}

      {/* Price Edit Popup */}
      {showPriceEdit && (
        <PriceEditPopup
          item={item}
          onSave={handlePriceSave}
          onCancel={() => setShowPriceEdit(false)}
        />
      )}

      {/* Thumbnail */}
      <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-50
                      border border-gray-100 flex items-center justify-center
                      flex-shrink-0">
        {item.imageBase64 ? (
          <img src={item.imageBase64} alt={item.name}
               className="w-full h-full object-cover" />
        ) : (
          <IconPackage size={14} className="text-gray-300" />
        )}
      </div>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate leading-tight">
          {item.name}
        </p>

        {/* Price row — shows edit button + adjusted indicator */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className={`text-[10px] ${isAdjusted ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
            {fmt(displayPrice)} each
            {isAdjusted && (
              <span className="ml-1 line-through text-gray-300">
                {fmt(item.originalPrice)}
              </span>
            )}
          </p>

          {/* Edit price button */}
          <button
            onClick={handleEditClick}
            title="Adjust price (admin only)"
            className={`flex items-center gap-0.5 text-[9px] font-medium px-1.5
                        py-0.5 rounded-full transition-colors
                        ${isAdjusted
                          ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
          >
            <IconEdit size={8} />
            {isAdjusted ? 'Adjusted' : 'Edit price'}
          </button>
        </div>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={() => onQtyChange(item.id, -1)}
                className="w-6 h-6 rounded-md border border-gray-200 flex items-center
                           justify-center text-gray-500 hover:border-gray-300">
          <IconMinus size={11} />
        </button>
        <span className="text-xs font-medium text-gray-900 w-5 text-center">
          {item.qty}
        </span>
        <button onClick={() => onQtyChange(item.id, 1)}
                disabled={item.qty >= maxQty}
                className="w-6 h-6 rounded-md border border-gray-200 flex items-center
                           justify-center text-gray-500 hover:border-gray-300
                           disabled:opacity-40 disabled:cursor-not-allowed">
          <IconPlus size={11} />
        </button>
      </div>

      {/* Line total + remove */}
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-medium text-gray-900">
          {fmt(displayPrice * item.qty)}
        </p>
        <button onClick={() => onRemove(item.id)}
                className="text-[10px] text-red-400 hover:text-red-600
                           transition-colors mt-0.5">
          remove
        </button>
      </div>
    </div>
  )
}

// ── Customer Selector ─────────────────────────────
function CustomerSelector({ selectedCustomer, onSelect, onClear }) {
  const [search,       setSearch]       = useState('')
  const [results,      setResults]      = useState([])
  const [loading,      setLoading]      = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  async function handleSearch(q) {
    setSearch(q)
    if (q.length < 2) { setResults([]); setShowDropdown(false); return }
    setLoading(true)
    try {
      const res = await customersApi.getAll(1, 5, q)
      setResults(res.data || [])
      setShowDropdown(true)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  function selectCustomer(customer) {
    onSelect(customer)
    setSearch('')
    setResults([])
    setShowDropdown(false)
  }

  if (selectedCustomer) {
    return (
      <div className="flex items-center justify-between px-3 py-2
                      bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <IconUser size={14} className="text-blue-500" />
          <div>
            <p className="text-xs font-medium text-blue-800">
              {selectedCustomer.name}
            </p>
            <p className="text-[10px] text-blue-500">
              {selectedCustomer.phone} · {selectedCustomer.loyaltyPoints} pts
            </p>
          </div>
        </div>
        <button onClick={onClear} className="text-blue-400 hover:text-blue-600">
          <IconX size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <IconUser size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search customer (optional)…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => search.length >= 2 && setShowDropdown(true)}
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg
                     text-xs focus:outline-none focus:border-blue-400 bg-white"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border
                        border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          {results.map(c => (
            <button key={c.id} onClick={() => selectCustomer(c)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5
                               hover:bg-gray-50 text-left border-b border-gray-50
                               last:border-0">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center
                              justify-center text-[10px] font-medium text-slate-600">
                {c.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">{c.name}</p>
                <p className="text-[10px] text-gray-400">{c.phone} · {c.type}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════
// MAIN POS COMPONENT
// ════════════════════════════════════════════════
export default function POS() {

  const [posSettings, setPosSettings] = useState({
    taxRate:         5,
    discountRate:    3,
    discountMinimum: 100,
    autoPrint:       false,
  })

  // ── Categories ────────────────────────────────
  const [categories,        setCategories]        = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // ── Products ──────────────────────────────────
  const [products,      setProducts]      = useState([])
  const [loadingParts,  setLoadingParts]  = useState(true)
  const [partsError,    setPartsError]    = useState(null)
  const [search,        setSearch]        = useState('')
  const [activeCat,     setActiveCat]     = useState('All')
  const [partsPage,     setPartsPage]     = useState(1)
  const [totalPages,    setTotalPages]    = useState(1)

  // ── Cart ──────────────────────────────────────
  const [cart,          setCart]          = useState([])
  const [payMethod,     setPayMethod]     = useState('Cash')
  const [customer,      setCustomer]      = useState(null)

  // ── Checkout ──────────────────────────────────
  const [checkingOut,   setCheckingOut]   = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)
  const [receipt,       setReceipt]       = useState(null)
  const [toast,         setToast]         = useState(null)

  // ── Load POS settings ─────────────────────────
  useEffect(() => {
    async function loadPosSettings() {
      try {
        const settings = await receiptApi.get()
        setPosSettings({
          taxRate:         settings.taxRate         ?? 5,
          discountRate:    settings.discountRate     ?? 3,
          discountMinimum: settings.discountMinimum  ?? 100,
          autoPrint:       settings.autoPrint        ?? false,
        })
      } catch (err) {
        console.warn('Could not load POS settings, using defaults:', err.message)
      }
    }
    loadPosSettings()
  }, [])

  // ── Load categories ───────────────────────────
  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true)
      try {
        const data = await categoriesApi.getAll()
        setCategories(data || [])
      } catch (err) {
        console.warn('Could not load categories:', err.message)
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  // ── Load products ─────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoadingParts(true)
    setPartsError(null)
    try {
      const res = await partsApi.getAll(
        partsPage, 12, search,
        activeCat === 'All' ? '' : activeCat
      )
      setProducts(res.data      || [])
      setTotalPages(res.totalPages || 1)
    } catch (err) {
      setPartsError(err.message || 'Failed to load parts')
    } finally {
      setLoadingParts(false)
    }
  }, [partsPage, search, activeCat])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { setPartsPage(1) }, [search, activeCat])

  // ── Toast ─────────────────────────────────────
  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2000)
  }

  // ── Totals ────────────────────────────────────
  const totals = useMemo(() => {
  const subtotal = cart.reduce((a, c) => {
    const price = c.adjustedPrice ?? c.sellPrice
    return a + price * c.qty
  }, 0)
  const tax      = Math.round(subtotal * (posSettings.taxRate / 100) * 100) / 100
  const discount = subtotal >= posSettings.discountMinimum
    ? Math.round(subtotal * (posSettings.discountRate / 100) * 100) / 100
    : 0
  const total = subtotal + tax - discount
  return {
    subtotal, tax, discount, total,
    taxRate:      posSettings.taxRate,
    discountRate: posSettings.discountRate,
  }
}, [cart, posSettings])



  const itemCount = cart.reduce((a, c) => a + c.qty, 0)

  // ── Add to cart — includes imageBase64 ────────
  function addToCart(part) {
  setCart(prev => {
    const existing = prev.find(i => i.id === part.id)
    if (existing) {
      if (existing.qty >= part.quantity) {
        showToast('Max stock reached', 'warn')
        return prev
      }
      return prev.map(i =>
        i.id === part.id ? { ...i, qty: i.qty + 1 } : i
      )
    }
    showToast(`${part.name} added`)
    return [...prev, {
      id:             part.id,
      name:           part.name,
      partCode:       part.partCode,
      sellPrice:      part.sellPrice,
      originalPrice:  part.sellPrice,      // ← store original
      adjustedPrice:  null,                // ← null = not adjusted
      quantity:       part.quantity,
      unit:           part.unit,
      imageBase64:    part.imageBase64 || null,
      qty:            1,
    }]
  })
}

function handlePriceAdjust(itemId, newPrice) {
  setCart(prev => prev.map(item =>
    item.id === itemId
      ? {
          ...item,
          adjustedPrice: newPrice,
          sellPrice:     newPrice,   // update sellPrice used in totals
        }
      : item
  ))
}



  // ── Change qty ────────────────────────────────
  function changeQty(productId, delta) {
    setCart(prev =>
      prev
        .map(x => {
          if (x.id !== productId) return x
          const newQty = x.qty + delta
          if (newQty > x.quantity) {
            showToast('Max stock reached', 'warn')
            return x
          }
          return { ...x, qty: newQty }
        })
        .filter(x => x.qty > 0)
    )
  }

  // ── Remove ────────────────────────────────────
  function removeItem(productId) {
    setCart(prev => prev.filter(x => x.id !== productId))
  }

  // ── Clear cart ────────────────────────────────
  function clearCart() {
    setCart([])
    setCustomer(null)
    setCheckoutError(null)
  }

  // ── Checkout ──────────────────────────────────
  async function handleCheckout() {
    if (cart.length === 0) return
    setCheckingOut(true)
    setCheckoutError(null)
    try {
      const payload = {
        customerId:    customer?.id || 1,
        paymentMethod: payMethod,
        notes:         customer ? `Customer: ${customer.name}` : 'Walk-in customer',
        items: cart.map(item => ({
          partId:   item.id,
          quantity: item.qty,
           unitPrice:  item.adjustedPrice ?? item.sellPrice,
        })),
      }
      const order = await ordersApi.create(payload)
      setReceipt({
        invoiceNo:    order.orderNumber,
        customerName: customer?.name || null,
      })
      if (posSettings.autoPrint) setTimeout(() => window.print(), 800)
      fetchProducts()
    } catch (err) {
      setCheckoutError(err.message || 'Checkout failed. Please try again.')
    } finally {
      setCheckingOut(false)
    }
  }

  function handleCloseReceipt() {
    setReceipt(null)
    clearCart()
    setSearch('')
  }

  function getMaxQty(productId) {
    const product = products.find(p => p.id === productId)
    return product?.quantity ?? 999
  }

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-40 text-white text-xs
                         px-3 py-2 rounded-lg shadow-lg flex items-center gap-2
                         ${toast.type === 'warn'  ? 'bg-amber-500'
                         : toast.type === 'error' ? 'bg-red-500'
                         : 'bg-slate-900'}`}>
          {toast.type === 'warn'
            ? <IconAlertTriangle size={14} />
            : <IconCheck size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <ReceiptModal
          cart={cart}
          totals={totals}
          payMethod={payMethod}
          customerName={receipt.customerName}
          invoiceNo={receipt.invoiceNo}
          onClose={handleCloseReceipt}
        />
      )}

      {/* ════ LEFT — Product Grid ════ */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100">

        {/* Search bar */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex gap-2">
          <div className="relative flex-1">
            <IconSearch size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search part name, code, vehicle…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl
                         text-sm focus:outline-none focus:border-blue-400 bg-gray-50"
            />
          </div>
          <button onClick={fetchProducts}
                  className="w-10 h-10 border border-gray-200 rounded-xl flex items-center
                             justify-center text-gray-500 hover:border-gray-300 bg-white">
            <IconRefresh size={16} />
          </button>
          <button className="w-10 h-10 border border-gray-200 rounded-xl flex items-center
                             justify-center text-gray-500 hover:border-gray-300 bg-white">
            <IconBarcode size={18} />
          </button>
        </div>

        {/* Category Tabs — from API */}
        <div className="bg-white border-b border-gray-100 px-4 py-2.5
                        flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCat('All')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium
                        whitespace-nowrap flex-shrink-0 transition-all
                        ${activeCat === 'All'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}
          >
            All
          </button>

          {loadingCategories ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i}
                   className="w-16 h-7 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
            ))
          ) : (
            categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.name)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium
                            whitespace-nowrap flex-shrink-0 transition-all
                            ${activeCat === cat.name
                              ? 'bg-slate-900 text-white'
                              : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {cat.colorCode && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                    style={{ background: cat.colorCode }}
                  />
                )}
                {cat.name}
              </button>
            ))
          )}
        </div>

        {/* Error banner */}
        {partsError && (
          <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2.5
                          bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            <IconAlertTriangle size={14} className="flex-shrink-0" />
            {partsError}
            <button onClick={fetchProducts} className="ml-auto underline">Retry</button>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingParts ? (
            <div className="flex items-center justify-center h-full gap-3 text-gray-400">
              <Spinner /><span className="text-sm">Loading parts…</span>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full
                            text-gray-400 gap-3">
              <IconSearch size={32} className="text-gray-200" />
              <p className="text-sm">No parts found</p>
              {search && (
                <button onClick={() => setSearch('')}
                        className="text-xs text-blue-500 underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToCart}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => setPartsPage(p => Math.max(1, p - 1))}
                    disabled={partsPage === 1}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs
                               text-gray-500 disabled:opacity-40 hover:border-gray-300"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-gray-500">
                    Page {partsPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPartsPage(p => Math.min(totalPages, p + 1))}
                    disabled={partsPage === totalPages}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs
                               text-gray-500 disabled:opacity-40 hover:border-gray-300"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════ RIGHT — Cart ════ */}
      <div className="w-72 xl:w-80 flex flex-col bg-white flex-shrink-0">

        {/* Cart Header */}
        <div className="px-4 py-3 border-b border-gray-100
                        flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900">Current sale</p>
            <span className="text-[10px] bg-gray-100 text-gray-500
                             px-2 py-0.5 rounded-full font-medium">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart}
                    className="flex items-center gap-1 text-xs text-red-400
                               hover:text-red-600 transition-colors">
              <IconTrash size={12} /> Clear
            </button>
          )}
        </div>

        {/* Customer selector */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-50">
          <CustomerSelector
            selectedCustomer={customer}
            onSelect={setCustomer}
            onClear={() => setCustomer(null)}
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full
                            text-gray-300 gap-3 py-10">
              <IconShoppingCart size={36} />
              <p className="text-sm text-gray-400">Add parts to start a sale</p>
              <p className="text-xs text-gray-300">Click any part on the left</p>
            </div>
          ) : (
            cart.map(item => (
              <CartItemRow
                key={item.id}
                item={item}
                maxQty={getMaxQty(item.id)}
                onQtyChange={changeQty}
                onRemove={removeItem}
                onPriceAdjust={handlePriceAdjust}
              />
            ))
          )}
        </div>

        {/* Summary + Checkout */}
        <div className="border-t border-gray-100 px-4 py-4 space-y-3">

          {/* Totals */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span><span>{fmt(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Tax ({totals.taxRate}%)</span><span>{fmt(totals.tax)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Discount ({totals.discountRate}%)</span>
                <span>-{fmt(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-medium
                            text-gray-900 border-t border-gray-100 pt-2">
              <span>Total</span><span>{fmt(totals.total)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Cash',     icon: <IconCash size={18} />,         value: 'Cash'     },
              { label: 'Card',     icon: <IconCreditCard size={18} />,   value: 'Card'     },
              { label: 'Transfer', icon: <IconBuildingBank size={18} />, value: 'Transfer' },
            ].map(method => (
              <button
                key={method.value}
                onClick={() => setPayMethod(method.value)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl
                            border text-xs transition-all
                  ${payMethod === method.value
                    ? 'border-blue-400 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                <span className={payMethod === method.value
                  ? 'text-blue-500' : 'text-gray-400'}>
                  {method.icon}
                </span>
                {method.label}
              </button>
            ))}
          </div>

          {/* Checkout error */}
          {checkoutError && (
            <div className="flex items-start gap-2 px-3 py-2 bg-red-50
                            border border-red-200 rounded-lg text-xs text-red-600">
              <IconAlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              {checkoutError}
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkingOut}
            className={`w-full py-3 rounded-xl text-sm font-medium
                        flex items-center justify-center gap-2 transition-all
              ${cart.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : checkingOut
                  ? 'bg-slate-700 text-white cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-700 cursor-pointer'}`}
          >
            {checkingOut
              ? <><Spinner size="sm" /> Processing…</>
              : <><IconCheck size={16} /> Complete sale · {fmt(totals.total)}</>}
          </button>
        </div>
      </div>
    </div>
  )
}