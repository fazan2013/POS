
const BASE_URL = 'http://localhost:5098/api'

//import.meta.env.VITE_API_URL || 
// ── Token helpers ─────────────────────────────────
export const getToken    = ()  => localStorage.getItem('pp_token')
//export const getUser     = ()  => JSON.parse(localStorage.getItem('pp_user') || '{}')
export const isLoggedIn  = ()  => !!getToken()

let _currencySymbol = 'Rs.'
export function setCurrency(symbol) { _currencySymbol = symbol || 'Rs.' }
export function getCurrency()       { return _currencySymbol }
export function fmt(value) {
  const num = isNaN(Number(value)) ? 0 : Number(value)
  return `${_currencySymbol} ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`
}

export function getUser() {
  try {
    const raw = localStorage.getItem('pp_user')
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function saveSession(data) {
  localStorage.setItem('pp_token', data.token)
  localStorage.setItem('pp_user', JSON.stringify({
    fullName:     data.fullName,
    email:        data.email,
    role:         data.role,
    profileImage: data.profileImage || null,  // ← from login response
    expiresAt:    data.expiresAt,
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
/*
export const profileApi = {
  // GET /api/auth/me
  getMe: () => get('/auth/me'),
 
  // PUT /api/auth/profile
  updateProfile: body => put('/auth/profile', body),
 
  // POST /api/auth/profile/image  — upload base64 image
  uploadImage: body => post('/auth/profile/image', body),
 
  // DELETE /api/auth/profile/image — remove image
  removeImage: () => del('/auth/profile/image'),
 
  // POST /api/auth/change-password
  changePassword: body => post('/auth/change-password', body),
}*/
export const profileApi = {
 
  get: () => get('/auth/me'),
 
  updateProfile: async (body) => {
    const res = await put('/auth/profile', body)
    // Update localStorage so Layout reflects immediately
    const current = JSON.parse(localStorage.getItem('pp_user') || '{}')
    localStorage.setItem('pp_user', JSON.stringify({
      ...current,
      fullName: res.profile?.fullName || current.fullName,
      email:    res.profile?.email    || current.email,
    }))
    return res
  },
 
  uploadImage: async (body) => {
    const res = await post('/auth/profile/image', body)
    // Save image to localStorage so Layout updates instantly
    const current = JSON.parse(localStorage.getItem('pp_user') || '{}')
    localStorage.setItem('pp_user', JSON.stringify({
      ...current,
      profileImage: res.profileImage || null,
    }))
    return res
  },
 
  removeImage: async () => {
    const res = await del('/auth/profile/image')
    // Clear image from localStorage
    const current = JSON.parse(localStorage.getItem('pp_user') || '{}')
    localStorage.setItem('pp_user', JSON.stringify({
      ...current,
      profileImage: null,
    }))
    return res
  },
 
  changePassword: (body) => post('/auth/change-password', body),
}

export const storeApi = {
  get:    ()     => get('/settings/store'),
  update: body   => put('/settings/store', body),
}
export const receiptApi = {
  get:    ()   => get('/settings/receipt'),
  update: body => put('/settings/receipt', body),
}

export const notifApi = {
  get:    ()     => get('/settings/notifications'),
  update: body   => put('/settings/notifications', body),
}
export const appearanceApi = {
  get:    ()     => get('/settings/appearance'),
  update: body   => put('/settings/appearance', body),
}

export const exportApi = {
  // Get record counts summary
  getSummary: () => get('/export/summary'),
 
  // Download CSV files — uses direct fetch with blob
  downloadInventory: () => downloadFile('/export/inventory', 'inventory.csv'),
  downloadOrders:    () => downloadFile('/export/orders',    'orders.csv'),
  downloadCustomers: () => downloadFile('/export/customers', 'customers.csv'),
  downloadSuppliers: () => downloadFile('/export/suppliers', 'suppliers.csv'),
  downloadBackup:    () => downloadFile('/export/full-backup', 'partsproapp_backup.json'),
}

export const categoriesApi = {
  getAll:  ()          => get('/categories'),
  getById: (id)        => get(`/categories/${id}`),
  create:  (body)      => post('/categories', body),
  update:  (id, body)  => put(`/categories/${id}`, body),
  delete:  (id)        => del(`/categories/${id}`),
}
 
export const brandsApi = {
  getAll:  ()          => get('/brands'),
  getById: (id)        => get(`/brands/${id}`),
  create:  (body)      => post('/brands', body),
  update:  (id, body)  => put(`/brands/${id}`, body),
  delete:  (id)        => del(`/brands/${id}`),
}


export const usersApi = {
  getAll:        (role = '', isActive) =>
    get(`/users?${role ? `role=${role}&` : ''}${isActive !== undefined ? `isActive=${isActive}` : ''}`),
 
  getById:       (id)   => get(`/users/${id}`),
  create:        (body) => post('/users', body),
  update:        (id, body) => put(`/users/${id}`, body),
  toggle:        (id)   => patch(`/users/${id}/toggle`),
  resetPassword: (id, body) => post(`/users/${id}/reset-password`, body),
  delete:        (id)   => del(`/users/${id}`),
}

async function downloadFile(path, defaultFileName) {
  const token = getToken()
 
  const res = await fetch(`${BASE_URL}${path}`, {
    method:  'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
 
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'Download failed')
  }
 
  // Get filename from Content-Disposition header if present
  const disposition = res.headers.get('Content-Disposition')
  let fileName = defaultFileName
  if (disposition) {
    const match = disposition.match(/filename="?([^";\n]+)"?/)
    if (match) fileName = match[1]
  }
 
  // Convert response to blob and trigger browser download
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
 
  return fileName
}

export const purchaseApi = {
  // List
  getAll:    (page = 1, pageSize = 10, status = '', supplierId = null) =>
    get(`/purchase-orders?page=${page}&pageSize=${pageSize}` +
        `${status ? `&status=${status}` : ''}` +
        `${supplierId ? `&supplierId=${supplierId}` : ''}`),

  getSummary: () => get('/purchase-orders/summary'),
  getById:    (id) => get(`/purchase-orders/${id}`),

  // CRUD
  create: (body)     => post('/purchase-orders', body),
  update: (id, body) => put(`/purchase-orders/${id}`, body),

  // Status transitions
  approve: (id) => patch(`/purchase-orders/${id}/approve`),
  send:    (id) => patch(`/purchase-orders/${id}/send`),
  cancel:  (id) => patch(`/purchase-orders/${id}/cancel`),
}

export const grnApi = {
  getAll:  (page = 1, pageSize = 10, purchaseOrderId = null) =>
    get(`/grn?page=${page}&pageSize=${pageSize}` +
        `${purchaseOrderId ? `&purchaseOrderId=${purchaseOrderId}` : ''}`),

  getById: (id)   => get(`/grn/${id}`),
  create:  (body) => post('/grn', body),
}

export const invoiceApi = {
  getAll:       (page = 1, pageSize = 10, status = '') =>
    get(`/supplier-invoices?page=${page}&pageSize=${pageSize}` +
        `${status ? `&status=${status}` : ''}`),

  getById:      (id)       => get(`/supplier-invoices/${id}`),
  create:       (body)     => post('/supplier-invoices', body),
  updateStatus: (id, body) => patch(`/supplier-invoices/${id}/status`, body),
}


