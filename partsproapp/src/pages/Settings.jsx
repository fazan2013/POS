import { useState } from 'react'
import {
  IconUser, IconBuildingStore, IconBell, IconShield,
  IconPalette, IconReceipt, IconDatabase, IconDeviceFloppy,
  IconCheck, IconEye, IconEyeOff, IconUpload, IconTrash,
  IconAlertTriangle, IconMoon, IconSun, IconLanguage,
  IconCurrencyDollar, IconPrinter, IconLogout, IconX
} from '@tabler/icons-react'

// ── Toast ─────────────────────────────────────────
function Toast({ msg, onClose }) {
  if (!msg) return null
  return (
    <div className="fixed top-5 right-5 z-50 bg-green-600 text-white text-xs
                    px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
      <IconCheck size={14} />{msg}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <IconX size={12} />
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
                        justify-center text-slate-600">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

// ── Field ─────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase
                        tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Input({ ...props }) {
  return (
    <input {...props}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                 focus:outline-none focus:border-blue-400 bg-white" />
  )
}

function Select({ children, ...props }) {
  return (
    <select {...props}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                 focus:outline-none focus:border-blue-400 bg-white appearance-none">
      {children}
    </select>
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
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0
                    ${checked ? 'bg-slate-900' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow
                          transition-transform
                          ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

// ── Sidebar Nav ───────────────────────────────────
const NAV = [
  { key: 'profile',   label: 'Profile',       icon: <IconUser size={15} />          },
  { key: 'store',     label: 'Store',          icon: <IconBuildingStore size={15} /> },
  { key: 'receipt',   label: 'Receipt & POS',  icon: <IconReceipt size={15} />       },
  { key: 'notif',     label: 'Notifications',  icon: <IconBell size={15} />          },
  { key: 'appearance',label: 'Appearance',     icon: <IconPalette size={15} />       },
  { key: 'security',  label: 'Security',       icon: <IconShield size={15} />        },
  { key: 'data',      label: 'Data & Backup',  icon: <IconDatabase size={15} />      },
]

// ── Profile Tab ───────────────────────────────────
function ProfileTab({ onSave }) {
  const [form, setForm] = useState({
    firstName: 'Admin', lastName: 'Silva',
    email: 'admin@partsproapp.com', phone: '+94 77 123 4567',
    role: 'Administrator', avatar: null,
  })

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  return (
    <Section title="Profile" subtitle="Your personal account details" icon={<IconUser size={16} />}>
      <div className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-sky-400 flex items-center
                          justify-center text-xl font-medium text-slate-900">
            AS
          </div>
          <div className="space-y-2">
            <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200
                               rounded-lg text-xs text-gray-600 hover:border-gray-300">
              <IconUpload size={12} /> Upload photo
            </button>
            <p className="text-[10px] text-gray-400">PNG or JPG, max 2MB</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="First name">
            <Input value={form.firstName} onChange={e => set('firstName', e.target.value)} />
          </Field>
          <Field label="Last name">
            <Input value={form.lastName} onChange={e => set('lastName', e.target.value)} />
          </Field>
        </div>

        <Field label="Email address">
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Role">
            <Input value={form.role} disabled
                   className="bg-gray-50 text-gray-400 cursor-not-allowed" />
          </Field>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onSave}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white
                             rounded-xl text-sm font-medium hover:bg-slate-700">
            <IconDeviceFloppy size={15} /> Save profile
          </button>
        </div>
      </div>
    </Section>
  )
}

// ── Store Tab ─────────────────────────────────────
function StoreTab({ onSave }) {
  const [form, setForm] = useState({
    storeName:  'PartsPro Auto Spares',
    address:    'No 45, Baseline Rd, Colombo 09',
    phone:      '+94 11 234 5678',
    email:      'info@partsproapp.com',
    taxId:      'VAT-12345678',
    currency:   'USD',
    timezone:   'Asia/Colombo',
    language:   'English',
  })

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  return (
    <Section title="Store settings" subtitle="Business info shown on receipts and reports"
             icon={<IconBuildingStore size={16} />}>
      <div className="space-y-4">
        <Field label="Store name">
          <Input value={form.storeName} onChange={e => set('storeName', e.target.value)} />
        </Field>

        <Field label="Address">
          <Input value={form.address} onChange={e => set('address', e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tax / VAT ID">
            <Input value={form.taxId} onChange={e => set('taxId', e.target.value)} />
          </Field>
          <Field label="Currency">
            <Select value={form.currency} onChange={e => set('currency', e.target.value)}>
              {['USD', 'LKR', 'EUR', 'GBP', 'AUD'].map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Timezone">
            <Select value={form.timezone} onChange={e => set('timezone', e.target.value)}>
              {['Asia/Colombo', 'Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Language">
            <Select value={form.language} onChange={e => set('language', e.target.value)}>
              {['English', 'Sinhala', 'Tamil'].map(l => <option key={l}>{l}</option>)}
            </Select>
          </Field>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onSave}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white
                             rounded-xl text-sm font-medium hover:bg-slate-700">
            <IconDeviceFloppy size={15} /> Save store settings
          </button>
        </div>
      </div>
    </Section>
  )
}

// ── Receipt & POS Tab ─────────────────────────────
function ReceiptTab({ onSave }) {
  const [form, setForm] = useState({
    taxRate:      '5',
    discountRate: '3',
    discountMin:  '100',
    footerText:   'Thank you for your business! Visit us again.',
    showLogo:     true,
    autoPrint:    false,
    showTax:      true,
    showDiscount: true,
  })
  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  return (
    <Section title="Receipt & POS" subtitle="Configure tax, discount and receipt printing"
             icon={<IconReceipt size={16} />}>
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Tax rate (%)" hint="Applied on every sale">
            <div className="relative">
              <Input type="number" value={form.taxRate}
                     onChange={e => set('taxRate', e.target.value)} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
            </div>
          </Field>
          <Field label="Discount rate (%)" hint="Auto-applied when min met">
            <div className="relative">
              <Input type="number" value={form.discountRate}
                     onChange={e => set('discountRate', e.target.value)} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
            </div>
          </Field>
          <Field label="Discount minimum" hint="Min subtotal to apply discount">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <Input type="number" value={form.discountMin}
                     onChange={e => set('discountMin', e.target.value)}
                     className="pl-6" />
            </div>
          </Field>
        </div>

        <Field label="Receipt footer text">
          <textarea value={form.footerText} onChange={e => set('footerText', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                               focus:outline-none focus:border-blue-400 resize-none" />
        </Field>

        <div className="border border-gray-100 rounded-xl p-4 space-y-0">
          <Toggle checked={form.showLogo}     onChange={v => set('showLogo', v)}
                  label="Show store logo on receipt" sub="Displays your store name at the top" />
          <Toggle checked={form.showTax}      onChange={v => set('showTax', v)}
                  label="Show tax breakdown"  sub="Show tax line item on receipt" />
          <Toggle checked={form.showDiscount} onChange={v => set('showDiscount', v)}
                  label="Show discount line"  sub="Display discount when applied" />
          <Toggle checked={form.autoPrint}    onChange={v => set('autoPrint', v)}
                  label="Auto-print receipt"  sub="Automatically print after completing a sale" />
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onSave}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white
                             rounded-xl text-sm font-medium hover:bg-slate-700">
            <IconDeviceFloppy size={15} /> Save POS settings
          </button>
        </div>
      </div>
    </Section>
  )
}

// ── Notifications Tab ─────────────────────────────
function NotifTab({ onSave }) {
  const [settings, setSettings] = useState({
    lowStock:     true,
    outOfStock:   true,
    newOrder:     true,
    dailyReport:  false,
    weeklyReport: true,
    emailNotif:   true,
    smsNotif:     false,
    lowStockQty:  '10',
  })
  function set(k, v) { setSettings(p => ({ ...p, [k]: v })) }

  return (
    <Section title="Notifications" subtitle="Control alerts and report emails"
             icon={<IconBell size={16} />}>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Stock alerts
          </p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle checked={settings.lowStock}   onChange={v => set('lowStock', v)}
                    label="Low stock alert"       sub="Alert when part drops below minimum" />
            <Toggle checked={settings.outOfStock} onChange={v => set('outOfStock', v)}
                    label="Out of stock alert"    sub="Alert when a part reaches zero" />
          </div>
          <div className="mt-3">
            <Field label="Default low stock threshold"
                   hint="Alert when any part drops below this quantity">
              <Input type="number" value={settings.lowStockQty}
                     onChange={e => set('lowStockQty', e.target.value)}
                     className="w-32" />
            </Field>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Sales alerts
          </p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle checked={settings.newOrder}     onChange={v => set('newOrder', v)}
                    label="New order notification"  sub="Alert on every completed sale" />
            <Toggle checked={settings.dailyReport}  onChange={v => set('dailyReport', v)}
                    label="Daily sales report"      sub="Summary email at end of day" />
            <Toggle checked={settings.weeklyReport} onChange={v => set('weeklyReport', v)}
                    label="Weekly summary report"   sub="Every Monday morning" />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Delivery method
          </p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle checked={settings.emailNotif} onChange={v => set('emailNotif', v)}
                    label="Email notifications"   sub="Send alerts to your registered email" />
            <Toggle checked={settings.smsNotif}   onChange={v => set('smsNotif', v)}
                    label="SMS notifications"     sub="Send alerts via SMS (extra charges may apply)" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onSave}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white
                             rounded-xl text-sm font-medium hover:bg-slate-700">
            <IconDeviceFloppy size={15} /> Save notification settings
          </button>
        </div>
      </div>
    </Section>
  )
}

// ── Appearance Tab ────────────────────────────────
function AppearanceTab({ onSave }) {
  const [theme,    setTheme]    = useState('light')
  const [density,  setDensity]  = useState('comfortable')
  const [fontSize, setFontSize] = useState('medium')
  const [accent,   setAccent]   = useState('#0f172a')

  const accents = ['#0f172a', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#f59e0b']

  return (
    <Section title="Appearance" subtitle="Customize how PartsPro looks"
             icon={<IconPalette size={16} />}>
      <div className="space-y-6">
        {/* Theme */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Theme</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'light', label: 'Light', icon: <IconSun size={18} />,  desc: 'Clean white interface' },
              { key: 'dark',  label: 'Dark',  icon: <IconMoon size={18} />, desc: 'Easy on the eyes'      },
            ].map(t => (
              <button key={t.key} onClick={() => setTheme(t.key)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all
                        ${theme === t.key
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-gray-200 hover:border-gray-300'}`}>
                <span className={theme === t.key ? 'text-slate-900' : 'text-gray-400'}>
                  {t.icon}
                </span>
                <div>
                  <p className={`text-sm font-medium ${theme === t.key ? 'text-slate-900' : 'text-gray-600'}`}>
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
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Accent color</p>
          <div className="flex gap-3">
            {accents.map(color => (
              <button key={color} onClick={() => setAccent(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all
                        ${accent === color ? 'border-gray-400 scale-110' : 'border-transparent'}`}
                      style={{ background: color }} />
            ))}
          </div>
        </div>

        {/* Density */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Table density</p>
          <div className="flex gap-2">
            {['compact', 'comfortable', 'spacious'].map(d => (
              <button key={d} onClick={() => setDensity(d)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all capitalize
                        ${density === d ? 'bg-slate-900 text-white border-slate-900' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Font size</p>
          <div className="flex gap-2">
            {['small', 'medium', 'large'].map(f => (
              <button key={f} onClick={() => setFontSize(f)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all capitalize
                        ${fontSize === f ? 'bg-slate-900 text-white border-slate-900' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onSave}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white
                             rounded-xl text-sm font-medium hover:bg-slate-700">
            <IconDeviceFloppy size={15} /> Save appearance
          </button>
        </div>
      </div>
    </Section>
  )
}

// ── Security Tab ──────────────────────────────────
function SecurityTab({ onSave }) {
  const [form, setForm]       = useState({ current: '', newPass: '', confirm: '' })
  const [showPw, setShowPw]   = useState({ current: false, newPass: false, confirm: false })
  const [twoFa, setTwoFa]     = useState(false)
  const [sessions, setSessions] = useState(true)
  const [error, setError]     = useState('')

  function toggleShow(field) { setShowPw(p => ({ ...p, [field]: !p[field] })) }
  function set(k, v) {
    setForm(p => ({ ...p, [k]: v }))
    setError('')
  }

  function handleSave() {
    if (!form.current) { setError('Enter your current password'); return }
    if (form.newPass.length < 8) { setError('New password must be at least 8 characters'); return }
    if (form.newPass !== form.confirm) { setError('Passwords do not match'); return }
    onSave()
    setForm({ current: '', newPass: '', confirm: '' })
  }

  function PwField({ label, field }) {
    return (
      <Field label={label}>
        <div className="relative">
          <input type={showPw[field] ? 'text' : 'password'}
                 value={form[field]} onChange={e => set(field, e.target.value)}
                 placeholder="••••••••"
                 className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm
                            focus:outline-none focus:border-blue-400" />
          <button type="button" onClick={() => toggleShow(field)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw[field] ? <IconEyeOff size={15} /> : <IconEye size={15} />}
          </button>
        </div>
      </Field>
    )
  }

  return (
    <Section title="Security" subtitle="Password and account security settings"
             icon={<IconShield size={16} />}>
      <div className="space-y-6">
        {/* Change password */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
            Change password
          </p>
          <div className="space-y-4">
            <PwField label="Current password"  field="current" />
            <PwField label="New password"      field="newPass" />
            <PwField label="Confirm new password" field="confirm" />
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <IconAlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={handleSave}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white
                                 rounded-xl text-sm font-medium hover:bg-slate-700">
                <IconShield size={15} /> Update password
              </button>
            </div>
          </div>
        </div>

        {/* Security options */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Security options
          </p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-0">
            <Toggle checked={twoFa}    onChange={setTwoFa}
                    label="Two-factor authentication"
                    sub="Add an extra layer of security to your account" />
            <Toggle checked={sessions} onChange={setSessions}
                    label="Active session alerts"
                    sub="Get notified when someone logs into your account" />
          </div>
        </div>

        {/* Danger zone */}
        <div className="border border-red-100 rounded-xl p-4">
          <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-3">
            Danger zone
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800">Sign out of all devices</p>
              <p className="text-xs text-gray-400 mt-0.5">Logs out all active sessions</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-red-200
                               rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors">
              <IconLogout size={13} /> Sign out all
            </button>
          </div>
        </div>
      </div>
    </Section>
  )
}

// ── Data & Backup Tab ─────────────────────────────
function DataTab({ onSave }) {
  const [autoBackup, setAutoBackup]   = useState(true)
  const [backupFreq, setBackupFreq]   = useState('Daily')
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <Section title="Data & Backup" subtitle="Export, backup and reset your data"
             icon={<IconDatabase size={16} />}>
      <div className="space-y-6">
        {/* Export */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Export data
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Export inventory',  desc: 'All parts as CSV'     },
              { label: 'Export orders',     desc: 'All orders as CSV'    },
              { label: 'Export customers',  desc: 'Customer list as CSV' },
              { label: 'Export suppliers',  desc: 'Supplier list as CSV' },
            ].map(ex => (
              <button key={ex.label}
                      className="flex items-center gap-2.5 p-3 border border-gray-200 rounded-xl
                                 text-left hover:border-gray-300 hover:bg-gray-50 transition-colors">
                <IconDatabase size={15} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-800">{ex.label}</p>
                  <p className="text-[10px] text-gray-400">{ex.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Backup */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Auto backup
          </p>
          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <Toggle checked={autoBackup} onChange={setAutoBackup}
                    label="Enable automatic backup"
                    sub="Automatically back up your data to cloud storage" />
            {autoBackup && (
              <Field label="Backup frequency">
                <Select value={backupFreq} onChange={e => setBackupFreq(e.target.value)}>
                  {['Daily', 'Weekly', 'Monthly'].map(f => <option key={f}>{f}</option>)}
                </Select>
              </Field>
            )}
          </div>
          <div className="mt-3 flex justify-between items-center p-3 bg-gray-50
                          border border-gray-100 rounded-xl">
            <div>
              <p className="text-xs font-medium text-gray-700">Last backup</p>
              <p className="text-[10px] text-gray-400 mt-0.5">2026-08-04 at 03:00 AM</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200
                               rounded-lg text-xs text-gray-600 hover:border-gray-300 bg-white">
              <IconDatabase size={12} /> Backup now
            </button>
          </div>
        </div>

        {/* Reset */}
        <div className="border border-red-100 rounded-xl p-4">
          <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-3">
            Danger zone
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800">Reset all data</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Permanently delete all inventory, orders and customer data
              </p>
            </div>
            {!confirmReset ? (
              <button onClick={() => setConfirmReset(true)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-red-200
                                 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors">
                <IconTrash size={13} /> Reset data
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setConfirmReset(false)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600">
                  Cancel
                </button>
                <button className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">
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

// ── Main Settings Page ────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [toast,     setToast]     = useState(null)

  function handleSave() {
    const labels = {
      profile: 'Profile saved', store: 'Store settings saved',
      receipt: 'POS settings saved', notif: 'Notification settings saved',
      appearance: 'Appearance saved', security: 'Password updated',
      data: 'Settings saved',
    }
    setToast(labels[activeTab] || 'Settings saved')
    setTimeout(() => setToast(null), 2500)
  }

  const TAB_CONTENT = {
    profile:    <ProfileTab    onSave={handleSave} />,
    store:      <StoreTab      onSave={handleSave} />,
    receipt:    <ReceiptTab    onSave={handleSave} />,
    notif:      <NotifTab      onSave={handleSave} />,
    appearance: <AppearanceTab onSave={handleSave} />,
    security:   <SecurityTab   onSave={handleSave} />,
    data:       <DataTab       onSave={handleSave} />,
  }

  return (
    <div className="p-4 md:p-6">
      <Toast msg={toast} onClose={() => setToast(null)} />

      {/* ── Header ───────────────────────── */}
      <div className="mb-5">
        <h1 className="text-xl font-medium text-gray-900">Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Manage your account, store and system preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-5">

        {/* ── Sidebar Nav ──────────────── */}
        <div className="md:w-52 flex-shrink-0">
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {NAV.map((item, i) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm
                            transition-colors border-b border-gray-50 last:border-0
                  ${activeTab === item.key
                    ? 'bg-slate-900 text-white'
                    : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className={activeTab === item.key ? 'text-white' : 'text-gray-400'}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}

            {/* Logout */}
            <div className="border-t border-gray-100 p-3">
              <button className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl
                                 text-sm text-red-500 hover:bg-red-50 transition-colors">
                <IconLogout size={15} /> Sign out
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab Content ──────────────── */}
        <div className="flex-1 min-w-0">
          {TAB_CONTENT[activeTab]}
        </div>
      </div>
    </div>
  )
}