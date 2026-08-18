// ================================================
// src/pages/Settings.jsx  — Profile tab API connected
// ================================================
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
/*import {
  IconUser, IconBuildingStore, IconBell, IconShield,
  IconPalette, IconReceipt, IconDatabase, IconDeviceFloppy,
  IconCheck, IconEye, IconEyeOff, IconUpload, IconTrash,
  IconAlertTriangle, IconMoon, IconSun, IconLogout,
  IconX, IconRefresh,IconPackage
} from '@tabler/icons-react'*/
import {
  IconUser,
  IconBuildingStore,
  IconBell,
  IconShield,
  IconPalette,
  IconReceipt,
  IconDatabase,
  IconDeviceFloppy,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconUpload,
  IconTrash,
  IconAlertTriangle,
  IconMoon,
  IconSun,
  IconLogout,
  IconX,
  IconPackage,
  IconShoppingCart,
  IconTruck,
  IconDownload,
  IconRefresh,
} from '@tabler/icons-react'

import { getUser, clearSession } from '../services/api'
import { profileApi } from '../services/api'
import { storeApi } from '../services/api'
import { receiptApi } from '../services/api'
import { notifApi } from '../services/api'
import { appearanceApi } from '../services/api'
import { exportApi } from '../services/api'



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
 
    // ── Remove from localStorage too ─────────────
    const currentStored = JSON.parse(localStorage.getItem('pp_user') || '{}')
    localStorage.setItem('pp_user', JSON.stringify({
      ...currentStored,
      profileImage: null,
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
 
  const e = {}
  if (!firstName) e.firstName = 'First name is required'
  if (!email)     e.email     = 'Email is required'
  if (Object.keys(e).length) { setErrors(e); return }
 
  setSaving(true)
  try {
    // ── Step 1: Upload image if user picked one ──
    let finalImageUrl = profileData?.profileImage || null
 
    if (pendingImage) {
      try {
        const imgRes = await profileApi.uploadImage({
          imageBase64: pendingImage.base64,
          mimeType:    pendingImage.mimeType,
        })
        // imgRes = { message: "...", profileImage: "data:image/jpeg;base64,..." }
        finalImageUrl = imgRes.profileImage
        setPendingImage(null)
        setImagePreview(finalImageUrl)
      } catch (imgErr) {
        onToast('Image upload failed: ' + imgErr.message, 'error')
        setSaving(false)
        return
      }
    }
 
    // ── Step 2: Save profile text ────────────────
    const profileRes = await profileApi.updateProfile({
      fullName: `${firstName} ${lastName}`.trim(),
      email,
      phone: phone || null,
    })
    // profileRes = { message: "...", profile: { id, fullName, email, role, ... } }
 
    const updatedProfile = profileRes.profile
 
    // ── Step 3: Update local state ───────────────
    setProfileData({ ...updatedProfile, profileImage: finalImageUrl })
 
    // ── Step 4: CRITICAL — save to localStorage ──
    // Must include profileImage or Layout won't show it
    const currentStored = JSON.parse(localStorage.getItem('pp_user') || '{}')
    const merged = {
      ...currentStored,
      fullName:     updatedProfile.fullName,
      email:        updatedProfile.email,
      role:         updatedProfile.role,
      profileImage: finalImageUrl,   // ← this is what Layout reads
    }
    localStorage.setItem('pp_user', JSON.stringify(merged))
 
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
  // ── Refs for all text inputs ──────────────────
  const nameRef    = useRef(null)
  const addressRef = useRef(null)
  const phoneRef   = useRef(null)
  const emailRef   = useRef(null)
  const taxIdRef   = useRef(null)
 
  // ── Dropdowns use state (no focus loss risk) ──
  const [currency, setCurrency] = useState('USD')
  const [timezone, setTimezone] = useState('Asia/Colombo')
  const [language, setLanguage] = useState('English')
 
  // ── Loading / saving / error state ───────────
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})
 
  // ── Load from API on mount ────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await storeApi.get()
        // Fill dropdown states
        setCurrency(data.currency || 'USD')
        setTimezone(data.timezone || 'Asia/Colombo')
        setLanguage(data.language || 'English')
 
        // Fill text inputs via refs (after mount)
        setTimeout(() => {
          if (nameRef.current)    nameRef.current.value    = data.storeName || ''
          if (addressRef.current) addressRef.current.value = data.address   || ''
          if (phoneRef.current)   phoneRef.current.value   = data.phone     || ''
          if (emailRef.current)   emailRef.current.value   = data.email     || ''
          if (taxIdRef.current)   taxIdRef.current.value   = data.taxId     || ''
        }, 0)
      } catch (err) {
        onToast('Could not load store settings: ' + err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
 
  function clearError(field) {
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }
 
  // ── Save to API ───────────────────────────────
  async function handleSave() {
    const storeName = nameRef.current?.value?.trim()    || ''
    const address   = addressRef.current?.value?.trim() || ''
    const phone     = phoneRef.current?.value?.trim()   || ''
    const email     = emailRef.current?.value?.trim()   || ''
    const taxId     = taxIdRef.current?.value?.trim()   || ''
 
    // Validate
    const e = {}
    if (!storeName) e.storeName = 'Store name is required'
    if (Object.keys(e).length) { setErrors(e); return }
 
    setSaving(true)
    try {
      await storeApi.update({
        storeName,
        address,
        phone,
        email:    email  || null,
        taxId:    taxId  || null,
        currency,
        timezone,
        language,
      })
      onToast('Store settings saved successfully', 'success')
    } catch (err) {
      onToast(err.message || 'Failed to save store settings', 'error')
    } finally {
      setSaving(false)
    }
  }
 
  // ── Shared input classes ──────────────────────
  const iClass = (field) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none
     transition-colors ${errors[field]
       ? 'border-red-300 focus:border-red-400'
       : 'border-gray-200 focus:border-blue-400'}`
 
  const sClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg " +
                 "text-sm focus:outline-none focus:border-blue-400 " +
                 "bg-white appearance-none"
 
  if (loading) return <PageLoader />
 
  return (
    <Section
      title="Store settings"
      subtitle="Business info shown on receipts and reports"
      icon={<IconBuildingStore size={16} />}
    >
      <div className="space-y-4">
 
        {/* Store name */}
        <Field label="Store name" required error={errors.storeName}>
          <input
            ref={nameRef}
            placeholder="e.g. PartsPro Auto Spares"
            onChange={() => clearError('storeName')}
            className={iClass('storeName')}
          />
        </Field>
 
        {/* Address */}
        <Field label="Address">
          <input
            ref={addressRef}
            placeholder="Street, City"
            className={iClass('')}
          />
        </Field>
 
        {/* Phone + Email */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input
              ref={phoneRef}
              placeholder="+94 11 234 5678"
              className={iClass('')}
            />
          </Field>
          <Field label="Email">
            <input
              ref={emailRef}
              type="email"
              placeholder="info@store.com"
              className={iClass('')}
            />
          </Field>
        </div>
 
        {/* Tax ID + Currency */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tax / VAT ID">
            <input
              ref={taxIdRef}
              placeholder="VAT-XXXXXXXX"
              className={iClass('')}
            />
          </Field>
          <Field label="Currency">
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className={sClass}
            >
              {['USD', 'LKR', 'EUR', 'GBP', 'AUD', 'INR'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
 
        {/* Timezone + Language */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Timezone">
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className={sClass}
            >
              {[
                'Asia/Colombo', 'Asia/Kolkata', 'Asia/Singapore',
                'UTC', 'America/New_York', 'Europe/London'
              ].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Language">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className={sClass}
            >
              {['English', 'Sinhala', 'Tamil'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
 
        {/* Last updated info */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50
                        border border-gray-100 rounded-lg">
          <IconBuildingStore size={13} className="text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-400">
            Changes will appear on all receipts and reports immediately after saving.
          </p>
        </div>
 
        <SaveButton
          label="Save store settings"
          saving={saving}
          onClick={handleSave}
        />
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════
// RECEIPT & POS TAB
// ════════════════════════════════════════════════
function ReceiptTab({ onToast }) {
  // ── Refs for numeric + text inputs ───────────
  const taxRateRef      = useRef(null)
  const discountRateRef = useRef(null)
  const discountMinRef  = useRef(null)
  const footerRef       = useRef(null)
 
  // ── Toggle state ──────────────────────────────
  const [showLogo,     setShowLogo]     = useState(true)
  const [showTax,      setShowTax]      = useState(true)
  const [showDiscount, setShowDiscount] = useState(true)
  const [autoPrint,    setAutoPrint]    = useState(false)
 
  // ── Page state ────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})
 
  // ── Live margin preview ───────────────────────
  const [previewTax,  setPreviewTax]  = useState('5.00')
  const [previewDisc, setPreviewDisc] = useState('3.00')
  const [previewMin,  setPreviewMin]  = useState('100.00')
 
  // ── Load from API on mount ────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await receiptApi.get()
 
        // Set toggle states
        setShowLogo(data.showLogo)
        setShowTax(data.showTax)
        setShowDiscount(data.showDiscount)
        setAutoPrint(data.autoPrint)
 
        // Set preview values
        setPreviewTax(data.taxRate?.toFixed(2)         || '5.00')
        setPreviewDisc(data.discountRate?.toFixed(2)   || '3.00')
        setPreviewMin(data.discountMinimum?.toFixed(2) || '100.00')
 
        // Fill inputs via refs
        setTimeout(() => {
          if (taxRateRef.current)      taxRateRef.current.value      = data.taxRate         ?? 5
          if (discountRateRef.current) discountRateRef.current.value = data.discountRate    ?? 3
          if (discountMinRef.current)  discountMinRef.current.value  = data.discountMinimum ?? 100
          if (footerRef.current)       footerRef.current.value       =
            data.footerText ?? 'Thank you for your business! Visit us again.'
        }, 0)
 
      } catch (err) {
        onToast('Could not load settings: ' + err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
 
  function clearError(field) {
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }
 
  // ── Save to API ───────────────────────────────
  async function handleSave() {
    const taxRate         = parseFloat(taxRateRef.current?.value)      || 0
    const discountRate    = parseFloat(discountRateRef.current?.value) || 0
    const discountMinimum = parseFloat(discountMinRef.current?.value)  || 0
    const footerText      = footerRef.current?.value?.trim()           || ''
 
    // Validate
    const e = {}
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100)
      e.taxRate = 'Tax rate must be between 0 and 100'
    if (isNaN(discountRate) || discountRate < 0 || discountRate > 100)
      e.discountRate = 'Discount rate must be between 0 and 100'
    if (isNaN(discountMinimum) || discountMinimum < 0)
      e.discountMinimum = 'Minimum must be 0 or more'
    if (Object.keys(e).length) { setErrors(e); return }
 
    setSaving(true)
    try {
      await receiptApi.update({
        taxRate,
        discountRate,
        discountMinimum,
        footerText,
        showLogo,
        showTax,
        showDiscount,
        autoPrint,
      })
 
      // Update previews
      setPreviewTax(taxRate.toFixed(2))
      setPreviewDisc(discountRate.toFixed(2))
      setPreviewMin(discountMinimum.toFixed(2))
 
      onToast('Receipt & POS settings saved successfully', 'success')
    } catch (err) {
      onToast(err.message || 'Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }
 
  // ── Input class ───────────────────────────────
  const iClass = (field) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none
     transition-colors ${errors[field]
       ? 'border-red-300 focus:border-red-400'
       : 'border-gray-200 focus:border-blue-400'}`
 
  if (loading) return <PageLoader />
 
  return (
    <Section
      title="Receipt & POS"
      subtitle="Configure tax, discount and receipt printing"
      icon={<IconReceipt size={16} />}
    >
      <div className="space-y-6">
 
        {/* ── Tax + Discount rates ────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Tax & discount
          </p>
          <div className="grid grid-cols-3 gap-4">
 
            {/* Tax rate */}
            <Field label="Tax rate (%)"
                   hint="Applied on every sale"
                   error={errors.taxRate}>
              <div className="relative">
                <input
                  ref={taxRateRef}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  onChange={e => {
                    setPreviewTax(parseFloat(e.target.value || 0).toFixed(2))
                    clearError('taxRate')
                  }}
                  className={iClass('taxRate') + ' pr-8'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-gray-400 text-xs pointer-events-none">%</span>
              </div>
            </Field>
 
            {/* Discount rate */}
            <Field label="Discount rate (%)"
                   hint="Auto-applied when min met"
                   error={errors.discountRate}>
              <div className="relative">
                <input
                  ref={discountRateRef}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  onChange={e => {
                    setPreviewDisc(parseFloat(e.target.value || 0).toFixed(2))
                    clearError('discountRate')
                  }}
                  className={iClass('discountRate') + ' pr-8'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-gray-400 text-xs pointer-events-none">%</span>
              </div>
            </Field>
 
            {/* Discount minimum */}
            <Field label="Discount minimum"
                   hint="Min subtotal to trigger discount"
                   error={errors.discountMinimum}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2
                                 text-gray-400 text-xs pointer-events-none">$</span>
                <input
                  ref={discountMinRef}
                  type="number"
                  min="0"
                  step="1"
                  onChange={e => {
                    setPreviewMin(parseFloat(e.target.value || 0).toFixed(2))
                    clearError('discountMinimum')
                  }}
                  className={iClass('discountMinimum') + ' pl-6'}
                />
              </div>
            </Field>
          </div>
 
          {/* Live preview box */}
          <div className="mt-3 p-4 bg-slate-900 rounded-xl">
            <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider">
              Live preview — sample $200 sale
            </p>
            {(() => {
              const subtotal  = 200
              const tax       = (subtotal * parseFloat(previewTax)  / 100)
              const discount  = subtotal >= parseFloat(previewMin)
                ? (subtotal * parseFloat(previewDisc) / 100) : 0
              const total     = subtotal + tax - discount
              return (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Tax ({previewTax}%)</span>
                    <span>+${tax.toFixed(2)}</span>
                  </div>
                  {discount > 0 ? (
                    <div className="flex justify-between text-xs text-green-400">
                      <span>Discount ({previewDisc}% on orders over ${previewMin})</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Discount (order under ${previewMin})</span>
                      <span>$0.00</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium
                                  text-white border-t border-slate-700 pt-2 mt-1">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
 
        {/* ── Footer text ─────────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Receipt footer
          </p>
          <Field label="Footer message"
                 hint="Printed at the bottom of every receipt">
            <textarea
              ref={footerRef}
              rows={3}
              placeholder="Thank you for your business! Visit us again."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                         text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </Field>
        </div>
 
        {/* ── Receipt options ─────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Receipt options
          </p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle
              checked={showLogo}
              onChange={setShowLogo}
              label="Show store name on receipt"
              sub="Displays your store name at the top of each receipt"
            />
            <Toggle
              checked={showTax}
              onChange={setShowTax}
              label="Show tax line"
              sub="Shows the tax amount as a separate line on receipt"
            />
            <Toggle
              checked={showDiscount}
              onChange={setShowDiscount}
              label="Show discount line"
              sub="Displays discount applied when order qualifies"
            />
            <Toggle
              checked={autoPrint}
              onChange={setAutoPrint}
              label="Auto-print after sale"
              sub="Automatically opens print dialog after every completed POS sale"
            />
          </div>
        </div>
 
        {/* ── Info note ───────────────────────── */}
        <div className="flex items-start gap-2 px-3 py-3 bg-blue-50
                        border border-blue-100 rounded-xl">
          <IconReceipt size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-600 leading-relaxed">
            Tax rate and discount settings take effect on all new POS sales immediately.
            Existing orders are not affected.
          </p>
        </div>
 
        <SaveButton
          label="Save POS settings"
          saving={saving}
          onClick={handleSave}
        />
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════
// NOTIFICATIONS TAB
// ════════════════════════════════════════════════

function NotifTab({ onToast }) {
  // ── Threshold ref (uncontrolled input) ────────
  const thresholdRef     = useRef(null)
  const emailRef         = useRef(null)
  const phoneRef         = useRef(null)
 
  // ── Toggle states ─────────────────────────────
  const [lowStock,     setLowStock]     = useState(true)
  const [outOfStock,   setOutOfStock]   = useState(true)
  const [newOrder,     setNewOrder]     = useState(true)
  const [dailyReport,  setDailyReport]  = useState(false)
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [emailNotif,   setEmailNotif]   = useState(true)
  const [smsNotif,     setSmsNotif]     = useState(false)
 
  // ── Page state ────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})
 
  // ── Load from API on mount ────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await notifApi.get()
 
        // Set toggle states from DB
        setLowStock(data.lowStockAlert)
        setOutOfStock(data.outOfStockAlert)
        setNewOrder(data.newOrderAlert)
        setDailyReport(data.dailyReport)
        setWeeklyReport(data.weeklyReport)
        setEmailNotif(data.emailNotifications)
        setSmsNotif(data.smsNotifications)
 
        // Fill text inputs via refs
        setTimeout(() => {
          if (thresholdRef.current) thresholdRef.current.value = data.lowStockThreshold  ?? 10
          if (emailRef.current)     emailRef.current.value     = data.notificationEmail  ?? ''
          if (phoneRef.current)     phoneRef.current.value     = data.notificationPhone  ?? ''
        }, 0)
 
      } catch (err) {
        onToast('Could not load notification settings: ' + err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
 
  function clearError(field) {
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }
 
  // ── Save to API ───────────────────────────────
  async function handleSave() {
    const threshold = parseInt(thresholdRef.current?.value) || 10
    const email     = emailRef.current?.value?.trim()       || ''
    const phone     = phoneRef.current?.value?.trim()       || ''
 
    // Validate
    const e = {}
    if (threshold < 1)     e.threshold = 'Threshold must be at least 1'
    if (emailNotif && email && !email.includes('@'))
      e.email = 'Enter a valid email address'
    if (Object.keys(e).length) { setErrors(e); return }
 
    setSaving(true)
    try {
      await notifApi.update({
        lowStockAlert:      lowStock,
        outOfStockAlert:    outOfStock,
        lowStockThreshold:  threshold,
        newOrderAlert:      newOrder,
        dailyReport,
        weeklyReport,
        emailNotifications: emailNotif,
        smsNotifications:   smsNotif,
        notificationEmail:  email  || null,
        notificationPhone:  phone  || null,
      })
      onToast('Notification settings saved successfully', 'success')
    } catch (err) {
      onToast(err.message || 'Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }
 
  const iClass = (field) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none
     transition-colors ${errors[field]
       ? 'border-red-300 focus:border-red-400'
       : 'border-gray-200 focus:border-blue-400'}`
 
  if (loading) return <PageLoader />
 
  return (
    <Section
      title="Notifications"
      subtitle="Control alerts, reports and delivery preferences"
      icon={<IconBell size={16} />}
    >
      <div className="space-y-6">
 
        {/* ── Stock alerts ────────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Stock alerts
          </p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle
              checked={lowStock}
              onChange={setLowStock}
              label="Low stock alert"
              sub="Alert when a part drops below the minimum quantity"
            />
            <Toggle
              checked={outOfStock}
              onChange={setOutOfStock}
              label="Out of stock alert"
              sub="Alert when a part reaches zero quantity"
            />
          </div>
 
          {/* Threshold input — shown when either alert is on */}
          {(lowStock || outOfStock) && (
            <div className="mt-3">
              <Field
                label="Default low stock threshold"
                hint="Alert when any part quantity drops below this number"
                error={errors.threshold}
              >
                <div className="flex items-center gap-3">
                  <input
                    ref={thresholdRef}
                    type="number"
                    min="1"
                    max="10000"
                    onChange={() => clearError('threshold')}
                    className={iClass('threshold') + ' w-36'}
                  />
                  <p className="text-xs text-gray-400">units</p>
                </div>
              </Field>
            </div>
          )}
        </div>
 
        {/* ── Sales alerts ────────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Sales alerts
          </p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle
              checked={newOrder}
              onChange={setNewOrder}
              label="New order notification"
              sub="Get notified on every completed POS sale"
            />
            <Toggle
              checked={dailyReport}
              onChange={setDailyReport}
              label="Daily sales report"
              sub="Receive a summary email at the end of each day"
            />
            <Toggle
              checked={weeklyReport}
              onChange={setWeeklyReport}
              label="Weekly summary report"
              sub="Receive a full report every Monday morning"
            />
          </div>
        </div>
 
        {/* ── Delivery method ─────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Delivery method
          </p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle
              checked={emailNotif}
              onChange={val => { setEmailNotif(val); if (!val) clearError('email') }}
              label="Email notifications"
              sub="Send all alerts and reports to an email address"
            />
            <Toggle
              checked={smsNotif}
              onChange={setSmsNotif}
              label="SMS notifications"
              sub="Send stock alerts via SMS to a phone number"
            />
          </div>
 
          {/* Email input — show when email notifications enabled */}
          {emailNotif && (
            <div className="mt-3">
              <Field
                label="Notification email"
                hint="Alerts and reports will be sent to this address"
                error={errors.email}
              >
                <input
                  ref={emailRef}
                  type="email"
                  placeholder="alerts@yourstore.com"
                  onChange={() => clearError('email')}
                  className={iClass('email')}
                />
              </Field>
            </div>
          )}
 
          {/* Phone input — show when SMS enabled */}
          {smsNotif && (
            <div className="mt-3">
              <Field
                label="SMS phone number"
                hint="Stock alerts will be sent to this number"
              >
                <input
                  ref={phoneRef}
                  type="tel"
                  placeholder="+94 77 123 4567"
                  className={iClass('')}
                />
              </Field>
            </div>
          )}
        </div>
 
        {/* ── Summary badge ────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Stock alerts',
              value: [lowStock && 'Low stock', outOfStock && 'Out of stock']
                       .filter(Boolean).join(', ') || 'None',
              color: (lowStock || outOfStock) ? 'text-green-600' : 'text-gray-400',
              bg:    (lowStock || outOfStock) ? 'bg-green-50 border-green-100'
                                              : 'bg-gray-50 border-gray-100'
            },
            {
              label: 'Sales alerts',
              value: [newOrder && 'Orders', dailyReport && 'Daily',
                      weeklyReport && 'Weekly'].filter(Boolean).join(', ') || 'None',
              color: (newOrder || dailyReport || weeklyReport)
                       ? 'text-blue-600' : 'text-gray-400',
              bg:    (newOrder || dailyReport || weeklyReport)
                       ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
            },
            {
              label: 'Via',
              value: [emailNotif && 'Email', smsNotif && 'SMS']
                       .filter(Boolean).join(' + ') || 'None',
              color: (emailNotif || smsNotif) ? 'text-purple-600' : 'text-gray-400',
              bg:    (emailNotif || smsNotif)
                       ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100'
            },
          ].map(card => (
            <div key={card.label}
                 className={`border rounded-xl p-3 text-center ${card.bg}`}>
              <p className={`text-xs font-medium truncate ${card.color}`}>
                {card.value}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
 
        {/* ── Info note ───────────────────────── */}
        <div className="flex items-start gap-2 px-3 py-3 bg-amber-50
                        border border-amber-100 rounded-xl">
          <IconBell size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Email and SMS delivery require a notification service integration
            (e.g. SendGrid, Twilio). Settings are saved — delivery activates
            once the service is connected.
          </p>
        </div>
 
        <SaveButton
          label="Save notification settings"
          saving={saving}
          onClick={handleSave}
        />
      </div>
    </Section>
  )
}


// ════════════════════════════════════════════════
// APPEARANCE TAB
// ════════════════════════════════════════════════

function AppearanceTab({ onToast }) {
  // ── State (all controlled — no text inputs here) ──
  const [theme,    setTheme]    = useState('light')
  const [accent,   setAccent]   = useState('#0f172a')
  const [density,  setDensity]  = useState('comfortable')
  const [fontSize, setFontSize] = useState('medium')
 
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
 
  const ACCENTS = [
    { color: '#0f172a', label: 'Slate'   },
    { color: '#3b82f6', label: 'Blue'    },
    { color: '#22c55e', label: 'Green'   },
    { color: '#a855f7', label: 'Purple'  },
    { color: '#ef4444', label: 'Red'     },
    { color: '#f59e0b', label: 'Amber'   },
    { color: '#ec4899', label: 'Pink'    },
    { color: '#14b8a6', label: 'Teal'    },
  ]
 
  // ── Load from API on mount ─────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await appearanceApi.get()
        setTheme(data.theme       || 'light')
        setAccent(data.accent     || '#0f172a')
        setDensity(data.density   || 'comfortable')
        setFontSize(data.fontSize || 'medium')
        setLastSaved(data.updatedAt)
      } catch (err) {
        // Use localStorage cache silently
        const cached = localStorage.getItem('pp_appearance')
        if (cached) {
          try {
            const p = JSON.parse(cached)
            setTheme(p.theme       || 'light')
            setAccent(p.accent     || '#0f172a')
            setDensity(p.density   || 'comfortable')
            setFontSize(p.fontSize || 'medium')
          } catch {}
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
 
  // ── Apply changes instantly as user picks ──────
  function applyToDOM(newTheme, newAccent, newDensity, newFontSize) {
    const root = document.documentElement
    root.setAttribute('data-theme', newTheme)
    newTheme === 'dark'
      ? root.classList.add('dark')
      : root.classList.remove('dark')
 
    root.style.setProperty('--color-accent', newAccent)
 
    const fontMap    = { small: '13px', medium: '14px', large: '15px' }
    const densityMap = { compact: '8px', comfortable: '14px', spacious: '20px' }
    root.style.setProperty('--font-size-base', fontMap[newFontSize]   || '14px')
    root.style.setProperty('--row-padding',    densityMap[newDensity] || '14px')
 
    // Cache immediately so it survives refresh
    localStorage.setItem('pp_appearance', JSON.stringify({
      theme: newTheme, accent: newAccent,
      density: newDensity, fontSize: newFontSize
    }))
  }
 
  function handleTheme(val) {
    setTheme(val)
    applyToDOM(val, accent, density, fontSize)
  }
 
  function handleAccent(val) {
    setAccent(val)
    applyToDOM(theme, val, density, fontSize)
  }
 
  function handleDensity(val) {
    setDensity(val)
    applyToDOM(theme, accent, val, fontSize)
  }
 
  function handleFontSize(val) {
    setFontSize(val)
    applyToDOM(theme, accent, density, val)
  }
 
  // ── Save to API ─────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      const res = await appearanceApi.update({
        theme,
        accent,
        density,
        fontSize,
      })
      setLastSaved(res.settings?.updatedAt || new Date().toISOString())
      onToast('Appearance saved successfully', 'success')
    } catch (err) {
      onToast(err.message || 'Failed to save appearance', 'error')
    } finally {
      setSaving(false)
    }
  }
 
  // ── Reset to defaults ──────────────────────────
  function handleReset() {
    setTheme('light')
    setAccent('#0f172a')
    setDensity('comfortable')
    setFontSize('medium')
    applyToDOM('light', '#0f172a', 'comfortable', 'medium')
    onToast('Reset to defaults — click Save to keep', 'success')
  }
 
  if (loading) return <PageLoader />
 
  return (
    <Section
      title="Appearance"
      subtitle="Customize how PartsPro looks for your account"
      icon={<IconPalette size={16} />}
    >
      <div className="space-y-6">
 
        {/* ── Theme ───────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Theme
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                key:   'light',
                label: 'Light mode',
                icon:  <IconSun size={20} />,
                desc:  'Clean white interface',
                bg:    'bg-white',
                preview: (
                  <div className="flex gap-1 mt-2">
                    <div className="w-3 h-3 rounded-sm bg-slate-900" />
                    <div className="w-3 h-3 rounded-sm bg-gray-200" />
                    <div className="w-3 h-3 rounded-sm bg-gray-100" />
                  </div>
                )
              },
              {
                key:   'dark',
                label: 'Dark mode',
                icon:  <IconMoon size={20} />,
                desc:  'Easy on the eyes',
                bg:    'bg-slate-900',
                preview: (
                  <div className="flex gap-1 mt-2">
                    <div className="w-3 h-3 rounded-sm bg-white" />
                    <div className="w-3 h-3 rounded-sm bg-slate-600" />
                    <div className="w-3 h-3 rounded-sm bg-slate-700" />
                  </div>
                )
              },
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTheme(t.key)}
                className={`relative p-4 rounded-xl border-2 text-left
                            transition-all overflow-hidden
                            ${theme === t.key
                              ? 'border-blue-400 ring-2 ring-blue-100'
                              : 'border-gray-200 hover:border-gray-300'}`}
              >
                {/* Mini UI preview */}
                <div className={`w-full h-12 rounded-lg mb-3 flex
                                 items-center justify-center ${t.bg}
                                 border border-gray-100`}>
                  <span className={theme === t.key
                    ? 'text-blue-500' : 'text-gray-400'}>
                    {t.icon}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium
                      ${theme === t.key ? 'text-gray-900' : 'text-gray-600'}`}>
                      {t.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                  </div>
                  {theme === t.key && (
                    <div className="w-5 h-5 rounded-full bg-blue-500
                                    flex items-center justify-center flex-shrink-0">
                      <IconCheck size={11} className="text-white" />
                    </div>
                  )}
                </div>
                {t.preview}
              </button>
            ))}
          </div>
        </div>
 
        {/* ── Accent Color ─────────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Accent color
          </p>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map(a => (
              <button
                key={a.color}
                type="button"
                title={a.label}
                onClick={() => handleAccent(a.color)}
                className={`relative w-9 h-9 rounded-full transition-all
                            flex items-center justify-center
                            ${accent === a.color
                              ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                              : 'hover:scale-105'}`}
                style={{ background: a.color }}
              >
                {accent === a.color && (
                  <IconCheck size={14} className="text-white" />
                )}
              </button>
            ))}
 
            {/* Custom color picker */}
            <div className="relative">
              <label
                className="w-9 h-9 rounded-full border-2 border-dashed
                           border-gray-300 flex items-center justify-center
                           cursor-pointer hover:border-gray-400 transition-colors
                           text-gray-400 hover:text-gray-600"
                title="Custom color"
              >
                <span className="text-lg leading-none">+</span>
                <input
                  type="color"
                  value={accent}
                  onChange={e => handleAccent(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>
          </div>
 
          {/* Color preview pill */}
          <div className="mt-3 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0"
                 style={{ background: accent }} />
            <span className="text-xs text-gray-500 font-mono">{accent}</span>
          </div>
        </div>
 
        {/* ── Table Density ─────────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Table density
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'compact',     label: 'Compact',     desc: 'More rows visible',      rows: 3 },
              { key: 'comfortable', label: 'Comfortable', desc: 'Balanced spacing',        rows: 2 },
              { key: 'spacious',    label: 'Spacious',    desc: 'Easier to read',          rows: 1 },
            ].map(d => (
              <button
                key={d.key}
                type="button"
                onClick={() => handleDensity(d.key)}
                className={`p-3 rounded-xl border-2 text-left transition-all
                            ${density === d.key
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'}`}
              >
                {/* Mini row preview */}
                <div className="space-y-1 mb-3">
                  {Array.from({ length: d.rows + 1 }).map((_, i) => (
                    <div key={i} className={`w-full rounded flex gap-1
                      ${density === d.key ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="h-1.5 w-4 rounded bg-gray-300" />
                      <div className="h-1.5 flex-1 rounded bg-gray-200" />
                      <div className="h-1.5 w-6 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
                <p className={`text-xs font-medium
                  ${density === d.key ? 'text-blue-700' : 'text-gray-700'}`}>
                  {d.label}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{d.desc}</p>
                {density === d.key && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px]
                                  font-medium text-blue-500">
                    <IconCheck size={10} /> Selected
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
 
        {/* ── Font Size ─────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Font size
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'small',  label: 'Small',  size: 'text-xs',  px: '13px' },
              { key: 'medium', label: 'Medium', size: 'text-sm',  px: '14px' },
              { key: 'large',  label: 'Large',  size: 'text-base',px: '15px' },
            ].map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFontSize(f.key)}
                className={`p-3 rounded-xl border-2 text-left transition-all
                            ${fontSize === f.key
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'}`}
              >
                <p className={`font-medium mb-1
                  ${f.size}
                  ${fontSize === f.key ? 'text-blue-700' : 'text-gray-700'}`}>
                  Aa
                </p>
                <p className={`text-xs font-medium
                  ${fontSize === f.key ? 'text-blue-700' : 'text-gray-700'}`}>
                  {f.label}
                </p>
                <p className="text-[10px] text-gray-400">{f.px}</p>
              </button>
            ))}
          </div>
        </div>
 
        {/* ── Last saved ──────────────────────── */}
        {lastSaved && (
          <p className="text-[10px] text-gray-400 text-right">
            Last saved: {new Date(lastSaved).toLocaleString()}
          </p>
        )}
 
        {/* ── Actions ─────────────────────────── */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 border
                       border-gray-200 rounded-lg text-xs text-gray-500
                       hover:border-gray-300 hover:text-gray-700
                       transition-colors"
          >
            <IconRefresh size={13} /> Reset to defaults
          </button>
 
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
              ? <><span className="w-4 h-4 border-2 border-white/30
                                   border-t-white rounded-full animate-spin" />
                  Saving…</>
              : <><IconDeviceFloppy size={15} /> Save appearance</>}
          </button>
        </div>
      </div>
    </Section>
  )
}


// ════════════════════════════════════════════════
// SECURITY TAB
// ════════════════════════════════════════════════

function SecurityTab({ onToast }) {
  const navigate = useNavigate()
  const currentUser = getUser()
 
  // ── Password refs ─────────────────────────────
  const currentRef = useRef(null)
  const newPassRef = useRef(null)
  const confirmRef = useRef(null)
 
  // ── Toggle state ──────────────────────────────
  const [showPw,  setShowPw]  = useState({ current: false, new: false, confirm: false })
  const [twoFa,   setTwoFa]   = useState(false)
  const [alerts,  setAlerts]  = useState(true)
 
  // ── Save state ────────────────────────────────
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})
 
  // ── Password strength ─────────────────────────
  const [strength, setStrength] = useState(null) // null | weak | fair | strong
 
  function toggleShow(field) {
    setShowPw(p => ({ ...p, [field]: !p[field] }))
  }
 
  function clearError(field) {
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }
 
  // ── Check password strength live ──────────────
  function checkStrength(val) {
    if (!val) { setStrength(null); return }
    let score = 0
    if (val.length >= 8)                    score++
    if (val.length >= 12)                   score++
    if (/[A-Z]/.test(val))                  score++
    if (/[0-9]/.test(val))                  score++
    if (/[^A-Za-z0-9]/.test(val))           score++
    if      (score <= 1) setStrength('weak')
    else if (score <= 3) setStrength('fair')
    else                 setStrength('strong')
  }
 
  // ── Change password → POST /api/auth/change-password ──
  async function handleChangePassword() {
    const current = currentRef.current?.value || ''
    const newPass = newPassRef.current?.value || ''
    const confirm = confirmRef.current?.value || ''
 
    // Validate
    const e = {}
    if (!current)            e.current = 'Enter your current password'
    if (newPass.length < 8)  e.newPass = 'Minimum 8 characters required'
    if (newPass !== confirm)  e.confirm = 'Passwords do not match'
    if (newPass && newPass === current)
                             e.newPass = 'New password must differ from current'
    if (Object.keys(e).length) { setErrors(e); return }
 
    setSaving(true)
    try {
      await profileApi.changePassword({
        currentPassword: current,
        newPassword:     newPass,
        confirmPassword: confirm,
      })
 
      // Clear all fields
      if (currentRef.current) currentRef.current.value = ''
      if (newPassRef.current)  newPassRef.current.value = ''
      if (confirmRef.current)  confirmRef.current.value = ''
      setErrors({})
      setStrength(null)
 
      onToast('Password changed! Logging you out…', 'success')
 
      // Force re-login — old token should no longer be trusted
      setTimeout(() => {
        clearSession()
        navigate('/login')
      }, 2000)
 
    } catch (err) {
      // Show specific error from backend
      const msg = err.message || 'Failed to change password'
      if (msg.toLowerCase().includes('current'))
        setErrors({ current: msg })
      else if (msg.toLowerCase().includes('new'))
        setErrors({ newPass: msg })
      else
        onToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }
 
  // ── Sign out all sessions ─────────────────────
  function handleSignOutAll() {
    if (!confirm('This will log you out of all devices. Continue?')) return
    clearSession()
    navigate('/login')
  }
 
  // ── Strength bar ──────────────────────────────
  function StrengthBar() {
    if (!strength) return null
    const config = {
      weak:   { width: 'w-1/3', color: 'bg-red-400',   label: 'Weak'   },
      fair:   { width: 'w-2/3', color: 'bg-amber-400', label: 'Fair'   },
      strong: { width: 'w-full', color: 'bg-green-500', label: 'Strong' },
    }[strength]
 
    return (
      <div className="mt-1.5">
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${config.width} ${config.color}`} />
        </div>
        <p className={`text-[10px] mt-1 font-medium
          ${strength === 'weak'   ? 'text-red-400'
          : strength === 'fair'   ? 'text-amber-500'
          : 'text-green-600'}`}>
          {config.label} password
        </p>
      </div>
    )
  }
 
  // ── Password field ────────────────────────────
  function PwField({ label, fieldKey, refObj, onChange }) {
    return (
      <Field label={label} error={errors[fieldKey]}>
        <div className="relative">
          <input
            ref={refObj}
            type={showPw[fieldKey] ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete={fieldKey === 'current' ? 'current-password' : 'new-password'}
            onChange={e => {
              clearError(fieldKey)
              if (onChange) onChange(e.target.value)
            }}
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
                       text-gray-400 hover:text-gray-600 transition-colors"
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
      subtitle="Manage your password and account security"
      icon={<IconShield size={16} />}
    >
      <div className="space-y-7">
 
        {/* ── Logged in as banner ──────────────── */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50
                        border border-green-100 rounded-lg">
          <IconShield size={14} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-green-800">
              Active session — {currentUser?.fullName || 'Unknown'}
            </p>
            <p className="text-[10px] text-green-600">
              {currentUser?.email} · Role: {currentUser?.role}
            </p>
          </div>
        </div>
 
        {/* ── Change password ──────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-4">
            Change password
          </p>
 
          <div className="space-y-4">
            <PwField
              label="Current password"
              fieldKey="current"
              refObj={currentRef}
            />
 
            <div>
              <PwField
                label="New password"
                fieldKey="newPass"
                refObj={newPassRef}
                onChange={checkStrength}
              />
              <StrengthBar />
            </div>
 
            <PwField
              label="Confirm new password"
              fieldKey="confirm"
              refObj={confirmRef}
            />
 
            {/* Password rules */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
              <p className="text-[10px] font-medium text-gray-500
                            uppercase tracking-wider mb-2">
                Password requirements
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  'Minimum 8 characters',
                  'At least one uppercase letter',
                  'At least one number',
                  'Different from current password',
                ].map(rule => (
                  <div key={rule}
                       className="flex items-center gap-1.5 text-[10px]
                                  text-gray-500">
                    <span className="w-1 h-1 rounded-full bg-gray-300
                                     flex-shrink-0" />
                    {rule}
                  </div>
                ))}
              </div>
            </div>
 
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl
                            text-sm font-medium transition-colors
                            ${saving
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-slate-900 text-white hover:bg-slate-700'}`}
              >
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white/30
                                       border-t-white rounded-full
                                       animate-spin" /> Saving…</>
                  : <><IconShield size={15} /> Update password</>}
              </button>
            </div>
          </div>
        </div>
 
        {/* ── Security preferences ─────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Security preferences
          </p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle
              checked={twoFa}
              onChange={setTwoFa}
              label="Two-factor authentication"
              sub="Add an extra layer of security on login (coming soon)"
            />
            <Toggle
              checked={alerts}
              onChange={setAlerts}
              label="Login alerts"
              sub="Get notified when someone logs into your account"
            />
          </div>
        </div>
 
        {/* ── Active session info ──────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Active sessions
          </p>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            {/* Current session row */}
            <div className="flex items-center justify-between px-4 py-3
                            border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center
                                justify-center flex-shrink-0">
                  <span className="text-green-600 text-xs font-bold">W</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    Web browser — current session
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Signed in · JWT expires in 8 hours
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-green-100 text-green-700
                               px-2 py-0.5 rounded-full font-medium">
                Active
              </span>
            </div>
 
            {/* Sign out all row */}
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-xs text-gray-700">Sign out of all devices</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Clears your token and redirects to login
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOutAll}
                className="flex items-center gap-1.5 px-3 py-2 border
                           border-red-200 rounded-lg text-xs text-red-500
                           hover:bg-red-50 transition-colors"
              >
                <IconLogout size={13} /> Sign out all
              </button>
            </div>
          </div>
        </div>
 
        {/* ── Danger zone ──────────────────────── */}
        <div className="border border-red-100 rounded-xl p-4">
          <p className="text-xs font-medium text-red-400 uppercase
                        tracking-wider mb-3">
            Danger zone
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-800">Delete my account</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Permanently remove your account — contact your admin
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToast(
                  'Account deletion must be done by an Administrator', 'error'
                )}
                className="flex items-center gap-1.5 px-3 py-2 border
                           border-red-200 rounded-lg text-xs text-red-400
                           hover:bg-red-50 transition-colors"
              >
                <IconTrash size={13} /> Delete account
              </button>
            </div>
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
  const currentUser = getUser()
  const isAdmin = currentUser?.role === 'Administrator'
 
  // ── Summary state ─────────────────────────────
  const [summary,      setSummary]      = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
 
  // ── Download loading states ───────────────────
  const [downloading, setDownloading] = useState({
    inventory: false,
    orders:    false,
    customers: false,
    suppliers: false,
    backup:    false,
  })
 
  // ── Backup settings state ─────────────────────
  const [autoBackup,   setAutoBackup]   = useState(false)
  const [backupFreq,   setBackupFreq]   = useState('Daily')
  const [lastBackup,   setLastBackup]   = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
 
  // ── Load summary on mount ─────────────────────
  useEffect(() => {
    async function load() {
      setLoadingSummary(true)
      try {
        const data = await exportApi.getSummary()
        setSummary(data)
        setLastBackup(data.exportedAt)
      } catch (err) {
        onToast('Could not load data summary: ' + err.message, 'error')
      } finally {
        setLoadingSummary(false)
      }
    }
    load()
  }, [])
 
  // ── Generic download handler ──────────────────
  async function handleDownload(type) {
    setDownloading(p => ({ ...p, [type]: true }))
    try {
      const fnMap = {
        inventory: exportApi.downloadInventory,
        orders:    exportApi.downloadOrders,
        customers: exportApi.downloadCustomers,
        suppliers: exportApi.downloadSuppliers,
        backup:    exportApi.downloadBackup,
      }
      const fileName = await fnMap[type]()
      onToast(`Downloaded ${fileName}`, 'success')
    } catch (err) {
      onToast(err.message || `Failed to download ${type}`, 'error')
    } finally {
      setDownloading(p => ({ ...p, [type]: false }))
    }
  }
 
  // ── Export card data ──────────────────────────
  const EXPORTS = [
    {
      key:   'inventory',
      label: 'Export inventory',
      desc:  'All active parts with prices and stock',
      icon:  <IconPackage size={16} className="text-blue-500" />,
      bg:    'bg-blue-50 border-blue-100',
      count: summary?.partsCount,
      unit:  'parts',
      format:'CSV',
    },
    {
      key:   'orders',
      label: 'Export orders',
      desc:  'All orders with totals and customer info',
      icon:  <IconShoppingCart size={16} className="text-green-500" />,
      bg:    'bg-green-50 border-green-100',
      count: summary?.ordersCount,
      unit:  'orders',
      format:'CSV',
    },
    {
      key:   'customers',
      label: 'Export customers',
      desc:  'Customer list with spending history',
      icon:  <IconUser size={16} className="text-purple-500" />,
      bg:    'bg-purple-50 border-purple-100',
      count: summary?.customersCount,
      unit:  'customers',
      format:'CSV',
    },
    {
      key:   'suppliers',
      label: 'Export suppliers',
      desc:  'Supplier list with contact details',
      icon:  <IconTruck size={16} className="text-amber-500" />,
      bg:    'bg-amber-50 border-amber-100',
      count: summary?.suppliersCount,
      unit:  'suppliers',
      format:'CSV',
    },
  ]
 
  return (
    <Section
      title="Data & Backup"
      subtitle="Export your data and manage backups"
      icon={<IconDatabase size={16} />}
    >
      <div className="space-y-7">
 
        {/* ── Data summary ─────────────────────── */}
        {loadingSummary ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100
                                      rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-16 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-10" />
              </div>
            ))}
          </div>
        ) : summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Parts',     value: summary.partsCount,     color: 'text-blue-600'   },
              { label: 'Orders',    value: summary.ordersCount,    color: 'text-green-600'  },
              { label: 'Customers', value: summary.customersCount, color: 'text-purple-600' },
              { label: 'Suppliers', value: summary.suppliersCount, color: 'text-amber-600'  },
            ].map(s => (
              <div key={s.label}
                   className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  {s.label}
                </p>
                <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
 
        {/* ── Export data ──────────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase
                        tracking-wider mb-3">
            Export data
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXPORTS.map(ex => (
              <div key={ex.key}
                   className={`border rounded-xl p-4 ${ex.bg}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center
                                    justify-center shadow-sm">
                      {ex.icon}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">
                        {ex.label}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {ex.desc}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-medium bg-white text-gray-500
                                   px-1.5 py-0.5 rounded-full border border-gray-200">
                    {ex.format}
                  </span>
                </div>
 
                <div className="flex items-center justify-between">
                  {ex.count !== undefined ? (
                    <p className="text-xs text-gray-500">
                      {ex.count.toLocaleString()} {ex.unit}
                    </p>
                  ) : (
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                  )}
 
                  <button
                    type="button"
                    onClick={() => handleDownload(ex.key)}
                    disabled={downloading[ex.key]}
                    className={`flex items-center gap-1.5 px-3 py-1.5
                                rounded-lg text-xs font-medium transition-all
                                border border-gray-200 bg-white
                                ${downloading[ex.key]
                                  ? 'opacity-50 cursor-not-allowed text-gray-400'
                                  : 'text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    {downloading[ex.key] ? (
                      <><span className="w-3 h-3 border border-gray-300
                                         border-t-gray-600 rounded-full
                                         animate-spin" /> Downloading…</>
                    ) : (
                      <><IconDownload size={12} /> Download</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
 
        {/* ── Full backup (Admin only) ─────────── */}
        {isAdmin && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wider mb-3">
              Full backup
            </p>
            <div className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl
                                  flex items-center justify-center flex-shrink-0">
                    <IconDatabase size={18} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Full JSON backup
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      All inventory, orders, customers and suppliers in one file
                    </p>
                    {lastBackup && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        Last export: {new Date(lastBackup).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload('backup')}
                  disabled={downloading.backup}
                  className={`flex items-center gap-1.5 px-4 py-2.5
                              rounded-xl text-xs font-medium transition-all
                              ${downloading.backup
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-slate-700'}`}
                >
                  {downloading.backup ? (
                    <><span className="w-3 h-3 border border-white/30
                                       border-t-white rounded-full animate-spin" />
                      Downloading…</>
                  ) : (
                    <><IconDatabase size={13} /> Backup now</>
                  )}
                </button>
              </div>
 
              {/* Auto backup settings */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Toggle
                  checked={autoBackup}
                  onChange={setAutoBackup}
                  label="Automatic backups"
                  sub="Schedule regular JSON backups (requires server-side cron setup)"
                />
                {autoBackup && (
                  <div className="mt-3 pl-1">
                    <Field label="Backup frequency">
                      <select
                        value={backupFreq}
                        onChange={e => setBackupFreq(e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-200
                                   rounded-lg text-sm focus:outline-none
                                   focus:border-blue-400 bg-white appearance-none"
                      >
                        {['Daily', 'Weekly', 'Monthly'].map(f => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
 
        {/* ── Info note ───────────────────────── */}
        <div className="flex items-start gap-2 px-3 py-3 bg-blue-50
                        border border-blue-100 rounded-xl">
          <IconDatabase size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-600 leading-relaxed">
            CSV files open in Excel, Google Sheets, or any spreadsheet app.
            The JSON backup can be used to restore data if needed.
            {!isAdmin && (
              <span className="block mt-1 text-blue-500">
                Full JSON backup is available to Administrators only.
              </span>
            )}
          </p>
        </div>
 
        {/* ── Danger zone (Admin only) ─────────── */}
        {isAdmin && (
          <div className="border border-red-100 rounded-xl p-4">
            <p className="text-xs font-medium text-red-400 uppercase
                          tracking-wider mb-3">
              Danger zone
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-800">Reset all data</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Permanently delete all inventory, orders and customer data.
                  Download a backup first!
                </p>
              </div>
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="flex items-center gap-1.5 px-3 py-2 border
                             border-red-200 rounded-lg text-xs text-red-500
                             hover:bg-red-50 transition-colors"
                >
                  <IconTrash size={13} /> Reset data
                </button>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <p className="text-[10px] text-red-500 font-medium">
                    Are you absolutely sure?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-2 border border-gray-200 rounded-lg
                                 text-xs text-gray-600 hover:border-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmReset(false)
                        onToast('Reset requires direct database access — contact your DBA', 'error')
                      }}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg
                                 text-xs font-medium hover:bg-red-600"
                    >
                      Yes, reset everything
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
