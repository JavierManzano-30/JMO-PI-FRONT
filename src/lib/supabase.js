import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

const memoryStorage = new Map()
let warnedStorageFallback = false

const isNoSpaceError = (error) => {
  if (!error) return false

  return (
    error.name === 'QuotaExceededError' ||
    error.code === 22 ||
    error.code === 1014 ||
    String(error.message || '').includes('FILE_ERROR_NO_SPACE') ||
    String(error.message || '').toLowerCase().includes('quota') ||
    String(error.message || '').toLowerCase().includes('no space')
  )
}

const warnStorageFallback = (error) => {
  if (warnedStorageFallback || !isNoSpaceError(error)) return
  warnedStorageFallback = true
  console.warn(
    'No se puede persistir la sesion en localStorage (espacio insuficiente). Se usara almacenamiento temporal en memoria para esta pestaña.'
  )
}

const safeStorage = {
  getItem(key) {
    try {
      if (typeof window !== 'undefined') {
        const localValue = window.localStorage.getItem(key)
        if (localValue !== null) {
          return localValue
        }
      }
    } catch (error) {
      warnStorageFallback(error)
    }

    return memoryStorage.get(key) ?? null
  },

  setItem(key, value) {
    const normalizedValue = String(value)
    memoryStorage.set(key, normalizedValue)

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, normalizedValue)
      }
    } catch (error) {
      warnStorageFallback(error)
    }
  },

  removeItem(key) {
    memoryStorage.delete(key)

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      warnStorageFallback(error)
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: safeStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
