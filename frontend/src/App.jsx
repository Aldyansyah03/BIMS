import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'

import Login from './pages/Login'

// Placeholder pages — akan dibuat di feature branch berikutnya
const Placeholder = ({ name }) => (
  <div className="min-h-screen flex items-center justify-center flex-col gap-3">
    <span className="text-4xl font-extrabold text-[#C8102E]">BIMS</span>
    <span className="text-[#4A4A55]">Halaman {name} — coming soon</span>
  </div>
)

// Protected route — redirect ke login kalau belum login
// Redirect ke forbidden kalau role tidak sesuai
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[#C8102E] font-bold">Memuat...</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Placeholder name="Landing Page" />} />
      <Route path="/login" element={<Login />} />

      {/* Super Admin */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <Placeholder name="Super Admin" />
          </ProtectedRoute>
        }
      />

      {/* Admin Bimbel */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin_bimbel']}>
            <Placeholder name="Admin Dashboard" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/classes"
        element={
          <ProtectedRoute allowedRoles={['admin_bimbel']}>
            <Placeholder name="Admin Classes" />
          </ProtectedRoute>
        }
      />

      {/* Tutor */}
      <Route
        path="/tutor"
        element={
          <ProtectedRoute allowedRoles={['tutor']}>
            <Placeholder name="Tutor" />
          </ProtectedRoute>
        }
      />

      {/* Student */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Placeholder name="Student Home" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/exam"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Placeholder name="Exam" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/result"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Placeholder name="Result" />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="/forbidden" element={<Placeholder name="403 - Akses Ditolak" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
