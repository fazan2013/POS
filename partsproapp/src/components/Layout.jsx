// ================================================
// src/components/Layout.jsx
// Fixed — profile image from localStorage
// ================================================
import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  IconLayoutDashboard, IconPackage, IconShoppingCart,
  IconFileInvoice, IconTruck, IconUsers, IconChartBar,
  IconSettings, IconEngine, IconBell, IconSearch,
  IconChevronRight, IconMenu2
} from '@tabler/icons-react'
import { clearSession } from '../services/api'

// ── Nav items ─────────────────────────────────────
const NAV_ITEMS = [
  {
    section: 'Main',
    links: [
      { to: '/dashboard', label: 'Dashboard',   icon: <IconLayoutDashboard size={17} /> },
      { to: '/inventory', label: 'Inventory',   icon: <IconPackage size={17} />          },
      { to: '/pos',       label: 'POS / Sales', icon: <IconShoppingCart size={17} />    },
      { to: '/orders',    label: 'Orders',      icon: <IconFileInvoice size={17} />     },
    ]
  },
  {
    section: 'Management',
    links: [
      { to: '/suppliers', label: 'Suppliers',   icon: <IconTruck size={17} />            },
      { to: '/customers', label: 'Customers',   icon: <IconUsers size={17} />            },
      { to: '/reports',   label: 'Reports',     icon: <IconChartBar size={17} />         },
    ]
  },
  {
    section: 'System',
    links: [
      { to: '/settings',  label: 'Settings',    icon: <IconSettings size={17} />         },
    ]
  },
]

// ── Read full user object from localStorage ───────
function readUser() {
  try {
    const raw = localStorage.getItem('pp_user')
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

// ── Avatar — image or initials ────────────────────
function Avatar({ fullName, profileImage, className = '' }) {
  const initials = fullName
    ? fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const base = `w-8 h-8 rounded-full flex-shrink-0 object-cover ${className}`

  if (profileImage) {
    return (
      <img
        src={profileImage}
        alt={fullName || 'Profile'}
        className={`${base} border border-white/20`}
        onError={e => {
          // If image fails to load, replace with initials div
          e.currentTarget.style.display = 'none'
          e.currentTarget.nextSibling.style.display = 'flex'
        }}
      />
    )
  }

  return (
    <div className={`${base} bg-sky-400 items-center justify-center
                     text-[11px] font-medium text-slate-900`}>
      {initials}
    </div>
  )
}

// ── Initials fallback (shown when img errors) ─────
function InitialsFallback({ fullName, className = '' }) {
  const initials = fullName
    ? fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'
  return (
    <div className={`w-8 h-8 rounded-full flex-shrink-0 bg-sky-400 items-center
                     justify-center text-[11px] font-medium text-slate-900
                     hidden ${className}`}>
      {initials}
    </div>
  )
}

// ── User footer pill ──────────────────────────────
function UserPill({ user, onClick }) {
  const fullName     = user.fullName     || 'User'
  const role         = user.role         || 'Staff'
  const profileImage = user.profileImage || null

  const initials = fullName
    .split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                 hover:bg-white/5 transition-colors text-left group"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden
                      border border-white/10">
        {profileImage ? (
          <img
            src={profileImage}
            alt={fullName}
            className="w-full h-full object-cover"
            onError={e => {
              // replace broken img with initials div
              e.currentTarget.parentElement.innerHTML = `
                <div style="width:100%;height:100%;background:#38bdf8;
                            display:flex;align-items:center;justify-content:center;
                            font-size:11px;font-weight:500;color:#0f172a;">
                  ${initials}
                </div>`
            }}
          />
        ) : (
          <div className="w-full h-full bg-sky-400 flex items-center
                          justify-center text-[11px] font-medium text-slate-900">
            {initials}
          </div>
        )}
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-200 truncate leading-tight">
          {fullName}
        </p>
        <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
          {role}
        </p>
      </div>

      <IconChevronRight
        size={12}
        className="text-slate-600 flex-shrink-0 group-hover:text-slate-400 transition-colors"
      />
    </button>
  )
}

// ── Topbar avatar ─────────────────────────────────
function TopbarAvatar({ user, onClick }) {
  const fullName     = user.fullName     || 'User'
  const role         = user.role         || ''
  const profileImage = user.profileImage || null

  const initials = fullName
    .split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 pl-1 hover:opacity-80 transition-opacity"
      title="Profile settings"
    >
      <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden
                      border border-gray-200">
        {profileImage ? (
          <img
            src={profileImage}
            alt={fullName}
            className="w-full h-full object-cover"
            onError={e => {
              e.currentTarget.parentElement.innerHTML = `
                <div style="width:100%;height:100%;background:#38bdf8;
                            display:flex;align-items:center;justify-content:center;
                            font-size:11px;font-weight:500;color:#0f172a;">
                  ${initials}
                </div>`
            }}
          />
        ) : (
          <div className="w-full h-full bg-sky-400 flex items-center
                          justify-center text-[11px] font-medium text-slate-900">
            {initials}
          </div>
        )}
      </div>
      <div className="hidden md:block text-left">
        <p className="text-xs font-medium text-gray-900 leading-tight truncate max-w-28">
          {fullName}
        </p>
        <p className="text-[10px] text-gray-400 leading-tight">{role}</p>
      </div>
    </button>
  )
}

// ── Main Layout ───────────────────────────────────
export default function Layout({ children }) {
  const navigate      = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user,        setUser]        = useState(readUser)

  // ── Refresh user from localStorage ───────────
  useEffect(() => {
    function sync() { setUser(readUser()) }

    // Catch cross-tab storage events
    window.addEventListener('storage', sync)

    // Poll for same-tab changes (Settings saves update localStorage)
    const timer = setInterval(sync, 1000)

    return () => {
      window.removeEventListener('storage', sync)
      clearInterval(timer)
    }
  }, [])

  function handleLogout() {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────── */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-56 bg-slate-900 flex flex-col flex-shrink-0
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-4
                        border-b border-white/10 flex-shrink-0">
          <div className="w-8 h-8 bg-sky-400 rounded-lg flex items-center
                          justify-center flex-shrink-0">
            <IconEngine size={16} className="text-slate-900" />
          </div>
          <div>
            <p className="text-sm font-medium text-sky-50">PartsPro</p>
            <p className="text-[10px] text-sky-400 uppercase tracking-wider">
              Inventory & POS
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_ITEMS.map(group => (
            <div key={group.section} className="mb-2">
              <p className="text-[10px] font-medium text-slate-500 uppercase
                            tracking-wider px-3 py-2">
                {group.section}
              </p>
              {group.links.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5
                    text-xs transition-colors duration-100
                    ${isActive
                      ? 'bg-sky-400/10 text-sky-400 border-l-2 border-sky-400 rounded-l-none pl-[10px]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                  `}
                >
                  {link.icon}
                  <span className="flex-1">{link.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="flex-shrink-0 p-2 border-t border-white/10">
          <UserPill
            user={user}
            onClick={() => { navigate('/settings'); setSidebarOpen(false) }}
          />
        </div>
      </aside>

      {/* ── Main area ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-6
                           py-3 flex items-center gap-3 flex-shrink-0">
          <button
            className="md:hidden p-1.5 border border-gray-200 rounded-lg text-gray-500"
            onClick={() => setSidebarOpen(true)}
          >
            <IconMenu2 size={18} />
          </button>

          <div className="flex-1" />

          <button className="hidden sm:flex items-center gap-2 px-3 py-1.5
                             border border-gray-200 rounded-lg text-xs text-gray-400
                             hover:border-gray-300 transition-colors">
            <IconSearch size={13} />
            <span>Search…</span>
            <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
              Ctrl K
            </span>
          </button>

          <button className="relative w-8 h-8 border border-gray-200 rounded-lg
                             flex items-center justify-center text-gray-500
                             hover:border-gray-300 transition-colors">
            <IconBell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5
                             bg-red-500 rounded-full" />
          </button>

          <TopbarAvatar
            user={user}
            onClick={() => navigate('/settings')}
          />
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}