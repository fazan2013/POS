
import { Navigate } from 'react-router-dom'
import { getUser, isLoggedIn } from '../services/api'

// ── Which roles can access each route ────────────
const ROUTE_ROLES = {
  '/dashboard': ['Administrator', 'Store Manager', 'Warehouse'],
  '/pos':       ['Administrator', 'Store Manager', 'Cashier'],
  '/orders':    ['Administrator', 'Store Manager', 'Cashier'],
  '/inventory': ['Administrator', 'Store Manager', 'Warehouse'],
  '/parts/add': ['Administrator', 'Store Manager', 'Warehouse'],
  '/customers': ['Administrator', 'Store Manager', 'Cashier'],
  '/suppliers': ['Administrator', 'Store Manager'],
  '/reports':   ['Administrator', 'Store Manager'],
  '/settings':  ['Administrator', 'Store Manager'],
  '/purchases':         ['Administrator', 'Store Manager', 'Warehouse'],
'/purchases/new':     ['Administrator', 'Store Manager'],
'/purchases/receive': ['Administrator', 'Store Manager', 'Warehouse'],
'/purchases/invoice':  ['Administrator', 'Store Manager'],
'/users': ['Administrator'],
}

// ── Default landing page per role ─────────────────
const ROLE_HOME = {
  'Administrator': '/dashboard',
  'Store Manager': '/dashboard',
  'Cashier':       '/pos',
  'Warehouse':     '/inventory',
}

export default function RoleProtectedRoute({ path, children }) {
  // 1. Must be logged in
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }

  const user = getUser()
  const role = user?.role || ''

  // 2. Check if this route allows this role
  const allowedRoles = ROUTE_ROLES[path]

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to their home page instead of showing error
    const home = ROLE_HOME[role] || '/pos'
    return <Navigate to={home} replace />
  }

  return children
}


// ================================================
// UNAUTHORIZED PAGE — shown if somehow user lands
// on a page they can't access
// ================================================
export function UnauthorizedPage() {
  const user = getUser()
  const role = user?.role || ''
  const home = ROLE_HOME[role] || '/pos'

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center
                      justify-center">
        <span className="text-2xl">🔒</span>
      </div>
      <h2 className="text-xl font-medium text-gray-900">Access Restricted</h2>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        Your role <span className="font-medium text-gray-800">({role})</span> does
        not have permission to view this page.
      </p>
      <a href={home}
         className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm
                    font-medium hover:bg-slate-700 transition-colors">
        Go to my dashboard
      </a>
    </div>
  )
}