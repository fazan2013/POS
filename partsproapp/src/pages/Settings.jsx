// ================================================
// src/pages/Settings.jsx  — Profile tab API connected
// ================================================
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconUser, IconBuildingStore, IconBell, IconShield,
  IconPalette, IconReceipt, IconDatabase, IconDeviceFloppy,
  IconCheck, IconEye, IconEyeOff, IconUpload, IconTrash,
  IconAlertTriangle, IconMoon, IconSun, IconLogout,
  IconX, IconRefresh
} from '@tabler/icons-react'
import { getUser, clearSession } from '../services/api'
import { profileApi } from '../services/api'

// ── API calls for profile ─────────────────────────
// Add these endpoints to your api.js:
//
// export const profileApi = {
//   getMe:           ()     => get('/auth/me'),
//   updateProfile:   body   => put('/auth/profile', body),
//   changePassword:  body   => post('/auth/change-password', body),
// }
//
// For now we read from localStorage and simulate save.
// Wire up when backend endpoints are ready.

// ── Toast ─────────────────────────────────────────
function Toast({ message, type, onClose }) {
  if (!message) return null
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5
                     px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                     animate-bounce-once
                     ${type === 'error'
                       ? 'bg-red-500 text-white'
                       : 'bg-green-600 text-white'}`}>
      {type === 'error'
        ? <IconAlertTriangle size={16} />
        : <IconCheck size={16} />}
      {message}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <IconX size={14} />
      </button>
    </div>
  )
}

// ── Section Card ──────────────────────────────────
function Section({ title, subtitle, icon, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center
                        justify-center text-slate-600 flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

// ── Field ─────────────────────────────────────────
function Field({ label, hint, error, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500
                        uppercase tracking-wider mb-1.5">
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

// ── Spinner ───────────────────────────────────────
function Spinner() {
  return (
    <span className="w-4 h-4 border-2 border-white/30 border-t-white
                     rounded-full animate-spin inline-block" />
  )
}

function PageLoader() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-16
                    flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-gray-200 border-t-slate-700
                      rounded-full animate-spin" />
    </div>
  )
}


// ── Toggle Switch ─────────────────────────────────
function Toggle({ checked, onChange, label, sub }) {
  return (
    <div className="flex items-center justify-between py-3
                    border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors
                    flex-shrink-0 ml-4
                    ${checked ? 'bg-slate-900' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full
                          shadow transition-transform
                          ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

// ── Save Button ───────────────────────────────────
function SaveButton({ label = 'Save changes', saving, onClick }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={saving}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl
                    text-sm font-medium transition-colors
                    ${saving
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-700'}`}
      >
        {saving ? <><Spinner /> Saving…</> : <><IconDeviceFloppy size={15} />{label}</>}
      </button>
    </div>
  )
}

// ════════════════════════════════════════════════
// PROFILE TAB — loads from localStorage, saves to API
// ════════════════════════════════════════════════
//

// ================================================
// STEP 8 — Replace ProfileTab in Settings.jsx
// Full profile tab with image upload + save
// ================================================

function ProfileTab({ onToast }) {
  const currentUser  = getUser()

  // ── Refs for text inputs (avoids re-render bug) ──
  const firstNameRef = useRef(null)
  const lastNameRef  = useRef(null)
  const emailRef     = useRef(null)
  const phoneRef     = useRef(null)
  const fileInputRef = useRef(null)

  // ── State ──────────────────────────────────────
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [removingImg,  setRemovingImg]  = useState(false)
  const [errors,       setErrors]       = useState({})
  const [profileData,  setProfileData]  = useState(null)

  // Preview state — what the user SEES in the circle
  // starts as the saved image from API, updates on pick
  const [imagePreview, setImagePreview] = useState(null)
  // Pending upload: { base64, mimeType } — set when user picks image
  const [pendingImage, setPendingImage] = useState(null)

  // ── Load from API ─────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await profileApi.getMe()
        setProfileData(data)
        setImagePreview(data.profileImage || null)
      } catch (err) {
        console.warn('Profile load error:', err.message)
        onToast('Could not load profile from server', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Derive display values ─────────────────────
  const displayName  = profileData?.fullName || currentUser?.fullName || ''
  const displayEmail = profileData?.email    || currentUser?.email    || ''
  const displayRole  = profileData?.role     || currentUser?.role     || ''
  const nameParts    = displayName.split(' ')
  const showFirst    = nameParts[0] || ''
  const showLast     = nameParts.slice(1).join(' ') || ''

  function clearError(field) {
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }

  // ── Handle image file pick ────────────────────
  function handleFilePick(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      onToast('Only JPG, PNG or WebP images allowed', 'error')
      return
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      onToast('Image must be under 2MB', 'error')
      return
    }

    // Read as base64
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl   = ev.target.result          // full data URL
      const base64    = dataUrl.split(',')[1]     // just the base64 part
      const mimeType  = file.type

      // Show preview immediately
      setImagePreview(dataUrl)

      // Store pending — will upload on "Save profile"
      setPendingImage({ base64, mimeType })
    }
    reader.readAsDataURL(file)

    // Reset file input so same file can be re-selected
    e.target.value = ''
  }

  // ── Upload image to API ───────────────────────
  async function uploadImage(base64, mimeType) {
    setUploadingImg(true)
    try {
      const res = await profileApi.uploadImage({ imageBase64: base64, mimeType })
      return res.profileImage  // data URL saved in DB
    } finally {
      setUploadingImg(false)
    }
  }

  // ── Remove image ──────────────────────────────
  async function handleRemoveImage() {
    if (!confirm('Remove your profile photo?')) return
    setRemovingImg(true)
    try {
      await profileApi.removeImage()
      setImagePreview(null)
      setPendingImage(null)
      setProfileData(p => p ? { ...p, profileImage: null } : p)

      // Update localStorage
      const stored = getUser()
      localStorage.setItem('pp_user', JSON.stringify({
        ...stored, profileImage: null
      }))

      onToast('Profile photo removed', 'success')
    } catch (err) {
      onToast(err.message || 'Failed to remove photo', 'error')
    } finally {
      setRemovingImg(false)
    }
  }

  // ── Save profile (text + image together) ──────
  async function handleSave() {
    const firstName = firstNameRef.current?.value?.trim() || ''
    const lastName  = lastNameRef.current?.value?.trim()  || ''
    const email     = emailRef.current?.value?.trim()     || ''
    const phone     = phoneRef.current?.value?.trim()     || ''

    // Validate
    const e = {}
    if (!firstName) e.firstName = 'First name is required'
    if (!email)     e.email     = 'Email is required'
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try {
      // 1️⃣ Upload image first if user picked one
      let savedImageUrl = profileData?.profileImage || null
      if (pendingImage) {
        savedImageUrl = await uploadImage(pendingImage.base64, pendingImage.mimeType)
        setPendingImage(null)
      }

      // 2️⃣ Save profile text fields
      const res = await profileApi.updateProfile({
        fullName: `${firstName} ${lastName}`.trim(),
        email,
        phone: phone || null,
      })

      // 3️⃣ Update local state
      const updatedProfile = { ...res.profile, profileImage: savedImageUrl }
      setProfileData(updatedProfile)
      setImagePreview(savedImageUrl)

      // 4️⃣ Update localStorage so sidebar shows new name/image
      localStorage.setItem('pp_user', JSON.stringify({
        ...currentUser,
        fullName:     updatedProfile.fullName,
        email:        updatedProfile.email,
        profileImage: savedImageUrl,
      }))

      onToast('Profile saved successfully', 'success')

    } catch (err) {
      onToast(err.message || 'Failed to save profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <Section
      title="Profile"
      subtitle="Your personal account details"
      icon={<IconUser size={16} />}
    >
      <div className="space-y-5">

        {/* ── Profile Image ──────────────────── */}
        <div className="flex items-center gap-5">

          {/* Avatar circle */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2
                            border-gray-200 bg-sky-400 flex items-center
                            justify-center text-2xl font-medium text-slate-900">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {showFirst.charAt(0).toUpperCase()}
                  {showLast.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Upload spinner overlay */}
            {(uploadingImg || removingImg) && (
              <div className="absolute inset-0 rounded-full bg-black/40
                              flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white
                                rounded-full animate-spin" />
              </div>
            )}

            {/* Pending badge */}
            {pendingImage && !uploadingImg && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400
                              rounded-full flex items-center justify-center
                              text-[9px] font-bold text-white"
                   title="Image will be saved when you click Save profile">
                !
              </div>
            )}
          </div>

          {/* Upload controls */}
          <div className="space-y-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFilePick}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImg || saving}
              className="flex items-center gap-1.5 px-3 py-2 border
                         border-gray-200 rounded-lg text-xs text-gray-600
                         hover:border-blue-400 hover:text-blue-500
                         transition-colors disabled:opacity-50
                         disabled:cursor-not-allowed"
            >
              <IconUpload size={13} />
              {pendingImage ? 'Change photo' : 'Upload photo'}
            </button>

            {/* Remove button — only if image exists */}
            {(imagePreview) && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={removingImg || saving}
                className="flex items-center gap-1.5 px-3 py-2 border
                           border-red-200 rounded-lg text-xs text-red-400
                           hover:bg-red-50 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconTrash size={13} />
                {removingImg ? 'Removing…' : 'Remove photo'}
              </button>
            )}

            <p className="text-[10px] text-gray-400">
              JPG, PNG or WebP · Max 2MB
              {pendingImage && (
                <span className="text-amber-500 ml-1">
                  · Will save with profile ↓
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── User info banner ──────────────── */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50
                        border border-blue-100 rounded-lg">
          <IconUser size={14} className="text-blue-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-blue-800 truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-blue-500 truncate">
              Role: {displayRole} · {displayEmail}
            </p>
          </div>
        </div>

        {/* ── Name fields ───────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" required error={errors.firstName}>
            <input
              ref={firstNameRef}
              key={`first-${showFirst}`}
              defaultValue={showFirst}
              placeholder="e.g. Admin"
              onChange={() => clearError('firstName')}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm
                          focus:outline-none transition-colors
                          ${errors.firstName
                            ? 'border-red-300 focus:border-red-400'
                            : 'border-gray-200 focus:border-blue-400'}`}
            />
          </Field>
          <Field label="Last name">
            <input
              ref={lastNameRef}
              key={`last-${showLast}`}
              defaultValue={showLast}
              placeholder="e.g. Silva"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                         text-sm focus:outline-none focus:border-blue-400"
            />
          </Field>
        </div>

        {/* ── Email ─────────────────────────── */}
        <Field label="Email address" required error={errors.email}>
          <input
            ref={emailRef}
            key={`email-${displayEmail}`}
            type="email"
            defaultValue={displayEmail}
            placeholder="admin@partsproapp.com"
            onChange={() => clearError('email')}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm
                        focus:outline-none transition-colors
                        ${errors.email
                          ? 'border-red-300 focus:border-red-400'
                          : 'border-gray-200 focus:border-blue-400'}`}
          />
        </Field>

        {/* ── Phone + Role ──────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input
              ref={phoneRef}
              defaultValue=""
              placeholder="+94 77 123 4567"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                         text-sm focus:outline-none focus:border-blue-400"
            />
          </Field>
          <Field label="Role" hint="Managed by administrator">
            <input
              value={displayRole}
              disabled readOnly
              className="w-full px-3 py-2.5 border border-gray-100 rounded-lg
                         text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </Field>
        </div>

        {/* ── Save Button ───────────────────── */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploadingImg}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl
                        text-sm font-medium transition-colors
                        ${saving || uploadingImg
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-slate-900 text-white hover:bg-slate-700'}`}
          >
            {saving || uploadingImg
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin" /> Saving…</>
              : <><IconDeviceFloppy size={15} /> Save profile</>}
          </button>
        </div>
      </div>
    </Section>
  )
}


//


// ════════════════════════════════════════════════
// STORE TAB
// ════════════════════════════════════════════════
function StoreTab({ onToast }) {
  const nameRef    = useRef(null)
  const addressRef = useRef(null)
  const phoneRef   = useRef(null)
  const emailRef   = useRef(null)
  const taxIdRef   = useRef(null)

  const [currency, setCurrency] = useState('USD')
  const [timezone, setTimezone] = useState('Asia/Colombo')
  const [language, setLanguage] = useState('English')
  const [saving,   setSaving]   = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      onToast('Store settings saved', 'success')
    } catch {
      onToast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg " +
                     "text-sm focus:outline-none focus:border-blue-400"
  const selectClass = inputClass + " bg-white appearance-none"

  return (
    <Section
      title="Store settings"
      subtitle="Business info shown on receipts and reports"
      icon={<IconBuildingStore size={16} />}
    >
      <div className="space-y-4">
        <Field label="Store name">
          <input ref={nameRef} defaultValue="PartsPro Auto Spares"
                 placeholder="Your store name" className={inputClass} />
        </Field>
        <Field label="Address">
          <input ref={addressRef} defaultValue="No 45, Baseline Rd, Colombo 09"
                 placeholder="Street, City" className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input ref={phoneRef} defaultValue="+94 11 234 5678"
                   placeholder="+94 11 234 5678" className={inputClass} />
          </Field>
          <Field label="Email">
            <input ref={emailRef} type="email"
                   defaultValue="info@partsproapp.com"
                   placeholder="info@store.com" className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tax / VAT ID">
            <input ref={taxIdRef} defaultValue="VAT-12345678"
                   placeholder="VAT-XXXXXXXX" className={inputClass} />
          </Field>
          <Field label="Currency">
            <select value={currency} onChange={e => setCurrency(e.target.value)}
                    className={selectClass}>
              {['USD', 'LKR', 'EUR', 'GBP', 'AUD'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Timezone">
            <select value={timezone} onChange={e => setTimezone(e.target.value)}
                    className={selectClass}>
              {['Asia/Colombo','Asia/Kolkata','UTC','America/New_York','Europe/London'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Language">
            <select value={language} onChange={e => setLanguage(e.target.value)}
                    className={selectClass}>
              {['English','Sinhala','Tamil'].map(l => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
        <SaveButton label="Save store settings" saving={saving} onClick={handleSave} />
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════
// RECEIPT & POS TAB
// ════════════════════════════════════════════════
function ReceiptTab({ onToast }) {
  const taxRateRef      = useRef(null)
  const discountRateRef = useRef(null)
  const discountMinRef  = useRef(null)
  const footerTextRef   = useRef(null)

  const [showLogo,     setShowLogo]     = useState(true)
  const [autoPrint,    setAutoPrint]    = useState(false)
  const [showTax,      setShowTax]      = useState(true)
  const [showDiscount, setShowDiscount] = useState(true)
  const [saving,       setSaving]       = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      onToast('POS settings saved', 'success')
    } catch {
      onToast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg " +
                     "text-sm focus:outline-none focus:border-blue-400"

  return (
    <Section
      title="Receipt & POS"
      subtitle="Configure tax, discount and receipt printing"
      icon={<IconReceipt size={16} />}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Tax rate (%)" hint="Applied on every sale">
            <div className="relative">
              <input ref={taxRateRef} type="number" min="0" step="0.1"
                     defaultValue="5" className={inputClass} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2
                               text-gray-400 text-xs">%</span>
            </div>
          </Field>
          <Field label="Discount rate (%)" hint="Auto-applied when min met">
            <div className="relative">
              <input ref={discountRateRef} type="number" min="0" step="0.1"
                     defaultValue="3" className={inputClass} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2
                               text-gray-400 text-xs">%</span>
            </div>
          </Field>
          <Field label="Discount minimum" hint="Min subtotal for discount">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2
                               text-gray-400 text-xs">$</span>
              <input ref={discountMinRef} type="number" min="0"
                     defaultValue="100"
                     className={inputClass + " pl-6"} />
            </div>
          </Field>
        </div>

        <Field label="Receipt footer text">
          <textarea
            ref={footerTextRef}
            defaultValue="Thank you for your business! Visit us again."
            rows={2}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                       text-sm focus:outline-none focus:border-blue-400 resize-none"
          />
        </Field>

        <div className="border border-gray-100 rounded-xl p-4 space-y-0">
          <Toggle checked={showLogo}     onChange={setShowLogo}
                  label="Show store logo on receipt"
                  sub="Displays your store name at the top" />
          <Toggle checked={showTax}      onChange={setShowTax}
                  label="Show tax breakdown"
                  sub="Show tax line item on receipt" />
          <Toggle checked={showDiscount} onChange={setShowDiscount}
                  label="Show discount line"
                  sub="Display discount when applied" />
          <Toggle checked={autoPrint}    onChange={setAutoPrint}
                  label="Auto-print receipt"
                  sub="Automatically print after completing a sale" />
        </div>

        <SaveButton label="Save POS settings" saving={saving} onClick={handleSave} />
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════
// NOTIFICATIONS TAB
// ════════════════════════════════════════════════
function NotifTab({ onToast }) {
  const thresholdRef = useRef(null)
  const [lowStock,     setLowStock]     = useState(true)
  const [outOfStock,   setOutOfStock]   = useState(true)
  const [newOrder,     setNewOrder]     = useState(true)
  const [dailyReport,  setDailyReport]  = useState(false)
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [emailNotif,   setEmailNotif]   = useState(true)
  const [smsNotif,     setSmsNotif]     = useState(false)
  const [saving,       setSaving]       = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      onToast('Notification settings saved', 'success')
    } catch {
      onToast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section
      title="Notifications"
      subtitle="Control alerts and report emails"
      icon={<IconBell size={16} />}
    >
      <div className="space-y-5">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">Stock alerts</p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle checked={lowStock}   onChange={setLowStock}
                    label="Low stock alert"
                    sub="Alert when part drops below minimum" />
            <Toggle checked={outOfStock} onChange={setOutOfStock}
                    label="Out of stock alert"
                    sub="Alert when a part reaches zero" />
          </div>
          <div className="mt-3">
            <Field label="Default low stock threshold"
                   hint="Alert when any part drops below this quantity">
              <input ref={thresholdRef} type="number" min="1"
                     defaultValue="10"
                     className="w-32 px-3 py-2.5 border border-gray-200
                                rounded-lg text-sm focus:outline-none
                                focus:border-blue-400" />
            </Field>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">Sales alerts</p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle checked={newOrder}     onChange={setNewOrder}
                    label="New order notification"
                    sub="Alert on every completed sale" />
            <Toggle checked={dailyReport}  onChange={setDailyReport}
                    label="Daily sales report"
                    sub="Summary email at end of day" />
            <Toggle checked={weeklyReport} onChange={setWeeklyReport}
                    label="Weekly summary report"
                    sub="Every Monday morning" />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">Delivery method</p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle checked={emailNotif} onChange={setEmailNotif}
                    label="Email notifications"
                    sub="Send alerts to your registered email" />
            <Toggle checked={smsNotif}   onChange={setSmsNotif}
                    label="SMS notifications"
                    sub="Send alerts via SMS" />
          </div>
        </div>

        <SaveButton label="Save notification settings"
                    saving={saving} onClick={handleSave} />
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════
// APPEARANCE TAB
// ════════════════════════════════════════════════
function AppearanceTab({ onToast }) {
  const [theme,    setTheme]    = useState('light')
  const [density,  setDensity]  = useState('comfortable')
  const [fontSize, setFontSize] = useState('medium')
  const [accent,   setAccent]   = useState('#0f172a')
  const [saving,   setSaving]   = useState(false)

  const accents = ['#0f172a','#3b82f6','#22c55e','#a855f7','#ef4444','#f59e0b']

  async function handleSave() {
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      onToast('Appearance saved', 'success')
    } catch {
      onToast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section
      title="Appearance"
      subtitle="Customize how PartsPro looks"
      icon={<IconPalette size={16} />}
    >
      <div className="space-y-6">
        {/* Theme */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase
                        tracking-wider mb-3">Theme</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'light', label: 'Light', icon: <IconSun size={18} />,  desc: 'Clean white interface' },
              { key: 'dark',  label: 'Dark',  icon: <IconMoon size={18} />, desc: 'Easy on the eyes'      },
            ].map(t => (
              <button key={t.key} type="button" onClick={() => setTheme(t.key)}
                      className={`flex items-center gap-3 p-4 rounded-xl
                                  border-2 text-left transition-all
                        ${theme === t.key
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-gray-200 hover:border-gray-300'}`}>
                <span className={theme === t.key ? 'text-slate-900' : 'text-gray-400'}>
                  {t.icon}
                </span>
                <div>
                  <p className={`text-sm font-medium
                    ${theme === t.key ? 'text-slate-900' : 'text-gray-600'}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-gray-400">{t.desc}</p>
                </div>
                {theme === t.key && (
                  <IconCheck size={14} className="text-slate-900 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase
                        tracking-wider mb-3">Accent color</p>
          <div className="flex gap-3">
            {accents.map(color => (
              <button key={color} type="button" onClick={() => setAccent(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all
                        ${accent === color
                          ? 'border-gray-400 scale-110'
                          : 'border-transparent hover:scale-105'}`}
                      style={{ background: color }} />
            ))}
          </div>
        </div>

        {/* Density */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase
                        tracking-wider mb-3">Table density</p>
          <div className="flex gap-2">
            {['compact', 'comfortable', 'spacious'].map(d => (
              <button key={d} type="button" onClick={() => setDensity(d)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs
                                  font-medium transition-all capitalize
                        ${density === d
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase
                        tracking-wider mb-3">Font size</p>
          <div className="flex gap-2">
            {['small', 'medium', 'large'].map(f => (
              <button key={f} type="button" onClick={() => setFontSize(f)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs
                                  font-medium transition-all capitalize
                        ${fontSize === f
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <SaveButton label="Save appearance" saving={saving} onClick={handleSave} />
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════
// SECURITY TAB
// ════════════════════════════════════════════════
function SecurityTab({ onToast }) {
  const currentRef = useRef(null)
  const newPassRef = useRef(null)
  const confirmRef = useRef(null)

  const [showPw, setShowPw]   = useState({ current: false, new: false, confirm: false })
  const [twoFa,  setTwoFa]    = useState(false)
  const [alerts, setAlerts]   = useState(true)
  const [saving, setSaving]   = useState(false)
  const [errors, setErrors]   = useState({})

  function toggleShow(field) {
    setShowPw(p => ({ ...p, [field]: !p[field] }))
  }

  async function handleSave() {
  const current = currentRef.current?.value || ''
  const newPass = newPassRef.current?.value || ''
  const confirm = confirmRef.current?.value || ''

  const e = {}
  if (!current)            e.current = 'Enter your current password'
  if (newPass.length < 8)  e.newPass = 'Minimum 8 characters'
  if (newPass !== confirm)  e.confirm = 'Passwords do not match'
  if (Object.keys(e).length) { setErrors(e); return }

  setSaving(true)
  try {
    // ── Call real API ───────────────────────────
    await profileApi.changePassword({
      currentPassword: current,
      newPassword:     newPass,
      confirmPassword: confirm,
    })

    // Clear fields
    if (currentRef.current) currentRef.current.value = ''
    if (newPassRef.current)  newPassRef.current.value  = ''
    if (confirmRef.current)  confirmRef.current.value  = ''
    setErrors({})

    onToast('Password changed. Please log in again.', 'success')

    // Force re-login after password change
    setTimeout(() => {
      clearSession()
      window.location.href = '/login'
    }, 2000)

  } catch (err) {
    onToast(err.message || 'Failed to change password', 'error')
  } finally {
    setSaving(false)
  }
}

  function PwField({ label, fieldKey, refObj }) {
    return (
      <Field label={label} error={errors[fieldKey]}>
        <div className="relative">
          <input
            ref={refObj}
            type={showPw[fieldKey] ? 'text' : 'password'}
            placeholder="••••••••"
            onChange={() => setErrors(p => ({ ...p, [fieldKey]: null }))}
            className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm
                        focus:outline-none transition-colors
                        ${errors[fieldKey]
                          ? 'border-red-300 focus:border-red-400'
                          : 'border-gray-200 focus:border-blue-400'}`}
          />
          <button
            type="button"
            onClick={() => toggleShow(fieldKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-gray-400 hover:text-gray-600"
          >
            {showPw[fieldKey]
              ? <IconEyeOff size={15} />
              : <IconEye size={15} />}
          </button>
        </div>
      </Field>
    )
  }

  return (
    <Section
      title="Security"
      subtitle="Password and account security settings"
      icon={<IconShield size={16} />}
    >
      <div className="space-y-6">
        {/* Change password */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-4">Change password</p>
          <div className="space-y-4">
            <PwField label="Current password" fieldKey="current" refObj={currentRef} />
            <PwField label="New password"     fieldKey="newPass" refObj={newPassRef} />
            <PwField label="Confirm new password" fieldKey="confirm" refObj={confirmRef} />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl
                            text-sm font-medium transition-colors
                            ${saving
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-slate-900 text-white hover:bg-slate-700'}`}
              >
                {saving
                  ? <><Spinner /> Saving…</>
                  : <><IconShield size={15} /> Update password</>}
              </button>
            </div>
          </div>
        </div>

        {/* Security options */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">Security options</p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle checked={twoFa}  onChange={setTwoFa}
                    label="Two-factor authentication"
                    sub="Add an extra layer of security" />
            <Toggle checked={alerts} onChange={setAlerts}
                    label="Active session alerts"
                    sub="Get notified when someone logs in" />
          </div>
        </div>

        {/* Danger zone */}
        <div className="border border-red-100 rounded-xl p-4">
          <p className="text-xs font-medium text-red-400 uppercase
                        tracking-wider mb-3">Danger zone</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800">Sign out of all devices</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Logs out all active sessions
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 border
                         border-red-200 rounded-lg text-xs text-red-500
                         hover:bg-red-50 transition-colors"
            >
              <IconLogout size={13} /> Sign out all
            </button>
          </div>
        </div>
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════
// DATA & BACKUP TAB
// ════════════════════════════════════════════════
function DataTab({ onToast }) {
  const [autoBackup,    setAutoBackup]    = useState(true)
  const [backupFreq,    setBackupFreq]    = useState('Daily')
  const [confirmReset,  setConfirmReset]  = useState(false)
  const [saving,        setSaving]        = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      onToast('Backup settings saved', 'success')
    } catch {
      onToast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section
      title="Data & Backup"
      subtitle="Export, backup and reset your data"
      icon={<IconDatabase size={16} />}
    >
      <div className="space-y-6">
        {/* Export buttons */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">Export data</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Export inventory',  desc: 'All parts as CSV'     },
              { label: 'Export orders',     desc: 'All orders as CSV'    },
              { label: 'Export customers',  desc: 'Customer list as CSV' },
              { label: 'Export suppliers',  desc: 'Supplier list as CSV' },
            ].map(ex => (
              <button key={ex.label} type="button"
                      className="flex items-center gap-2.5 p-3 border
                                 border-gray-200 rounded-xl text-left
                                 hover:border-gray-300 hover:bg-gray-50
                                 transition-colors">
                <IconDatabase size={15} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-800">{ex.label}</p>
                  <p className="text-[10px] text-gray-400">{ex.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Auto backup */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">Auto backup</p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <Toggle checked={autoBackup} onChange={setAutoBackup}
                    label="Enable automatic backup"
                    sub="Automatically back up your data to cloud storage" />
            {autoBackup && (
              <Field label="Backup frequency">
                <select
                  value={backupFreq}
                  onChange={e => setBackupFreq(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200
                             rounded-lg text-sm focus:outline-none
                             focus:border-blue-400 bg-white appearance-none"
                >
                  {['Daily','Weekly','Monthly'].map(f => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {/* Last backup info */}
          <div className="mt-3 flex justify-between items-center p-3
                          bg-gray-50 border border-gray-100 rounded-xl">
            <div>
              <p className="text-xs font-medium text-gray-700">Last backup</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {new Date().toLocaleDateString()} at 03:00 AM
              </p>
            </div>
            <button type="button"
                    onClick={() => onToast('Backup started', 'success')}
                    className="flex items-center gap-1.5 px-3 py-2 border
                               border-gray-200 rounded-lg text-xs text-gray-600
                               hover:border-gray-300 bg-white transition-colors">
              <IconDatabase size={12} /> Backup now
            </button>
          </div>
        </div>

        <SaveButton label="Save backup settings" saving={saving} onClick={handleSave} />

        {/* Danger zone */}
        <div className="border border-red-100 rounded-xl p-4">
          <p className="text-xs font-medium text-red-400 uppercase
                        tracking-wider mb-3">Danger zone</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800">Reset all data</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Permanently delete all inventory, orders and customer data
              </p>
            </div>
            {!confirmReset ? (
              <button type="button" onClick={() => setConfirmReset(true)}
                      className="flex items-center gap-1.5 px-3 py-2 border
                                 border-red-200 rounded-lg text-xs text-red-500
                                 hover:bg-red-50 transition-colors">
                <IconTrash size={13} /> Reset data
              </button>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmReset(false)}
                        className="px-3 py-2 border border-gray-200 rounded-lg
                                   text-xs text-gray-600 hover:border-gray-300">
                  Cancel
                </button>
                <button type="button"
                        onClick={() => {
                          setConfirmReset(false)
                          onToast('Reset cancelled — not implemented', 'error')
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg
                                   text-xs font-medium hover:bg-red-600">
                  Yes, reset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ════════════════════════════════════════════════
const NAV = [
  { key: 'profile',    label: 'Profile',       icon: <IconUser size={15} />          },
  { key: 'store',      label: 'Store',          icon: <IconBuildingStore size={15} /> },
  { key: 'receipt',    label: 'Receipt & POS',  icon: <IconReceipt size={15} />       },
  { key: 'notif',      label: 'Notifications',  icon: <IconBell size={15} />          },
  { key: 'appearance', label: 'Appearance',     icon: <IconPalette size={15} />       },
  { key: 'security',   label: 'Security',       icon: <IconShield size={15} />        },
  { key: 'data',       label: 'Data & Backup',  icon: <IconDatabase size={15} />      },
]

export default function Settings() {
  const navigate    = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [toast,     setToast]     = useState(null)

  function handleToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function handleLogout() {
    clearSession()
    navigate('/login')
  }

  const tabProps = { onToast: handleToast }

  const TAB_CONTENT = {
    profile:    <ProfileTab    {...tabProps} />,
    store:      <StoreTab      {...tabProps} />,
    receipt:    <ReceiptTab    {...tabProps} />,
    notif:      <NotifTab      {...tabProps} />,
    appearance: <AppearanceTab {...tabProps} />,
    security:   <SecurityTab   {...tabProps} />,
    data:       <DataTab       {...tabProps} />,
  }

  return (
    <div className="p-4 md:p-6">

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-medium text-gray-900">Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Manage your account, store and system preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-5">

        {/* Sidebar Nav */}
        <div className="md:w-52 flex-shrink-0">
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {NAV.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-2.5 px-4 py-3
                            text-left text-sm transition-colors
                            border-b border-gray-50 last:border-0
                  ${activeTab === item.key
                    ? 'bg-slate-900 text-white'
                    : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className={activeTab === item.key
                  ? 'text-white' : 'text-gray-400'}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}

            {/* Logout */}
            <div className="border-t border-gray-100 p-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-3
                           rounded-xl text-sm text-red-500
                           hover:bg-red-50 transition-colors"
              >
                <IconLogout size={15} /> Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {TAB_CONTENT[activeTab]}
        </div>
      </div>
    </div>
  )
}
