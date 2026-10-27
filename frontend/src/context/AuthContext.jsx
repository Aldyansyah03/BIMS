import { createContext, useState, useEffect } from 'react'
import api from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cek localStorage saat app pertama dibuka
  // Kalau ada token, fetch /api/me untuk validasi token masih valid
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      api.get('/me')
        .then((res) => {
          if (res.data.success) {
            const userData = res.data.data
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))
          } else {
            // Token tidak valid
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        })
        .catch(() => {
          // Token expired atau BE error
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/login', { email, password })
    const result = response.data

    if (!result.success) {
      throw new Error(result.message || 'Login gagal.')
    }

    const { token } = result.data

    // Simpan token
    localStorage.setItem('token', token)

    // Fetch /api/me untuk data lengkap (termasuk tenant)
    const meRes = await api.get('/me')
    const userData = meRes.data.data

    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch (e) {
      // tetap logout meski API error
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
