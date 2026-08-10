// ================================================
// src/pages/Login.jsx  — connected to real API
// ================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, saveSession } from '../services/api'
import {
  IconEngine, IconShieldCheck, IconShoppingCart,
  IconPackage, IconTruck, IconArrowRight, IconAlertTriangle
} from '@tabler/icons-react'

const ROLES = [
  { label: 'Admin',         icon: <IconShieldCheck size={15} /> },
  { label: 'Cashier',       icon: <IconShoppingCart size={15} /> },
  { label: 'Store Manager', icon: <IconPackage size={15} /> },
  { label: 'Warehouse',     icon: <IconTruck size={15} /> },
]

export default function Login() {
  const navigate = useNavigate()
  const [email,       setEmail]       = useState('admin@partsproapp.com')
  const [password,    setPassword]    = useState('')
  const [selectedRole,setSelectedRole]= useState('Admin')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter email and password.'); return }

    setLoading(true)
    setError('')
    try {
      const data = await authApi.login({ email, password })
      saveSession(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-lg">

        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-between bg-slate-900 text-white w-2/5 p-10">
          <div className="flex items-center gap-3">
            <div className="bg-sky-400 rounded-lg p-2">
              <IconEngine size={20} className="text-slate-900" />
            </div>
            <div>
              <p className="font-medium text-sky-50">PartsPro</p>
              <p className="text-xs text-sky-400 uppercase tracking-wider">Inventory & POS</p>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-medium leading-snug mb-3">
              Your spare parts business, fully in control
            </h1>
            <p className="text-sm text-sky-300 leading-relaxed">
              Manage inventory, process sales, and track every part
              from a single dashboard built for speed.
            </p>
          </div>
          <div className="flex gap-8">
            {[
              { num: '12k+', label: 'Parts tracked'  },
              { num: '98%',  label: 'Stock accuracy'  },
              { num: '3s',   label: 'Avg checkout'    },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xl font-medium text-sky-400">{s.num}</p>
                <p className="text-xs text-sky-300 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white p-10 flex flex-col justify-center">
          <h2 className="text-xl font-medium text-gray-900 mb-1">Sign in to your account</h2>
          <p className="text-sm text-gray-500 mb-6">Select your role and enter credentials</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {ROLES.map(role => (
              <button key={role.label} type="button"
                      onClick={() => setSelectedRole(role.label)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all
                        ${selectedRole === role.label
                          ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {role.icon}{role.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border
                            border-red-200 rounded-lg text-sm text-red-600 mb-4">
              <IconAlertTriangle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input type="email" value={email}
                     onChange={e => setEmail(e.target.value)}
                     placeholder="admin@partsproapp.com"
                     className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                                focus:outline-none focus:border-sky-400" />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs text-sky-500 hover:underline">Forgot password?</a>
              </div>
              <input type="password" value={password}
                     onChange={e => setPassword(e.target.value)}
                     placeholder="••••••••"
                     className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                                focus:outline-none focus:border-sky-400" />
            </div>
            <button type="submit" disabled={loading}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center
                                justify-center gap-2 mt-2 transition-colors
                      ${loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                : <>Sign in <IconArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            Having trouble?{' '}
            <a href="#" className="text-sky-500 hover:underline">Contact your system admin</a>
          </p>
        </div>
      </div>
    </div>
  )
}
