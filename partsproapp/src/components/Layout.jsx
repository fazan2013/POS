
import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  IconLayoutDashboard, IconPackage, IconShoppingCart,
  IconFileInvoice, IconTruck, IconUsers, IconChartBar,
  IconSettings, IconEngine, IconBell, IconSearch,
  IconChevronRight, IconMenu2, IconShieldLock,
  IconLogout, IconUser, IconX
} from '@tabler/icons-react'
import { getUser, clearSession } from '../services/api'
import { IconShoppingBag } from '@tabler/icons-react'


// ── Role-based nav config ─────────────────────────
const ALL_NAV = [
  {
    section: 'Main',
    links: [
      { to:'/dashboard', label:'Dashboard',   icon:<IconLayoutDashboard size={17}/>, roles:['Administrator','Store Manager','Warehouse'] },
      { to:'/pos',       label:'POS / Sales', icon:<IconShoppingCart size={17}/>,   roles:['Administrator','Store Manager','Cashier']   },
      { to:'/orders',    label:'Orders',      icon:<IconFileInvoice size={17}/>,    roles:['Administrator','Store Manager','Cashier']   },
      { to:'/inventory', label:'Inventory',   icon:<IconPackage size={17}/>,        roles:['Administrator','Store Manager','Warehouse'] },
      {
  to:    '/purchases',
  label: 'Purchases',
  icon:  <IconShoppingBag size={17} />,
  roles: ['Administrator', 'Store Manager', 'Warehouse'],
},
    ]
  },
  {
    section: 'Management',
    links: [
         { to:'/customers', label:'Customers', icon:<IconUsers size={17}/>,
      roles:['Administrator','Store Manager','Cashier'] },
    { to:'/suppliers', label:'Suppliers', icon:<IconTruck size={17}/>,
      roles:['Administrator','Store Manager'] },
    { to:'/purchases', label:'Purchases', icon:<IconShoppingBag size={17}/>,
      roles:['Administrator','Store Manager','Warehouse'] },
    { to:'/reports',   label:'Reports',   icon:<IconChartBar size={17}/>,
      roles:['Administrator','Store Manager'] },

      

    ]
  },
  {
    section: 'System',
    links: [
      {
      to:    '/users',
      label: 'Users',
      icon:  <IconUsers size={17} />,
      roles: ['Administrator'],
    },
      { to:'/settings', label:'Settings', icon:<IconSettings size={17}/>, roles:['Administrator','Store Manager'] },
      

    ]
  },
]

const ROLE_HOME = {
  'Administrator': '/dashboard',
  'Store Manager': '/dashboard',
  'Cashier':       '/pos',
  'Warehouse':     '/inventory',
}

function roleBadge(role) {
  const map = {
    'Administrator': 'bg-red-500/20 text-red-300',
    'Store Manager': 'bg-blue-500/20 text-blue-300',
    'Cashier':       'bg-green-500/20 text-green-300',
    'Warehouse':     'bg-amber-500/20 text-amber-300',
  }
  return map[role] || 'bg-slate-500/20 text-slate-400'
}

function roleBadgeLight(role) {
  const map = {
    'Administrator': 'bg-red-100 text-red-700',
    'Store Manager': 'bg-blue-100 text-blue-700',
    'Cashier':       'bg-green-100 text-green-700',
    'Warehouse':     'bg-amber-100 text-amber-700',
  }
  return map[role] || 'bg-gray-100 text-gray-600'
}

function navForRole(role) {
  return ALL_NAV
    .map(s => ({ ...s, links: s.links.filter(l => l.roles.includes(role)) }))
    .filter(s => s.links.length > 0)
}

// ── Avatar ────────────────────────────────────────
function Avatar({ fullName, profileImage, size = 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-[11px]'
  const initials = (fullName || 'U')
    .split(' ').filter(Boolean).map(n => n[0]).join('').slice(0,2).toUpperCase()

  if (profileImage) {
    return (
      <div className={`${dim} rounded-full overflow-hidden flex-shrink-0 border border-white/10`}>
        <img src={profileImage} alt={fullName} className="w-full h-full object-cover"
             onError={e => {
               e.currentTarget.parentElement.innerHTML =
                 `<div style="width:100%;height:100%;background:#38bdf8;display:flex;
                  align-items:center;justify-content:center;font-size:11px;
                  font-weight:500;color:#0f172a;">${initials}</div>`
             }} />
      </div>
    )
  }
  return (
    <div className={`${dim} rounded-full bg-sky-400 flex items-center justify-center
                     font-medium text-slate-900 flex-shrink-0`}>
      {initials}
    </div>
  )
}

// ── User Popup Menu ───────────────────────────────
// Shows for Cashier/Warehouse — logout only
// Shows for Admin/Manager — profile + logout
function UserPopup({ user, role, onClose, onLogout, onSettings }) {
  const popupRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  const canSettings = ['Administrator', 'Store Manager'].includes(role)

  return (
    <div ref={popupRef}
         className="absolute bottom-full left-2 right-2 mb-2 bg-white
                    rounded-2xl shadow-xl border border-gray-100 overflow-hidden
                    z-50 animate-in">

      {/* User info header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Avatar — light version for popup */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0
                          border-2 border-white shadow-sm">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.fullName}
                   className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-sky-400 flex items-center
                              justify-center text-sm font-medium text-slate-900">
                {(user?.fullName || 'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.fullName || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full
                              inline-block mt-0.5 ${roleBadgeLight(role)}`}>
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="p-1">
        {/* Settings — Admin/Manager only */}
        {canSettings && (
          <button
            onClick={onSettings}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-sm text-gray-700 hover:bg-gray-50 transition-colors
                       text-left"
          >
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center
                            justify-center flex-shrink-0">
              <IconSettings size={15} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-800">Settings</p>
              <p className="text-[10px] text-gray-400">Profile, store & preferences</p>
            </div>
          </button>
        )}

        {/* Profile — for non-admin, just shows info (no settings access) */}
        {!canSettings && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                          text-sm text-gray-500">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center
                            justify-center flex-shrink-0">
              <IconUser size={15} className="text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">My account</p>
              <p className="text-[10px] text-gray-400">Contact admin for changes</p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-100 my-1" />

        {/* Logout — always shown */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                     text-sm text-red-500 hover:bg-red-50 transition-colors
                     text-left"
        >
          <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center
                          justify-center flex-shrink-0">
            <IconLogout size={15} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-red-600">Sign out</p>
            <p className="text-[10px] text-red-400">Log out of NB POS</p>
          </div>
        </button>
      </div>
    </div>
  )
}

// ── Main Layout ───────────────────────────────────
export default function Layout({ children }) {
  const navigate        = useNavigate()
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [showUserPopup, setShowUserPopup] = useState(false)
  const [user,          setUser]          = useState(() => getUser())

  useEffect(() => {
    const sync = () => setUser(getUser())
    window.addEventListener('storage', sync)
    const t = setInterval(sync, 1000)
    return () => { window.removeEventListener('storage', sync); clearInterval(t) }
  }, [])

  const fullName     = user?.fullName     || 'User'
  const role         = user?.role         || 'Cashier'
  const profileImage = user?.profileImage || null
  const canSettings  = ['Administrator', 'Store Manager'].includes(role)
  const navItems     = navForRole(role)

  function handleLogout() {
    clearSession()
    navigate('/login')
  }

  function handleSettings() {
    setShowUserPopup(false)
    setSidebarOpen(false)
    navigate('/settings')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden"
             onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────── */}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-56 bg-slate-900
                         flex flex-col flex-shrink-0 transform transition-transform
                         duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                         md:translate-x-0`}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 flex-shrink-0">
          <div className="w-8 h-8 bg-sky-400 rounded-lg flex items-center
                          justify-center flex-shrink-0">
            <IconEngine size={16} className="text-slate-900" />
          </div>
          <div>
            <p className="text-sm font-medium text-sky-50">NB POS</p>
            <p className="text-[10px] text-sky-400 uppercase tracking-wider">
              Inventory & POS
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map(group => (
            <div key={group.section} className="mb-2">
              <p className="text-[10px] font-medium text-slate-500 uppercase
                            tracking-wider px-3 py-2">
                {group.section}
              </p>
              {group.links.map(link => (
                <NavLink key={link.to} to={link.to}
                         onClick={() => setSidebarOpen(false)}
                         className={({ isActive }) => `
                           flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5
                           text-xs transition-colors duration-100
                           ${isActive
                             ? 'bg-sky-400/10 text-sky-400 border-l-2 border-sky-400 rounded-l-none pl-[10px]'
                             : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                  {link.icon}
                  <span className="flex-1">{link.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ── User footer with popup ─────────── */}
        <div className="flex-shrink-0 p-2 border-t border-white/10 relative">

          {/* Popup menu */}
          {showUserPopup && (
            <UserPopup
              user={user}
              role={role}
              onClose={() => setShowUserPopup(false)}
              onLogout={handleLogout}
              onSettings={handleSettings}
            />
          )}

          {/* Role badge */}
          <div className="flex items-center gap-2 px-3 py-1 mb-1">
            <IconShieldLock size={11} className="text-slate-500 flex-shrink-0" />
            <span className={`text-[10px] font-medium px-1.5 py-0.5
                              rounded-full ${roleBadge(role)}`}>
              {role}
            </span>
          </div>

          {/* User button — always clickable, shows popup */}
          <button
            onClick={() => setShowUserPopup(p => !p)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                       hover:bg-white/5 transition-colors text-left group"
          >
            <Avatar fullName={fullName} profileImage={profileImage} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate leading-tight">
                {fullName}
              </p>
              <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                {user?.email || ''}
              </p>
            </div>
            <IconChevronRight size={12}
              className={`text-slate-600 flex-shrink-0 transition-all
                ${showUserPopup ? 'rotate-90 text-slate-400' : 'group-hover:text-slate-400'}`} />
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3
                           flex items-center gap-3 flex-shrink-0">
          <button className="md:hidden p-1.5 border border-gray-200 rounded-lg
                             text-gray-500"
                  onClick={() => setSidebarOpen(true)}>
            <IconMenu2 size={18} />
          </button>

          <div className="flex-1" />

          <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 border
                             border-gray-200 rounded-lg text-xs text-gray-400
                             hover:border-gray-300 transition-colors">
            <IconSearch size={13} /><span>Search…</span>
          </button>

          <button className="relative w-8 h-8 border border-gray-200 rounded-lg
                             flex items-center justify-center text-gray-500
                             hover:border-gray-300">
            <IconBell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5
                             bg-red-500 rounded-full" />
          </button>

          {/* Topbar user — same popup on click */}
          <button
            onClick={() => setShowUserPopup(p => !p)}
            className="flex items-center gap-2 pl-1 hover:opacity-80 transition-opacity"
          >
            <Avatar fullName={fullName} profileImage={profileImage} />
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium text-gray-900 leading-tight
                            truncate max-w-28">
                {fullName}
              </p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5
                                rounded-full ${roleBadgeLight(role)}`}>
                {role}
              </span>
            </div>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}