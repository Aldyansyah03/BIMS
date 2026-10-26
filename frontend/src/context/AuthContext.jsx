import { createContext, useState, useEffect } from 'react'
import { mockLogin } from '../mock/auth'
// Nanti ganti dengan:
// import api from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cek localStorage saat app pertama dibuka
  // Supaya user tidak perlu login ulang setiap refresh halaman
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // Pakai mock dulu
    const data = await mockLogin(email, password)
    // Nanti ganti dengan:
    // const { data } = await api.post('/auth/login', { email, password })

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
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
