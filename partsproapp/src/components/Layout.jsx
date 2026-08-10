import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  IconLayoutDashboard, IconPackage, IconShoppingCart,
  IconFileInvoice, IconTruck, IconUsers, IconChartBar,
  IconSettings, IconEngine, IconBell, IconSearch,
  IconChevronRight, IconMenu2, IconX
} from '@tabler/icons-react'

const navItems = [
  {
    section: 'Main',
    links: [
      { to: '/dashboard',  label: 'Dashboard',  icon: <IconLayoutDashboard size={18} /> },
      { to: '/inventory',  label: 'Inventory',  icon: <IconPackage size={18} /> },
      { to: '/pos',        label: 'POS / Sales', icon: <IconShoppingCart size={18} /> },
      { to: '/orders',     label: 'Orders',     icon: <IconFileInvoice size={18} />, badge: 12 },
    ]
  },
  {
    section: 'Management',
    links: [
      { to: '/suppliers',  label: 'Suppliers',  icon: <IconTruck size={18} /> },
      { to: '/customers',  label: 'Customers',  icon: <IconUsers size={18} /> },
      { to: '/reports',    label: 'Reports',    icon: <IconChartBar size={18} /> },
    ]
  },
  {
    section: 'System',
    links: [
      { to: '/settings',   label: 'Settings',   icon: <IconSettings size={18} /> },
    ]
  },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Mobile Overlay ───────────────────── */}
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
          <div className="w-8 h-8 bg-sky-400 rounded-lg flex items-center justify-center">
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
          {navItems.map(group => (
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
                    text-sm transition-colors duration-100
                    ${isActive
                      ? 'bg-sky-400/10 text-sky-400 border-l-2 border-sky-400 rounded-l-none pl-[10px]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                  `}
                >
                  {link.icon}
                  <span className="flex-1">{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] bg-sky-400/20 text-sky-400
                                     px-1.5 py-0.5 rounded-full font-medium">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="flex-shrink-0 p-2 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5
                       rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-sky-400 flex items-center
                            justify-center text-[11px] font-medium text-slate-900 flex-shrink-0">
              AS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">Admin Silva</p>
              <p className="text-[10px] text-slate-500">Administrator</p>
            </div>
            <IconChevronRight size={13} className="text-slate-600 flex-shrink-0" />
          </button>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-6
                           py-3 flex items-center gap-3 flex-shrink-0">

          {/* Mobile menu button */}
          <button
            className="md:hidden p-1.5 border border-gray-200 rounded-lg text-gray-500"
            onClick={() => setSidebarOpen(true)}
          >
            <IconMenu2 size={18} />
          </button>

          <div className="flex-1" />

          {/* Search */}
          <button className="hidden sm:flex items-center gap-2 px-3 py-1.5
                             border border-gray-200 rounded-lg text-sm text-gray-400
                             hover:border-gray-300 transition-colors">
            <IconSearch size={14} />
            <span>Search…</span>
            <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
              Ctrl K
            </span>
          </button>

          {/* Notifications */}
          <button className="relative w-8 h-8 border border-gray-200 rounded-lg
                             flex items-center justify-center text-gray-500
                             hover:border-gray-300 transition-colors">
            <IconBell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}