// ================================================
// src/App.jsx  — final wired version
// ================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout      from './components/Layout'
import Login       from './pages/Login'
import Dashboard   from './pages/Dashboard'
import Inventory   from './pages/Inventory'
import POS         from './pages/POS'
import Orders      from './pages/Orders'
import Suppliers   from './pages/Suppliers'
import Customers   from './pages/Customers'
import Reports     from './pages/Reports'
import Settings    from './pages/Settings'
import PartForm    from './pages/PartForm'

function Private({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"          element={<Login />} />
        <Route path="/"               element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard"      element={<Private><Dashboard /></Private>} />
        <Route path="/inventory"      element={<Private><Inventory /></Private>} />
        <Route path="/pos"            element={<Private><POS /></Private>} />
        <Route path="/orders"         element={<Private><Orders /></Private>} />
        <Route path="/suppliers"      element={<Private><Suppliers /></Private>} />
        <Route path="/customers"      element={<Private><Customers /></Private>} />
        <Route path="/reports"        element={<Private><Reports /></Private>} />
        <Route path="/settings"       element={<Private><Settings /></Private>} />
        <Route path="/parts/add"      element={<Private><PartForm /></Private>} />
        <Route path="/parts/edit/:id" element={<Private><PartForm /></Private>} />
 
      </Routes>
    </BrowserRouter>
  )
}
