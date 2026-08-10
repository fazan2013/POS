// ================================================
// src/hooks/useApi.js
// Reusable hook for API calls with loading/error state
// ================================================
import { useState, useCallback } from 'react'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const call = useCallback(async (apiFn, ...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn(...args)
      return result
    } catch (err) {
      setError(err.message || 'Something went wrong')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, call }
}

// ── Shared error banner ───────────────────────────
export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3
                    bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
      <span>⚠️ {message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
      )}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
  return (
    <div className={`${s} border-2 border-gray-200 border-t-slate-700
                    rounded-full animate-spin`} />
  )
}

// ── Full-page loader ──────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )
}
