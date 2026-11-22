import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
})

// Setiap request, otomatis sisipkan token kalau ada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Kalau BE return 401, otomatis logout (kecuali di halaman registrasi / login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/register') &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/verify-email')
      ) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Resolusi URL gambar/logo (Supabase Storage / local storage / relative path)
export const getImageUrl = (path) => {
  if (!path) return null
  if (
    typeof path !== 'string' ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
  const backendBase = apiBase.replace(/\/api\/?$/, '')
  let cleanPath = path.startsWith('/') ? path : `/${path}`
  if (!cleanPath.startsWith('/storage/')) {
    cleanPath = `/storage${cleanPath}`
  }
  return `${backendBase}${cleanPath}`
}

export default api
