// ================================================
// src/pages/PartForm.jsx — Full fixed version
// Edit mode loads correctly from API
// ================================================
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  IconArrowLeft, IconDeviceFloppy, IconTrash,
  IconPackage, IconPhoto, IconAlertTriangle,
  IconCheck, IconX
} from '@tabler/icons-react'
import { partsApi, categoriesApi, brandsApi } from '../services/api'

// ── Constants ─────────────────────────────────────
const CONDITIONS = ['New', 'Refurbished', 'Used']
const UNITS      = ['pcs', 'set', 'pair', 'litre', 'kg', 'meter']

// ── Spinner ───────────────────────────────────────
function Spinner({ size = 'btn' }) {
  const cls = size === 'btn'
    ? 'w-4 h-4 border-2 border-white/30 border-t-white'
    : 'w-8 h-8 border-2 border-gray-200 border-t-slate-700'
  return <span className={`${cls} rounded-full animate-spin inline-block flex-shrink-0`} />
}

// ── Toast ─────────────────────────────────────────
function Toast({ message, type, onClose }) {
  if (!message) return null
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5
                     px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                     ${type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
      {type === 'error' ? <IconAlertTriangle size={16} /> : <IconCheck size={16} />}
      {message}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <IconX size={14} />
      </button>
    </div>
  )
}

// ── Field ─────────────────────────────────────────
function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase
                        tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
      {error && (
        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
          <IconAlertTriangle size={10} />{error}
        </p>
      )}
    </div>
  )
}

// ── Input ─────────────────────────────────────────
function Input({ error, className = '', ...props }) {
  return (
    <input {...props}
      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none
                  transition-colors bg-white
                  ${error
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-gray-200 focus:border-blue-400'}
                  ${className}`}
    />
  )
}

// ── LookupSelect ──────────────────────────────────
function LookupSelect({ label, required, error, value, onChange,
                        options, onAdd, loading }) {
  const [showAdd,  setShowAdd]  = useState(false)
  const [newValue, setNewValue] = useState('')
  const [adding,   setAdding]   = useState(false)

  async function handleAdd() {
    const val = newValue.trim()
    if (!val) return
    setAdding(true)
    try {
      const result = await onAdd(val)
      onChange(result.name, result.id)
      setNewValue('')
      setShowAdd(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <Field label={label} required={required} error={error}>
      <div className="space-y-1.5">
        <div className="relative">
          <select
            value={value}
            onChange={e => {
              if (e.target.value === '__add__') {
                setShowAdd(true)
              } else {
                const opt = options.find(o => o.value === e.target.value)
                onChange(e.target.value, opt?.id ?? null)
                setShowAdd(false)
              }
            }}
            disabled={loading}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm
                        focus:outline-none transition-colors bg-white appearance-none
                        ${error ? 'border-red-300' : 'border-gray-200 focus:border-blue-400'}
                        ${loading ? 'opacity-50 cursor-wait' : ''}`}
          >
            <option value="">
              {loading ? 'Loading…' : `Select ${label.toLowerCase()}`}
            </option>
            {options.map(opt => (
              <option key={opt.id} value={opt.value}>{opt.value}</option>
            ))}
            <option value="__add__">+ Add new {label.toLowerCase()}…</option>
          </select>
          {loading && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <div className="w-3 h-3 border border-gray-300 border-t-gray-600
                              rounded-full animate-spin" />
            </div>
          )}
        </div>

        {showAdd && (
          <div className="flex gap-2 items-center p-2.5 bg-blue-50
                          border border-blue-200 rounded-lg">
            <input
              type="text"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              placeholder={`New ${label.toLowerCase()} name…`}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
              className="flex-1 px-2.5 py-1.5 border border-blue-200 rounded-lg
                         text-sm focus:outline-none focus:border-blue-400 bg-white"
            />
            <button type="button" onClick={handleAdd}
                    disabled={adding || !newValue.trim()}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs
                               font-medium hover:bg-blue-600 disabled:opacity-50
                               flex items-center gap-1.5">
              {adding ? <Spinner /> : <IconCheck size={12} />} Add
            </button>
            <button type="button"
                    onClick={() => { setShowAdd(false); setNewValue('') }}
                    className="w-7 h-7 flex items-center justify-center border
                               border-blue-200 rounded-lg text-blue-400 hover:text-blue-600">
              <IconX size={13} />
            </button>
          </div>
        )}
      </div>
    </Field>
  )
}

// ── Section ───────────────────────────────────────
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

// ── Stock indicator ───────────────────────────────
function StockIndicator({ qty, min }) {
  const q = parseInt(qty)
  const m = parseInt(min) || 0
  if (qty === '' || isNaN(q)) return null
  if (q === 0) return (
    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Out of stock
    </p>
  )
  if (q <= m) return (
    <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />Low stock
    </p>
  )
  return (
    <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />In stock
    </p>
  )
}

// ── Delete modal ──────────────────────────────────
function DeleteModal({ partName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center
                        justify-center mx-auto mb-4">
          <IconTrash size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-medium text-gray-900 text-center mb-2">
          Delete this part?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          <span className="font-medium text-gray-800">{partName}</span>{' '}
          will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl
                             text-sm text-gray-600 hover:border-gray-300">
            Cancel
          </button>
          <button onClick={onConfirm}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl
                             text-sm font-medium hover:bg-red-600">
            Yes, delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Empty form ────────────────────────────────────
const EMPTY = {
  partCode: '', name: '', condition: 'New',
  description: '', buyPrice: '', sellPrice: '',
  quantity: '', minStock: '', unit: 'pcs',
  location: '', barcode: '', supplier: '', model: '',
}

// ════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════
export default function PartForm() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = !!id

  // ── Form state ────────────────────────────────
  const [form,         setForm]         = useState(EMPTY)
  const [selCategory,  setSelCategory]  = useState({ id: null, name: '' })
  const [selBrand,     setSelBrand]     = useState({ id: null, name: '' })
  
  const [imagePreview,  setImagePreview]  = useState(null)   // display URL
  const [imageBase64,   setImageBase64]   = useState(null)   // base64 string to send to API
  const [imageRemoving, setImageRemoving] = useState(false) 


  const [errors,       setErrors]       = useState({})
  const [toast,        setToast]        = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [showDelete,   setShowDelete]   = useState(false)
  const [deleting,     setDeleting]     = useState(false)

  // ── Lookup state ──────────────────────────────
  const [categories,     setCategories]     = useState([])
  const [brands,         setBrands]         = useState([])
  const [loadingLookups, setLoadingLookups] = useState(true)

  // ── Page loading (edit mode) ──────────────────
  const [pageLoading,  setPageLoading]  = useState(isEdit)
  const [loadError,    setLoadError]    = useState(null)

  // ── LOAD LOOKUPS ──────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingLookups(true)
      try {
        const [cats, brnds] = await Promise.all([
          categoriesApi.getAll(),
          brandsApi.getAll(),
        ])
        setCategories(cats  || [])
        setBrands(brnds || [])
      } catch (err) {
        console.error('Lookups load error:', err)
        showToast('Could not load categories/brands', 'error')
      } finally {
        setLoadingLookups(false)
      }
    }
    load()
  }, [])

  // ── LOAD PART in edit mode ────────────────────
  // Runs AFTER lookups are loaded so dropdowns are pre-filled
  useEffect(() => {
    if (!isEdit) return

    async function loadPart() {
      setPageLoading(true)
      setLoadError(null)
      try {
        console.log('Loading part id:', id)
        const part = await partsApi.getById(id)
        console.log('Part loaded:', part)

        if (!part) {
          setLoadError('Part not found')
          return
        }

        // Fill text fields
        setForm({
          partCode:    part.partCode    || '',
          name:        part.name        || '',
          condition:   part.condition   || 'New',
          description: part.description || '',
          buyPrice:    part.buyPrice    ?? '',
          sellPrice:   part.sellPrice   ?? '',
          quantity:    part.quantity    ?? '',
          minStock:    part.minStock    ?? '',
          unit:        part.unit        || 'pcs',
          location:    part.location    || '',
          barcode:     part.barcode     || '',
          supplier:    part.supplier    || '',
          model:       part.model       || '',
        })

        if (part.imageBase64) {
          setImagePreview(part.imageBase64)   // show existing image
          setImageBase64(part.imageBase64)    // keep it in payload
        }

        // Pre-fill category
        if (part.category) {
          setSelCategory({ id: part.categoryId || null, name: part.category })
        }

        // Pre-fill brand
        if (part.brand) {
          setSelBrand({ id: part.brandId || null, name: part.brand })
        }

        if (part.imageUrl) setImagePreview(part.imageUrl)

      } catch (err) {
        console.error('Part load error:', err)
        setLoadError(err.message || 'Failed to load part')
      } finally {
        setPageLoading(false)
      }
    }

    loadPart()
  }, [id, isEdit])

  // ── Helpers ───────────────────────────────────
  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Add new category / brand inline ──────────
  async function handleAddCategory(name) {
    const result = await categoriesApi.create({ name, sortOrder: 99 })
    setCategories(prev => [...prev, result])
    return result
  }

  async function handleAddBrand(name) {
    const result = await brandsApi.create({ name, sortOrder: 99 })
    setBrands(prev => [...prev, result])
    return result
  }

  // ── Validate ──────────────────────────────────
  function validate() {
    const e = {}
    if (!form.name.trim())                             e.name      = 'Part name is required'
    if (!selCategory.name)                             e.category  = 'Select a category'
    if (form.sellPrice === '' || +form.sellPrice <= 0) e.sellPrice = 'Enter a valid sell price'
    if (form.quantity  === '' || +form.quantity  <  0) e.quantity  = 'Enter a valid quantity'
    if (!form.unit)                                    e.unit      = 'Select a unit'
    return e
  }

  // ── Submit ────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const payload = {
      partCode:    form.partCode || null,
      name:        form.name.trim(),
      categoryId:  selCategory.id   || null,
      category:    selCategory.name || null,
      brandId:     selBrand.id      || null,
      brand:       selBrand.name    || null,
      model:       form.model       || null,
      condition:   form.condition,
      description: form.description || null,
      buyPrice:    parseFloat(form.buyPrice)  || 0,
      sellPrice:   parseFloat(form.sellPrice) || 0,
      quantity:    parseInt(form.quantity)    || 0,
      minStock:    parseInt(form.minStock)    || 0,
      unit:        form.unit,
      location:    form.location    || null,
      barcode:     form.barcode     || null,
      supplier:    form.supplier    || null,
      imageBase64: imageBase64     || null,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await partsApi.update(id, payload)
        showToast('Part updated successfully')
      } else {
        await partsApi.create(payload)
        showToast('Part added to inventory')
      }
      setTimeout(() => navigate('/inventory'), 1200)
    } catch (err) {
      showToast(err.message || 'Failed to save part', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────
  async function handleDelete() {
    setDeleting(true)
    try {
      await partsApi.delete(id)
      showToast('Part deleted')
      setTimeout(() => navigate('/inventory'), 1000)
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error')
      setShowDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  // ── Profit margin ─────────────────────────────
  const margin = form.buyPrice && form.sellPrice && +form.sellPrice > 0
    ? (((+form.sellPrice - +form.buyPrice) / +form.sellPrice) * 100).toFixed(1)
    : null

  // ── Page loading state ────────────────────────
  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Spinner size="page" />
        <p className="text-sm text-gray-400">Loading part details…</p>
      </div>
    )
  }

  // ── Load error state ──────────────────────────
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center
                        justify-center">
          <IconAlertTriangle size={22} className="text-red-500" />
        </div>
        <p className="text-sm text-red-600 font-medium">{loadError}</p>
        <button onClick={() => navigate('/inventory')}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">
          Back to inventory
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

      {toast && (
        <Toast message={toast.message} type={toast.type}
               onClose={() => setToast(null)} />
      )}

      {showDelete && (
        <DeleteModal partName={form.name || 'this part'}
                     onConfirm={handleDelete}
                     onCancel={() => setShowDelete(false)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/inventory')}
                  className="w-8 h-8 flex items-center justify-center border
                             border-gray-200 rounded-lg text-gray-500 hover:border-gray-300">
            <IconArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-xl font-medium text-gray-900">
              {isEdit ? 'Edit part' : 'Add new part'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Editing: ${form.name || '…'}` : 'Fill in details to add to inventory'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEdit && (
            <button type="button" onClick={() => setShowDelete(true)} disabled={deleting}
                    className="flex items-center gap-1.5 px-3 py-2 border border-red-200
                               rounded-lg text-xs text-red-500 hover:bg-red-50">
              <IconTrash size={13} />{deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button type="button" onClick={() => navigate('/inventory')}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600">
            Cancel
          </button>
          <button type="submit" form="part-form" disabled={saving}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs
                              font-medium transition-colors
                              ${saving
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
            {saving
              ? <><Spinner /> Saving…</>
              : <><IconDeviceFloppy size={13} />
                  {isEdit ? 'Save changes' : 'Add part'}
                </>}
          </button>
        </div>
      </div>

      {/* Form */}
      <form id="part-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT 2/3 ─────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic info */}
            <Section title="Basic information"
                     subtitle="Part name, category and identification">
              <div className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Part name" required error={errors.name}>
                    <Input placeholder="e.g. Oil filter"
                           value={form.name}
                           onChange={e => set('name', e.target.value)}
                           error={errors.name} />
                  </Field>
                  <Field label="Part code"
                         hint={isEdit ? 'Edit if needed' : 'Leave blank to auto-generate'}>
                    <Input placeholder="e.g. PRT-00182"
                           value={form.partCode}
                           onChange={e => set('partCode', e.target.value)} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* Category — from API */}
                  <LookupSelect
                    label="Category"
                    required
                    error={errors.category}
                    value={selCategory.name}
                    onChange={(name, id) => {
                      setSelCategory({ id, name })
                      if (errors.category)
                        setErrors(p => ({ ...p, category: null }))
                    }}
                    options={categories.map(c => ({ id: c.id, value: c.name }))}
                    onAdd={handleAddCategory}
                    loading={loadingLookups}
                  />

                  {/* Brand — from API */}
                  <LookupSelect
                    label="Brand"
                    value={selBrand.name}
                    onChange={(name, id) => setSelBrand({ id, name })}
                    options={brands.map(b => ({ id: b.id, value: b.name }))}
                    onAdd={handleAddBrand}
                    loading={loadingLookups}
                  />

                  {/* Condition */}
                  <Field label="Condition">
                    <select value={form.condition}
                            onChange={e => set('condition', e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                                       text-sm focus:outline-none focus:border-blue-400
                                       bg-white appearance-none">
                      {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Compatible models" hint="Separate multiple with commas">
                  <Input placeholder="e.g. Corolla, Yaris, Vios"
                         value={form.model}
                         onChange={e => set('model', e.target.value)} />
                </Field>

                <Field label="Description">
                  <textarea value={form.description}
                            onChange={e => set('description', e.target.value)}
                            rows={3} placeholder="Describe the part, specs…"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                                       text-sm focus:outline-none focus:border-blue-400 resize-none" />
                </Field>
              </div>
            </Section>

            {/* Pricing */}
            <Section title="Pricing" subtitle="Buy price, sell price and margin">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Buy price (cost)">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2
                                       text-gray-400 text-sm">$</span>
                      <Input type="number" min="0" step="0.01" placeholder="0.00"
                             value={form.buyPrice}
                             onChange={e => set('buyPrice', e.target.value)}
                             className="pl-6" />
                    </div>
                  </Field>
                  <Field label="Sell price" required error={errors.sellPrice}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2
                                       text-gray-400 text-sm">$</span>
                      <Input type="number" min="0" step="0.01" placeholder="0.00"
                             value={form.sellPrice}
                             onChange={e => set('sellPrice', e.target.value)}
                             error={errors.sellPrice} className="pl-6" />
                    </div>
                  </Field>
                  <Field label="Profit margin">
                    <div className="w-full px-3 py-2.5 border border-gray-100 rounded-lg
                                    bg-gray-50 flex items-center justify-between text-sm">
                      <span className="text-xs text-gray-400">Auto-calculated</span>
                      {margin !== null && (
                        <span className={`font-medium
                          ${+margin < 0   ? 'text-red-500'
                          : +margin < 20  ? 'text-amber-500'
                          : 'text-green-600'}`}>
                          {margin}%
                        </span>
                      )}
                    </div>
                  </Field>
                </div>
                {margin !== null && +margin < 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50
                                  border border-red-100 rounded-lg">
                    <IconAlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600">
                      Sell price is lower than buy price — you'll lose money on this part.
                    </p>
                  </div>
                )}
              </div>
            </Section>

            {/* Stock */}
            <Section title="Stock & location"
                     subtitle="Quantity, minimum stock and location">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Quantity" required error={errors.quantity}>
                    <Input type="number" min="0" placeholder="0"
                           value={form.quantity}
                           onChange={e => set('quantity', e.target.value)}
                           error={errors.quantity} />
                    <StockIndicator qty={form.quantity} min={form.minStock} />
                  </Field>
                  <Field label="Minimum stock" hint="Alert threshold">
                    <Input type="number" min="0" placeholder="e.g. 10"
                           value={form.minStock}
                           onChange={e => set('minStock', e.target.value)} />
                  </Field>
                  <Field label="Unit" required error={errors.unit}>
                    <select value={form.unit}
                            onChange={e => set('unit', e.target.value)}
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm
                                        focus:outline-none focus:border-blue-400
                                        bg-white appearance-none
                                        ${errors.unit
                                          ? 'border-red-300' : 'border-gray-200'}`}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Location" hint="Shelf or bin number">
                    <Input placeholder="e.g. Shelf A3, Bin 12"
                           value={form.location}
                           onChange={e => set('location', e.target.value)} />
                  </Field>
                  <Field label="Barcode">
                    <Input placeholder="Scan or enter barcode"
                           value={form.barcode}
                           onChange={e => set('barcode', e.target.value)} />
                  </Field>
                </div>
                <Field label="Supplier name">
                  <Input placeholder="e.g. AutoParts Lanka Pvt Ltd"
                         value={form.supplier}
                         onChange={e => set('supplier', e.target.value)} />
                </Field>
              </div>
            </Section>
          </div>

          {/* ── RIGHT 1/3 ────────────────────── */}
          <div className="space-y-5">

            {/* Image upload */}
            <Section title="Part image" subtitle="Upload a photo of the part">
 
  {/* Upload area */}
  <label className={`flex flex-col items-center justify-center w-full h-44
                     border-2 border-dashed rounded-xl cursor-pointer
                     transition-colors group relative overflow-hidden
                     ${imagePreview
                       ? 'border-blue-300 bg-blue-50'
                       : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'}`}>
    {imagePreview ? (
      // Show existing/uploaded image
      <img
        src={imagePreview}
        alt="Part"
        className="w-full h-full object-contain p-2 rounded-xl"
      />
    ) : (
      // Upload placeholder
      <div className="flex flex-col items-center gap-2 text-gray-400
                      group-hover:text-blue-400 transition-colors">
        <IconPhoto size={28} />
        <p className="text-xs font-medium">Click to upload image</p>
        <p className="text-[10px] text-gray-300">PNG, JPG, WEBP up to 2MB</p>
      </div>
    )}
 
    {/* Hidden file input */}
    <input
      type="file"
      accept="image/png, image/jpeg, image/jpg, image/webp"
      className="hidden"
      onChange={async e => {
        const file = e.target.files[0]
        if (!file) return
 
        // Validate size — max 2MB
        if (file.size > 2 * 1024 * 1024) {
          showToast('Image too large. Max size is 2MB', 'error')
          e.target.value = ''
          return
        }
 
        // Show preview immediately
        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)
 
        // Convert to base64 for API
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result  // "data:image/jpeg;base64,..."
          setImageBase64(base64)
        }
        reader.onerror = () => {
          showToast('Failed to read image file', 'error')
        }
        reader.readAsDataURL(file)
      }}
    />
  </label>
 
  {/* Remove button — shown only if image exists */}
  {imagePreview && (
    <button
      type="button"
      onClick={() => {
        setImagePreview(null)
        setImageBase64(null)
      }}
      className="mt-2 w-full py-2 border border-gray-200 rounded-lg
                 text-xs text-red-400 hover:border-red-300 hover:bg-red-50
                 flex items-center justify-center gap-1.5 transition-colors"
    >
      <IconTrash size={12} /> Remove image
    </button>
  )}
 
  {/* Image info */}
  {imageBase64 && (
    <p className="text-[10px] text-green-600 text-center mt-1.5
                  flex items-center justify-center gap-1">
      <IconCheck size={10} /> Image ready to save
    </p>
  )}
</Section>

            {/* Summary */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-900 mb-4">Summary</p>
              <div className="space-y-3">
                {[
                  { label: 'Part code',  value: form.partCode      || '(auto)'          },
                  { label: 'Category',   value: selCategory.name   || '—'               },
                  { label: 'Brand',      value: selBrand.name      || '—'               },
                  { label: 'Condition',  value: form.condition     || '—'               },
                  { label: 'Sell price', value: form.sellPrice
                      ? `$${(+form.sellPrice).toFixed(2)}` : '—'                        },
                  { label: 'In stock',   value: form.quantity !== ''
                      ? `${form.quantity} ${form.unit}` : '—'                           },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{row.label}</span>
                    <span className="text-xs font-medium text-gray-800
                                     text-right max-w-32 truncate">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <IconPackage size={14} className="text-blue-500" />
                <p className="text-xs font-medium text-blue-700">Tips</p>
              </div>
              <ul className="space-y-1.5">
                {[
                  'Pick "+ Add new category…" to create custom categories',
                  'Pick "+ Add new brand…" to add brands on the fly',
                  'Set minimum stock for low-stock alerts',
                  'Leave part code blank to auto-generate',
                ].map((tip, i) => (
                  <li key={i} className="text-[11px] text-blue-600 flex gap-1.5">
                    <span className="mt-0.5 flex-shrink-0">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom save bar */}
        <div className="mt-5 bg-white border border-gray-100 rounded-xl
                        px-5 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            {isEdit
              ? 'Changes update inventory immediately'
              : 'Part will be added to inventory after saving'}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/inventory')}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg
                               text-sm text-gray-600 hover:border-gray-300">
              Cancel
            </button>
            <button type="submit" form="part-form" disabled={saving}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg
                                text-sm font-medium transition-colors
                                ${saving
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
              {saving
                ? <><Spinner /> Saving…</>
                : <><IconDeviceFloppy size={15} />
                    {isEdit ? 'Save changes' : 'Add to inventory'}
                  </>}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}