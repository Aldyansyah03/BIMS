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
import WorkspaceStatus from './pages/WorkspaceStatus'
import Invoices from './pages/Invoices'
import InvoicesAdmin from './pages/InvoicesAdmin'
import Packages from './pages/Packages'

// ── Role → home page mapping ──────────────────────────────────────────────────
const ROLE_HOME = {
  super_admin:  '/super-admin',
  admin_bimbel: '/admin/dashboard',
  tutor:        '/tutor',
  student:      '/student',
}

// ── Shared loading screen ─────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F6FA]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#0D47A1] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#4A4A55] font-semibold text-sm">Memuat…</span>
      </div>
    </div>
  )
}

// ── 403 page ──────────────────────────────────────────────────────────────────
function Forbidden() {
  const { user } = useAuth()
  const home = user ? (ROLE_HOME[user.role] ?? '/') : '/'
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
      <span className="text-5xl font-extrabold text-[#C8102E]">403</span>
      <span className="text-[#4A4A55] font-semibold">Akses ditolak</span>
      <a href={home} className="text-[#0D47A1] font-bold no-underline hover:underline text-sm">
        Kembali ke beranda
      </a>
    </div>
  )
}

// ── GuestRoute: redirect ke dashboard kalau sudah login ───────────────────────
function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) {
    const dest = ROLE_HOME[user.role] ?? '/'
    return <Navigate to={dest} replace />
  }
  return children
}

// ── ProtectedRoute: redirect ke login kalau belum login ───────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Workspace non-active statuses redirect ke workspace-status
    if (['pending', 'expired', 'rejected'].includes(user.workspace_status)) {
      return <Navigate to="/workspace-status" replace />
    }
    return <Navigate to="/forbidden" replace />
  }

  return children
}

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Main />} />
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Super Admin */}
      <Route path="/super-admin"          element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdmin /></ProtectedRoute>} />
      <Route path="/super-admin/invoices" element={<ProtectedRoute allowedRoles={['super_admin']}><InvoicesAdmin /></ProtectedRoute>} />
      <Route path="/super-admin/packages" element={<ProtectedRoute allowedRoles={['super_admin']}><Packages /></ProtectedRoute>} />

      {/* Admin Bimbel */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin_bimbel']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/classes"   element={<ProtectedRoute allowedRoles={['admin_bimbel']}><AdminClasses /></ProtectedRoute>} />
      <Route path="/admin/invoices"  element={<ProtectedRoute allowedRoles={['admin_bimbel']}><Invoices /></ProtectedRoute>} />

      {/* Tutor */}
      <Route path="/tutor" element={<ProtectedRoute allowedRoles={['tutor']}><TutorClass /></ProtectedRoute>} />

      {/* Student */}
      <Route path="/student"        element={<ProtectedRoute allowedRoles={['student']}><StudentHome /></ProtectedRoute>} />
      <Route path="/student/exam"   element={<ProtectedRoute allowedRoles={['student']}><Exam /></ProtectedRoute>} />
      <Route path="/student/result" element={<ProtectedRoute allowedRoles={['student']}><Result /></ProtectedRoute>} />

      {/* Workspace status — accessible tanpa login (pending/expired tenants) */}
      <Route path="/workspace-status" element={<WorkspaceStatus />} />

      {/* Fallback */}
      <Route path="/forbidden" element={<Forbidden />} />
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
