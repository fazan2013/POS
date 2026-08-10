// ================================================
// src/pages/PartForm.jsx  — fully API connected
// ================================================
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  IconArrowLeft, IconDeviceFloppy, IconTrash,
  IconPackage, IconPhoto, IconAlertTriangle,
  IconCheck, IconX
} from '@tabler/icons-react'
import { partsApi } from '../services/api'

// ── Constants ─────────────────────────────────────
const CATEGORIES = ['Engine', 'Brakes', 'Filter', 'Electrical', 'Suspension', 'Body', 'Transmission', 'Cooling']
const BRANDS     = ['Toyota', 'Honda', 'Nissan', 'Suzuki', 'Mitsubishi', 'Hyundai', 'Ford', 'Universal']
const UNITS      = ['pcs', 'set', 'pair', 'litre', 'kg', 'meter']
const CONDITIONS = ['New', 'Refurbished', 'Used']

// ── Empty form state ──────────────────────────────
const EMPTY_FORM = {
  partCode:    '',
  name:        '',
  category:    '',
  brand:       '',
  model:       '',
  condition:   'New',
  description: '',
  buyPrice:    '',
  sellPrice:   '',
  quantity:    '',
  minStock:    '',
  unit:        'pcs',
  location:    '',
  barcode:     '',
  supplier:    '',
}

// ── Toast ─────────────────────────────────────────
function Toast({ message, type, onClose }) {
  if (!message) return null
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5
                     px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                     ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
      {message}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <IconX size={14} />
      </button>
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────
function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase
                        tracking-wider mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[10px] text-gray-400 mt-1">{hint}</p>
      )}
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
    <input
      {...props}
      className={`w-full px-3 py-2.5 border rounded-lg text-sm
                  focus:outline-none transition-colors bg-white
                  ${error
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-gray-200 focus:border-blue-400'}
                  ${className}`}
    />
  )
}

// ── Select ────────────────────────────────────────
function Select({ error, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2.5 border rounded-lg text-sm
                  focus:outline-none transition-colors bg-white appearance-none
                  ${error
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-gray-200 focus:border-blue-400'}`}
    >
      {children}
    </select>
  )
}

// ── Textarea ──────────────────────────────────────
function Textarea({ error, ...props }) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`w-full px-3 py-2.5 border rounded-lg text-sm
                  focus:outline-none transition-colors bg-white resize-none
                  ${error
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-gray-200 focus:border-blue-400'}`}
    />
  )
}

// ── Section Card ──────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

// ── Image Upload ──────────────────────────────────
function ImageUpload({ preview, onChange }) {
  return (
    <div className="space-y-3">
      <label className={`flex flex-col items-center justify-center w-full h-40
                         border-2 border-dashed rounded-xl cursor-pointer
                         transition-colors group
                         ${preview
                           ? 'border-blue-300 bg-blue-50'
                           : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'}`}>
        {preview ? (
          <img src={preview} alt="Part preview"
               className="h-full w-full object-contain p-2 rounded-xl" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400
                          group-hover:text-blue-400 transition-colors">
            <IconPhoto size={28} />
            <p className="text-xs font-medium">Click to upload image</p>
            <p className="text-[10px]">PNG, JPG up to 5MB</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files[0]
            if (file) onChange(URL.createObjectURL(file))
          }}
        />
      </label>
      {preview && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="w-full py-2 border border-gray-200 rounded-lg text-xs
                     text-red-400 hover:border-red-300 hover:bg-red-50
                     transition-colors flex items-center justify-center gap-1.5"
        >
          <IconTrash size={12} /> Remove image
        </button>
      )}
    </div>
  )
}

// ── Stock Status Indicator ────────────────────────
function StockIndicator({ qty, min }) {
  if (qty === '' || qty === undefined || qty === null) return null
  const q = parseInt(qty)
  const m = parseInt(min) || 10
  if (isNaN(q)) return null
  if (q === 0) return (
    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      Out of stock
    </div>
  )
  if (q <= m) return (
    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-500">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
      Low stock — below minimum ({m})
    </div>
  )
  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-600">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
      In stock
    </div>
  )
}

// ── Delete Confirm Modal ──────────────────────────
function DeleteModal({ partName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center
                        justify-center mx-auto mb-4">
          <IconTrash size={22} className="text-red-500" />
        </div>
        <h3 className="text-base font-medium text-gray-900 text-center mb-2">
          Delete this part?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          <span className="font-medium text-gray-800">{partName}</span> will be
          permanently removed. This cannot be undone.
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

// ── Spinner ───────────────────────────────────────
function Spinner() {
  return (
    <span className="w-4 h-4 border-2 border-white/30 border-t-white
                     rounded-full animate-spin inline-block" />
  )
}

// ── Main Form Component ───────────────────────────
export default function PartForm() {
  const navigate  = useNavigate()
  const { id }    = useParams()           // present on /parts/edit/:id
  const isEdit    = !!id

  const [form,        setForm]        = useState(EMPTY_FORM)
  const [imagePreview,setImagePreview]= useState(null)
  const [errors,      setErrors]      = useState({})
  const [toast,       setToast]       = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [loadingPart, setLoadingPart] = useState(isEdit)
  const [showDelete,  setShowDelete]  = useState(false)
  const [deleting,    setDeleting]    = useState(false)

  // ── Load existing part in edit mode ──────────
  useEffect(() => {
    if (!isEdit) return

    async function loadPart() {
      setLoadingPart(true)
      try {
        const part = await partsApi.getById(id)
        if (!part) {
          showToast('Part not found', 'error')
          navigate('/inventory')
          return
        }
        // Map API response → form fields
        setForm({
          partCode:    part.partCode    || '',
          name:        part.name        || '',
          category:    part.category    || '',
          brand:       part.brand       || '',
          model:       part.model       || '',
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
        })
        if (part.imageUrl) setImagePreview(part.imageUrl)
      } catch (err) {
        showToast(err.message || 'Failed to load part', 'error')
        navigate('/inventory')
      } finally {
        setLoadingPart(false)
      }
    }

    loadPart()
  }, [id, isEdit, navigate])

  // ── Field updater ─────────────────────────────
  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  // ── Toast helper ──────────────────────────────
  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Validation ────────────────────────────────
  function validate() {
    const e = {}
    if (!form.name.trim())                       e.name      = 'Part name is required'
    if (!form.category)                          e.category  = 'Select a category'
    if (form.sellPrice === '' || form.sellPrice <= 0)
                                                 e.sellPrice = 'Enter a valid selling price'
    if (form.quantity === '' || parseInt(form.quantity) < 0)
                                                 e.quantity  = 'Enter a valid quantity'
    if (!form.unit)                              e.unit      = 'Select a unit'
    return e
  }

  // ── Build API payload ─────────────────────────
  function buildPayload() {
    return {
      name:        form.name.trim(),
      category:    form.category,
      brand:       form.brand,
      model:       form.model,
      condition:   form.condition,
      description: form.description,
      buyPrice:    parseFloat(form.buyPrice)  || 0,
      sellPrice:   parseFloat(form.sellPrice) || 0,
      quantity:    parseInt(form.quantity)    || 0,
      minStock:    parseInt(form.minStock)    || 0,
      unit:        form.unit,
      location:    form.location,
      barcode:     form.barcode,
      supplier:    form.supplier,
    }
  }

  // ── Submit handler ────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()

    // Validate
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload()

      if (isEdit) {
        // ── UPDATE existing part ────────────────
        await partsApi.update(id, payload)
        showToast('Part updated successfully', 'success')
      } else {
        // ── CREATE new part ─────────────────────
        await partsApi.create(payload)
        showToast('Part added to inventory', 'success')
      }

      // Navigate back after short delay so toast is visible
      setTimeout(() => navigate('/inventory'), 1200)

    } catch (err) {
      showToast(err.message || 'Failed to save part', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete handler ────────────────────────────
  async function handleDelete() {
    setDeleting(true)
    try {
      await partsApi.delete(id)
      showToast('Part deleted', 'success')
      setTimeout(() => navigate('/inventory'), 1000)
    } catch (err) {
      showToast(err.message || 'Failed to delete part', 'error')
      setShowDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  // ── Profit margin ─────────────────────────────
  const margin = form.buyPrice && form.sellPrice
    ? (((parseFloat(form.sellPrice) - parseFloat(form.buyPrice))
        / parseFloat(form.sellPrice)) * 100).toFixed(1)
    : null

  // ── Loading state (edit mode fetching part) ───
  if (loadingPart) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-slate-700
                        rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {showDelete && (
        <DeleteModal
          partName={form.name || 'this part'}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      {/* ── Page Header ──────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="w-8 h-8 flex items-center justify-center border
                       border-gray-200 rounded-lg text-gray-500
                       hover:border-gray-300 transition-colors"
          >
            <IconArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-xl font-medium text-gray-900">
              {isEdit ? 'Edit part' : 'Add new part'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit
                ? `Editing ${form.name}`
                : 'Fill in the details to add a new part to inventory'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-200
                         rounded-lg text-xs text-red-500 hover:bg-red-50
                         transition-colors disabled:opacity-50"
            >
              <IconTrash size={13} />
              {deleting ? 'Deleting…' : 'Delete part'}
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs
                       text-gray-600 hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="part-form"
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs
                        font-medium transition-colors
                        ${saving
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-slate-900 text-white hover:bg-slate-700'}`}
          >
            {saving
              ? <><Spinner /> Saving…</>
              : <><IconDeviceFloppy size={13} />{isEdit ? 'Save changes' : 'Add part'}</>}
          </button>
        </div>
      </div>

      {/* ── Form ─────────────────────────────── */}
      <form id="part-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT column (2/3) ──────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic Information */}
            <Section
              title="Basic information"
              subtitle="Part name, category and identification"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Part name" required error={errors.name}>
                    <Input
                      placeholder="e.g. Oil filter"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      error={errors.name}
                    />
                  </Field>
                  <Field
                    label="Part code"
                    hint={isEdit ? 'Auto-generated — edit if needed' : 'Leave blank to auto-generate'}
                  >
                    <Input
                      placeholder="e.g. PRT-00182"
                      value={form.partCode}
                      onChange={e => set('partCode', e.target.value)}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Condition">
                    <Select
                      value={form.condition}
                      onChange={e => set('condition', e.target.value)}
                    >
                      {CONDITIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Category" required error={errors.category}>
                    <Select
                      value={form.category}
                      onChange={e => set('category', e.target.value)}
                      error={errors.category}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Brand">
                    <Select
                      value={form.brand}
                      onChange={e => set('brand', e.target.value)}
                    >
                      <option value="">Select brand</option>
                      {BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Unit" required error={errors.unit}>
                    <Select
                      value={form.unit}
                      onChange={e => set('unit', e.target.value)}
                      error={errors.unit}
                    >
                      {UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field
                  label="Compatible models"
                  hint="Separate multiple models with commas"
                >
                  <Input
                    placeholder="e.g. Corolla, Yaris, Vios"
                    value={form.model}
                    onChange={e => set('model', e.target.value)}
                  />
                </Field>

                <Field label="Description">
                  <Textarea
                    placeholder="Describe the part, compatibility, specs…"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* Pricing */}
            <Section
              title="Pricing"
              subtitle="Buy price, sell price and profit margin"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Buy price (cost)">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2
                                       text-gray-400 text-sm">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.buyPrice}
                        onChange={e => set('buyPrice', e.target.value)}
                        className="pl-6"
                      />
                    </div>
                  </Field>

                  <Field label="Sell price" required error={errors.sellPrice}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2
                                       text-gray-400 text-sm">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.sellPrice}
                        onChange={e => set('sellPrice', e.target.value)}
                        error={errors.sellPrice}
                        className="pl-6"
                      />
                    </div>
                  </Field>

                  <Field label="Profit margin">
                    <div className="w-full px-3 py-2.5 border border-gray-100
                                    rounded-lg text-sm bg-gray-50 flex items-center
                                    justify-between">
                      <span className="text-gray-400 text-xs">Auto-calculated</span>
                      {margin !== null && (
                        <span className={`text-sm font-medium
                          ${parseFloat(margin) < 0
                            ? 'text-red-500'
                            : parseFloat(margin) < 20
                              ? 'text-amber-500'
                              : 'text-green-600'}`}>
                          {margin}%
                        </span>
                      )}
                    </div>
                  </Field>
                </div>

                {/* Margin warning */}
                {margin !== null && parseFloat(margin) < 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50
                                  border border-red-100 rounded-lg">
                    <IconAlertTriangle size={14}
                      className="text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600">
                      Sell price is lower than buy price — you will lose money on this part.
                    </p>
                  </div>
                )}
              </div>
            </Section>

            {/* Stock */}
            <Section
              title="Stock & location"
              subtitle="Quantity, minimum stock and shelf location"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Quantity" required error={errors.quantity}>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.quantity}
                      onChange={e => set('quantity', e.target.value)}
                      error={errors.quantity}
                    />
                    <StockIndicator qty={form.quantity} min={form.minStock} />
                  </Field>

                  <Field
                    label="Minimum stock"
                    hint="Alert when stock drops below this"
                  >
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 10"
                      value={form.minStock}
                      onChange={e => set('minStock', e.target.value)}
                    />
                  </Field>

                  <Field label="Barcode">
                    <Input
                      placeholder="Scan or enter barcode"
                      value={form.barcode}
                      onChange={e => set('barcode', e.target.value)}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Shelf / location"
                    hint="Where this part is stored"
                  >
                    <Input
                      placeholder="e.g. Shelf A3, Bin 12"
                      value={form.location}
                      onChange={e => set('location', e.target.value)}
                    />
                  </Field>

                  <Field label="Supplier name">
                    <Input
                      placeholder="e.g. AutoParts Lanka Pvt Ltd"
                      value={form.supplier}
                      onChange={e => set('supplier', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </Section>

          </div>

          {/* ── RIGHT column (1/3) ─────────── */}
          <div className="space-y-5">

            {/* Image Upload */}
            <Section title="Part image" subtitle="Upload a photo of the part">
              <ImageUpload
                preview={imagePreview}
                onChange={url => setImagePreview(url)}
              />
            </Section>

            {/* Live Summary */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-900 mb-4">Part summary</p>
              <div className="space-y-3">
                {[
                  { label: 'Part code',  value: form.partCode  || '(auto-generated)' },
                  { label: 'Category',   value: form.category  || '—' },
                  { label: 'Brand',      value: form.brand     || '—' },
                  { label: 'Condition',  value: form.condition || '—' },
                  { label: 'Sell price', value: form.sellPrice
                      ? `$${parseFloat(form.sellPrice).toFixed(2)}` : '—' },
                  { label: 'In stock',   value: form.quantity !== ''
                      ? `${form.quantity} ${form.unit}` : '—' },
                  { label: 'Location',   value: form.location  || '—' },
                ].map(row => (
                  <div key={row.label}
                       className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{row.label}</span>
                    <span className="text-xs font-medium text-gray-800
                                     text-right max-w-32 truncate">
                      {row.value}
                    </span>
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
                  'Set minimum stock to get low-stock alerts',
                  'Add compatible models for quick POS search',
                  'Buy price helps calculate profit margin',
                  'Upload a clear image for faster identification',
                ].map((tip, i) => (
                  <li key={i}
                      className="text-[11px] text-blue-600 flex gap-1.5">
                    <span className="mt-0.5 flex-shrink-0">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* ── Bottom Save Bar ───────────────── */}
        <div className="mt-5 bg-white border border-gray-100 rounded-xl
                        px-5 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            {isEdit
              ? 'Changes will update inventory immediately after saving'
              : 'Part will be added to inventory after saving'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                         text-gray-600 hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="part-form"
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg
                          text-sm font-medium transition-colors
                          ${saving
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:bg-slate-700'}`}
            >
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
