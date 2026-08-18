import { useEffect, useState } from 'react'
import { appearanceApi } from '../services/api'
 
const DEFAULTS = {
  theme:    'light',
  accent:   '#0f172a',
  density:  'comfortable',
  fontSize: 'medium',
}
 
// Storage key for localStorage cache
const STORAGE_KEY = 'pp_appearance'
 
export function useAppearance() {
  const [appearance, setAppearance] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      return cached ? JSON.parse(cached) : DEFAULTS
    } catch {
      return DEFAULTS
    }
  })
 
  // Apply CSS variables to :root whenever appearance changes
  useEffect(() => {
    const root = document.documentElement
 
    // Theme
    root.setAttribute('data-theme', appearance.theme)
    if (appearance.theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
 
    // Accent color
    root.style.setProperty('--color-accent', appearance.accent)
 
    // Font size
    const fontSizeMap = { small: '13px', medium: '14px', large: '15px' }
    root.style.setProperty('--font-size-base',
      fontSizeMap[appearance.fontSize] || '14px')
 
    // Density (row padding)
    const densityMap = {
      compact:     '8px',
      comfortable: '14px',
      spacious:    '20px'
    }
    root.style.setProperty('--row-padding',
      densityMap[appearance.density] || '14px')
 
    // Cache to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance))
  }, [appearance])
 
  // Load from API on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await appearanceApi.get()
        const merged = {
          theme:    data.theme    || DEFAULTS.theme,
          accent:   data.accent   || DEFAULTS.accent,
          density:  data.density  || DEFAULTS.density,
          fontSize: data.fontSize || DEFAULTS.fontSize,
        }
        setAppearance(merged)
      } catch {
        // Silently use cached/default values
      }
    }
    // Only load if user is logged in
    if (localStorage.getItem('pp_token')) {
      load()
    }
  }, [])
 
  return { appearance, setAppearance }
}