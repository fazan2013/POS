
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5098/api'

// ── Token helpers ─────────────────────────────────
export const getToken    = ()  => localStorage.getItem('pp_token')
export const getUser     = ()  => JSON.parse(localStorage.getItem('pp_user') || '{}')
export const isLoggedIn  = ()  => !!getToken()

export function saveSession(data) {
  localStorage.setItem('pp_token', data.token)
  localStorage.setItem('pp_user', JSON.stringify({
    fullName:  data.fullName,
    email:     data.email,
    role:      data.role,
    expiresAt: data.expiresAt,
  }))
}

export function clearSession() {
  localStorage.removeItem('pp_token')
  localStorage.removeItem('pp_user')
}

// ── Base request ──────────────────────────────────
async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token   = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Auto logout on 401
  if (res.status === 401) {
    clearSession()
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }

  // Parse error body
  if (!res.ok) {
    let msg = `Error ${res.status}`
    try { const j = await res.json(); msg = j.message || msg } catch {}
    throw new Error(msg)
  }

  if (res.status === 204) return null
  return res.json()
}

const get    = (path)        => req('GET',    path)
const post   = (path, body)  => req('POST',   path, body)
const put    = (path, body)  => req('PUT',    path, body)
const patch  = (path, body)  => req('PATCH',  path, body)
const del    = (path)        => req('DELETE', path)

// ─────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────
export const authApi = {
  login:    body => post('/auth/login',    body),
  register: body => post('/auth/register', body),
}

// ─────────────────────────────────────────────────
// PARTS
// ─────────────────────────────────────────────────
export const partsApi = {
  getAll: (page = 1, pageSize = 10, search = '', category = '') =>
    get(`/parts?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`),
  getById:     id         => get(`/parts/${id}`),
  create:      body       => post('/parts', body),
  update:      (id, body) => put(`/parts/${id}`, body),
  delete:      id         => del(`/parts/${id}`),
  getLowStock: ()         => get('/parts/low-stock'),
  getDashboard:()         => get('/parts/dashboard'),
}

// ─────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────
export const ordersApi = {
  getAll: (page = 1, pageSize = 10, status = '') =>
    get(`/orders?page=${page}&pageSize=${pageSize}&status=${encodeURIComponent(status)}`),
  getById:      id             => get(`/orders/${id}`),
  create:       body           => post('/orders', body),
  updateStatus: (id, status)   => patch(`/orders/${id}/status`, { status }),
  getSummary:   ()             => get('/orders/summary'),
}

// ─────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────
export const customersApi = {
  getAll: (page = 1, pageSize = 10, search = '', type = '', status = '') =>
    get(`/customers?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}&type=${encodeURIComponent(type)}&status=${encodeURIComponent(status)}`),
  getById:  id         => get(`/customers/${id}`),
  create:   body       => post('/customers', body),
  update:   (id, body) => put(`/customers/${id}`, body),
  delete:   id         => del(`/customers/${id}`),
  getTop:   (n = 5)    => get(`/customers/top?count=${n}`),
  getStats: ()         => get('/customers/stats'),
}

// ─────────────────────────────────────────────────
// SUPPLIERS
// ─────────────────────────────────────────────────
export const suppliersApi = {
  getAll: (page = 1, pageSize = 10, search = '', status = '') =>
    get(`/suppliers?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`),
  getById:  id         => get(`/suppliers/${id}`),
  create:   body       => post('/suppliers', body),
  update:   (id, body) => put(`/suppliers/${id}`, body),
  delete:   id         => del(`/suppliers/${id}`),
  getStats: ()         => get('/suppliers/stats'),
}
