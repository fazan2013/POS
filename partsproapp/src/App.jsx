// ================================================
// src/App.jsx — role-based route protection
// ================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isLoggedIn, getUser } from './services/api'
import Layout             from './components/Layout'
import RoleProtectedRoute from './components/RoleProtectedRoute'

// Pages
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import POS       from './pages/POS'
import Orders    from './pages/Orders'
import Suppliers from './pages/Suppliers'
import Customers from './pages/Customers'
import Reports   from './pages/Reports'
import Settings  from './pages/Settings'
import PartForm  from './pages/PartForm'
import { storeApi,setCurrency } from './services/api'
import { useEffect } from 'react'

// ── Default home by role ──────────────────────────
function RoleHome() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  const role = getUser()?.role || 'Cashier'
  const homeMap = {
    'Administrator': '/dashboard',
    'Store Manager': '/dashboard',
    'Cashier':       '/pos',
    'Warehouse':     '/inventory',
  }
  return <Navigate to={homeMap[role] || '/pos'} replace />
}

// ── Protected + role-checked wrapper ─────────────
function Protected({ path, children }) {
  return (
    <RoleProtectedRoute path={path}>
      <Layout>
        {children}
      </Layout>
    </RoleProtectedRoute>
  )
}

export default function App() {

  useEffect(() => {
  async function loadCurrency() {
    try {
      const settings = await storeApi.get()
      if (settings.currency) {
        setCurrency(settings.currency)
      }
    } catch {
      console.warn('Failed to load currency from API, using default Rs.')
      // use default Rs.
    }
  }
  if (isLoggedIn()) loadCurrency()
}, [])


  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Smart redirect based on role */}
        <Route path="/" element={<RoleHome />} />

        {/* Role-protected pages */}
        <Route path="/dashboard"
               element={<Protected path="/dashboard"><Dashboard /></Protected>} />

        <Route path="/pos"
               element={<Protected path="/pos"><POS /></Protected>} />

        <Route path="/orders"
               element={<Protected path="/orders"><Orders /></Protected>} />

        <Route path="/inventory"
               element={<Protected path="/inventory"><Inventory /></Protected>} />

        <Route path="/parts/add"
               element={<Protected path="/parts/add"><PartForm /></Protected>} />

        <Route path="/parts/edit/:id"
               element={<Protected path="/parts/add"><PartForm /></Protected>} />

        <Route path="/customers"
               element={<Protected path="/customers"><Customers /></Protected>} />

        <Route path="/suppliers"
               element={<Protected path="/suppliers"><Suppliers /></Protected>} />

        <Route path="/reports"
               element={<Protected path="/reports"><Reports /></Protected>} />

        <Route path="/settings"
               element={<Protected path="/settings"><Settings /></Protected>} />

        {/* Fallback */}
        <Route path="*" element={<RoleHome />} />
      </Routes>
    </BrowserRouter>
  )
}