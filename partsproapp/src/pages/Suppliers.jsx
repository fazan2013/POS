// ================================================
// src/pages/Suppliers.jsx  — connected to real API
// ================================================
import { useState, useEffect, useCallback } from 'react'
import {
  IconSearch, IconPlus, IconDownload, IconEdit,
  IconTrash, IconX, IconCheck, IconPhone, IconMail,
  IconMapPin, IconChevronLeft, IconChevronRight,
  IconAlertTriangle, IconEye, IconBuildingStore,
  IconCash, IconTruck, IconPackage, IconRefresh
} from '@tabler/icons-react'
import { suppliersApi } from '../services/api'
import { ErrorBanner, Spinner } from '../hooks/useApi'

const STATUSES  = ['All', 'Active', 'Inactive']
const PAGE_SIZE = 10
const CATEGORIES = ['Engine & Filters','Brakes & Suspension','Electrical','Engine','Filters & Cooling','Multi-category']
const PAY_TERMS  = ['COD','Net 15','Net 30','Net 45','Net 60']

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={`text-sm ${s<=rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  )
}

function SupplierModal({ supplier, onClose, onSave }) {
  const isEdit = !!supplier?.id
  const [form, setForm]   = useState(supplier || {
    name:'', contactPerson:'', phone:'', email:'', address:'',
    category:'', paymentTerms:'Net 30', status:'Active', notes:''
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  function set(k,v) { setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:null})) }

  async function handleSave() {
    const e = {}
    if (!form.name.trim())          e.name          = 'Required'
    if (!form.contactPerson.trim()) e.contactPerson = 'Required'
    if (!form.phone.trim())         e.phone         = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try { await onSave(form) } catch (err) { setErrors({ name: err.message }) }
    finally { setSaving(false) }
  }

  function Field({ label, required, error, children }) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><IconAlertTriangle size={10}/>{error}</p>}
      </div>
    )
  }

  const inputClass = (field) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none
     ${errors[field] ? 'border-red-300' : 'border-gray-200 focus:border-blue-400'}`

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{isEdit ? 'Edit supplier' : 'Add supplier'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? supplier.id : 'New supplier'}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400"><IconX size={14}/></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <Field label="Company name" required error={errors.name}>
            <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. AutoParts Lanka Pvt Ltd" className={inputClass('name')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact person" required error={errors.contactPerson}>
              <input value={form.contactPerson} onChange={e=>set('contactPerson',e.target.value)} placeholder="e.g. Roshan Perera" className={inputClass('contactPerson')} />
            </Field>
            <Field label="Phone" required error={errors.phone}>
              <input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+94 11 234 5678" className={inputClass('phone')} />
            </Field>
          </div>
          <Field label="Email">
            <input type="email" value={form.email||''} onChange={e=>set('email',e.target.value)} placeholder="supplier@company.lk" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
          </Field>
          <Field label="Address">
            <input value={form.address||''} onChange={e=>set('address',e.target.value)} placeholder="Street, City" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select value={form.category||''} onChange={e=>set('category',e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="">Select category</option>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Payment terms">
              <select value={form.paymentTerms} onChange={e=>set('paymentTerms',e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">
                {PAY_TERMS.map(t=><option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Status">
            <div className="flex gap-3">
              {['Active','Inactive'].map(s=>(
                <button key={s} type="button" onClick={()=>set('status',s)}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all
                          ${form.status===s
                            ? s==='Active' ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-600'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Notes">
            <textarea value={form.notes||''} onChange={e=>set('notes',e.target.value)} rows={2} placeholder="Any notes about this supplier…"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-none" />
          </Field>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
          <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Spinner size="sm"/> : <IconCheck size={14}/>}
            {isEdit ? 'Save changes' : 'Add supplier'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ supplier, onClose, onEdit }) {
  if (!supplier) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="bg-slate-900 px-6 py-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-base font-medium text-white">{supplier.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{supplier.id}</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white"><IconX size={14}/></button>
          </div>
          <Stars rating={supplier.rating} />
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2.5">
            {[
              { icon: <IconBuildingStore size={14}/>, text: supplier.contactPerson },
              { icon: <IconPhone size={14}/>,         text: supplier.phone         },
              { icon: <IconMail size={14}/>,          text: supplier.email || '—'  },
              { icon: <IconMapPin size={14}/>,        text: supplier.address || '—'},
            ].map((r,i)=>(
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-gray-400">{r.icon}</span>
                <span className="text-sm text-gray-700">{r.text}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[
              { label: 'Category',      value: supplier.category || '—'     },
              { label: 'Payment terms', value: supplier.paymentTerms         },
              { label: 'Status',        value: supplier.status, color: supplier.status==='Active' ? 'text-green-600' : 'text-red-500' },
              { label: 'Member since',  value: new Date(supplier.createdAt).toLocaleDateString() },
            ].map(d=>(
              <div key={d.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{d.label}</span>
                <span className={`text-xs font-medium ${d.color || 'text-gray-800'}`}>{d.value}</span>
              </div>
            ))}
          </div>
          {supplier.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-xs text-gray-700 leading-relaxed">{supplier.notes}</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Close</button>
          <button onClick={()=>{onClose();onEdit(supplier)}}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 flex items-center justify-center gap-2">
            <IconEdit size={14}/> Edit supplier
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Suppliers() {
  const [data,         setData]         = useState({ data: [], totalCount: 0, totalPages: 1 })
  const [stats,        setStats]        = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [activeStatus, setActiveStatus] = useState('All')
  const [page,         setPage]         = useState(1)
  const [showForm,     setShowForm]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [viewTarget,   setViewTarget]   = useState(null)
  const [deleting,     setDeleting]     = useState(null)
  const [toast,        setToast]        = useState(null)

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(null),2500) }

  const fetchSuppliers = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [res, st] = await Promise.all([
        suppliersApi.getAll(page, PAGE_SIZE, search, activeStatus==='All'?'':activeStatus),
        suppliersApi.getStats(),
      ])
      setData(res); setStats(st)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [page, search, activeStatus])

  useEffect(()=>{ fetchSuppliers() },[fetchSuppliers])
  useEffect(()=>{ setPage(1) },[search, activeStatus])

  async function handleSave(form) {
    try {
      if (editTarget) { await suppliersApi.update(editTarget.id,form); showToast('Supplier updated') }
      else            { await suppliersApi.create(form);               showToast('Supplier added')   }
      setShowForm(false); setEditTarget(null); fetchSuppliers()
    } catch (err) { throw err }
  }

  async function handleDelete(supplier) {
    if (!confirm(`Remove "${supplier.name}"?`)) return
    setDeleting(supplier.id)
    try { await suppliersApi.delete(supplier.id); showToast('Supplier removed'); fetchSuppliers() }
    catch (err) { setError(err.message) }
    finally { setDeleting(null) }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <IconCheck size={14}/>{toast}
        </div>
      )}
      {showForm && <SupplierModal supplier={editTarget} onClose={()=>{setShowForm(false);setEditTarget(null)}} onSave={handleSave}/>}
      {viewTarget && <DetailModal supplier={viewTarget} onClose={()=>setViewTarget(null)} onEdit={s=>{setEditTarget(s);setShowForm(true)}}/>}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Suppliers</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage your parts suppliers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSuppliers} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-gray-300 bg-white"><IconRefresh size={14}/></button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-600 hover:border-gray-300"><IconDownload size={13}/> Export</button>
          <button onClick={()=>{setEditTarget(null);setShowForm(true)}} className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-700"><IconPlus size={13}/> Add supplier</button>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={()=>setError(null)}/>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label:'Total',    value:stats.total,    color:'text-gray-900'   },
            { label:'Active',   value:stats.active,   color:'text-green-600'  },
            { label:'Inactive', value:stats.inactive, color:'text-red-500'    },
          ].map(c=>(
            <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{c.label}</p>
              <p className={`text-xl font-medium ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-44">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder="Search supplier, contact…"
                   value={search} onChange={e=>setSearch(e.target.value)}
                   className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 bg-gray-50"/>
          </div>
          <div className="flex gap-1.5">
            {STATUSES.map(s=>(
              <button key={s} onClick={()=>setActiveStatus(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${activeStatus===s ? 'bg-slate-900 text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-[1.8fr_1.5fr_1.2fr_1fr_0.8fr_0.8fr]
                        px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          {['Supplier','Contact','Category','Payment','Status','Actions'].map(h=>(
            <p key={h} className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg"/></div>
        ) : data.data.length===0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <IconBuildingStore size={32} className="text-gray-200"/>
            <p className="text-sm">No suppliers found</p>
          </div>
        ) : data.data.map(sup=>(
          <div key={sup.id}
               className="grid grid-cols-1 md:grid-cols-[1.8fr_1.5fr_1.2fr_1fr_0.8fr_0.8fr]
                          px-4 py-3.5 border-b border-gray-50 last:border-0
                          hover:bg-gray-50 transition-colors items-center gap-2 md:gap-0">
            <div>
              <p className="text-xs font-medium text-gray-900">{sup.name}</p>
              <Stars rating={sup.rating}/>
            </div>
            <div>
              <p className="text-xs text-gray-700">{sup.contactPerson}</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><IconPhone size={9}/>{sup.phone}</p>
            </div>
            <p className="text-xs text-gray-600">{sup.category || '—'}</p>
            <p className="text-xs text-gray-600">{sup.paymentTerms}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium w-fit
              ${sup.status==='Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sup.status==='Active'?'bg-green-500':'bg-red-400'}`}/>
              {sup.status}
            </span>
            <div className="flex gap-1.5">
              <button onClick={()=>setViewTarget(sup)} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:border-blue-300 hover:text-blue-500"><IconEye size={13}/></button>
              <button onClick={()=>{setEditTarget(sup);setShowForm(true)}} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:border-gray-300"><IconEdit size={13}/></button>
              <button onClick={()=>handleDelete(sup)} disabled={deleting===sup.id} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:border-red-300 hover:text-red-500">
                {deleting===sup.id?<Spinner size="sm"/>:<IconTrash size={13}/>}
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">{data.totalCount} suppliers</p>
          <div className="flex gap-1">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 disabled:opacity-40"><IconChevronLeft size={13}/></button>
            {Array.from({length:data.totalPages},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)} className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs ${page===p?'bg-slate-900 text-white':'border border-gray-200 text-gray-500'}`}>{p}</button>
            ))}
            <button onClick={()=>setPage(p=>Math.min(data.totalPages,p+1))} disabled={page===data.totalPages} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 disabled:opacity-40"><IconChevronRight size={13}/></button>
          </div>
        </div>
      </div>
    </div>
  )
}
