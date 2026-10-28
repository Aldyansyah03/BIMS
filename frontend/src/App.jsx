import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'

import Login from './pages/Login'
import Main from './pages/Main'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import AdminClasses from './pages/AdminClasses'
import TutorClass from './pages/TutorClass'
import StudentHome from './pages/StudentHome'
import Exam from './pages/Exam'
import Result from './pages/Result'
import SuperAdmin from './pages/SuperAdmin'

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
      <Route path="/" element={<Main />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Super Admin */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdmin />
          </ProtectedRoute>
        }
      />

      {/* Admin Bimbel */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin_bimbel']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/classes"
        element={
          <ProtectedRoute allowedRoles={['admin_bimbel']}>
            <AdminClasses />
          </ProtectedRoute>
        }
      />

      {/* Tutor */}
      <Route
        path="/tutor"
        element={
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorClass />
          </ProtectedRoute>
        }
      />

      {/* Student */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/exam"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Exam />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/result"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Result />
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
