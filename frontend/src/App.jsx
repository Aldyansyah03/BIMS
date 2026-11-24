import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'

import Login from './pages/Login'
import Main from './pages/Main'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Payment from './pages/Payment'
import CompleteProfile from './pages/CompleteProfile'
import AdminDashboard from './pages/AdminDashboard'
import AdminClasses from './pages/AdminClasses'
import AdminUsers from './pages/AdminUsers'
import AdminProfile from './pages/AdminProfile'
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
  const slug = user?.tenant?.slug || (user?.tenant?.name ? user.tenant.name.toLowerCase().replace(/\s+/g, '-') : '')
  const home = user ? (user.role === 'admin_bimbel' ? (slug ? `/${slug}/admin/dashboard` : '/admin/dashboard') : (ROLE_HOME[user.role] ?? '/')) : '/'
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
      <span className="text-5xl font-extrabold text-[#C8102E]">403</span>
      <span className="text-[#4A4A55] font-semibold">Akses ditolak</span>
      <p className="text-sm text-[#5F6368] m-0">Halaman ini bukan milik bimbel Anda atau peran Anda tidak berwenang.</p>
      <a href={home} className="text-[#0D47A1] font-bold no-underline hover:underline text-sm">
        Kembali ke beranda ruang kerja
      </a>
    </div>
  )
}

// ── GuestRoute: redirect ke dashboard/onboarding kalau sudah login ────────────
function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) {
    // Jika masih dalam alur onboarding
    if (user.role === 'admin_bimbel' && user.onboarding_completed === false) {
      if (user.onboarding_step === 'verify_email') return <Navigate to="/verify-email" replace />
      if (user.onboarding_step === 'payment') return <Navigate to="/payment" replace />
      if (user.onboarding_step === 'complete_profile') return <Navigate to="/complete-profile" replace />
    }

    const status = (user.tenant?.status || user.workspace_status || '').toLowerCase()
    if (user.role !== 'super_admin' && (status === 'menunggu' || status === 'pending')) {
      return <Navigate to="/workspace-status" replace />
    }
    if (user.role === 'admin_bimbel') {
      const slug = user.tenant?.slug || (user.tenant?.name ? user.tenant.name.toLowerCase().replace(/\s+/g, '-') : '')
      return <Navigate to={slug ? `/${slug}/admin/dashboard` : '/admin/dashboard'} replace />
    }
    const dest = ROLE_HOME[user.role] ?? '/'
    return <Navigate to={dest} replace />
  }
  return children
}

// ── ProtectedRoute: redirect ke login kalau belum login ───────────────────────
function ProtectedRoute({ children, allowedRoles, allowPending = false }) {
  const { user, loading } = useAuth()
  const params = useParams()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  // Jika admin_bimbel belum selesai onboarding, arahkan ke tahapan yang sesuai
  if (user.role === 'admin_bimbel' && user.onboarding_completed === false) {
    if (user.onboarding_step === 'verify_email') return <Navigate to="/verify-email" replace />
    if (user.onboarding_step === 'payment') return <Navigate to="/payment" replace />
    if (user.onboarding_step === 'complete_profile') return <Navigate to="/complete-profile" replace />
  }

  // Validasi status ruang kerja
  const status = (user.tenant?.status || user.workspace_status || '').toLowerCase()
  const isPending = user.role !== 'super_admin' && (status === 'menunggu' || status === 'pending')

  if (isPending && !allowPending) {
    return <Navigate to="/workspace-status" replace />
  }

  if (!isPending && allowPending && (status === 'aktif' || status === 'active')) {
    const slug = user.tenant?.slug || (user.tenant?.name ? user.tenant.name.toLowerCase().replace(/\s+/g, '-') : '')
    const dest = user.role === 'admin_bimbel' ? (slug ? `/${slug}/admin/dashboard` : '/admin/dashboard') : (ROLE_HOME[user.role] ?? '/')
    return <Navigate to={dest} replace />
  }

  // Cek otorisasi peran
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  // Isolasi Tenant (ER-2.2): Pastikan slug URL cocok dengan tenant pengguna yang login
  if (params.slug && user.role === 'admin_bimbel') {
    const userSlug = user.tenant?.slug || (user.tenant?.name ? user.tenant.name.toLowerCase().replace(/\s+/g, '-') : '')
    if (userSlug && params.slug.toLowerCase() !== userSlug.toLowerCase()) {
      return <Navigate to="/forbidden" replace />
    }
  }

  return children
}

// ── OnboardingRoute: Khusus melindungi langkah onboarding ────────────────────
function OnboardingRoute({ children, requiredStep }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />

  // Jika onboarding sudah selesai, arahkan ke dashboard
  if (user?.onboarding_completed === true) {
    const slug = user.tenant?.slug || (user.tenant?.name ? user.tenant.name.toLowerCase().replace(/\s+/g, '-') : '')
    return <Navigate to={slug ? `/${slug}/admin/dashboard` : '/admin/dashboard'} replace />
  }

  // Jika belum login pada tahap payment atau complete-profile, arahkan ke login/register
  if (!user && (requiredStep === 'payment' || requiredStep === 'complete_profile')) {
    return <Navigate to="/login" replace />
  }

  // Jika step belum sesuai
  if (user && requiredStep === 'payment' && !user.email_verified_at) {
    return <Navigate to="/verify-email" replace />
  }
  if (user && requiredStep === 'verify_email' && user.email_verified_at) {
    return <Navigate to={user.onboarding_step === 'complete_profile' ? '/complete-profile' : '/payment'} replace />
  }

  return children
}

// ── AdminSlugRedirect: Redirect URL tanpa slug /admin/... ke /:slug/admin/... ──
function AdminSlugRedirect({ path = 'dashboard' }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin_bimbel') return <Navigate to="/forbidden" replace />

  // Jika user masih onboarding
  if (user.onboarding_completed === false) {
    if (user.onboarding_step === 'verify_email') return <Navigate to="/verify-email" replace />
    if (user.onboarding_step === 'payment') return <Navigate to="/payment" replace />
    if (user.onboarding_step === 'complete_profile') return <Navigate to="/complete-profile" replace />
  }

  const slug = user.tenant?.slug || (user.tenant?.name ? user.tenant.name.toLowerCase().replace(/\s+/g, '-') : '')
  return <Navigate to={slug ? `/${slug}/admin/${path}` : `/admin/${path}`} replace />
}

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Main />} />
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Alur Onboarding Pengguna BIMS (Langkah 2, 3, 4) */}
      <Route path="/verify-email" element={<OnboardingRoute requiredStep="verify_email"><VerifyEmail /></OnboardingRoute>} />
      <Route path="/payment" element={<OnboardingRoute requiredStep="payment"><Payment /></OnboardingRoute>} />
      <Route path="/complete-profile" element={<OnboardingRoute requiredStep="complete_profile"><CompleteProfile /></OnboardingRoute>} />

      {/* Super Admin */}
      <Route path="/super-admin"          element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdmin /></ProtectedRoute>} />
      <Route path="/super-admin/invoices" element={<ProtectedRoute allowedRoles={['super_admin']}><InvoicesAdmin /></ProtectedRoute>} />
      <Route path="/super-admin/packages" element={<ProtectedRoute allowedRoles={['super_admin']}><Packages /></ProtectedRoute>} />

      {/* Admin Bimbel dengan Slug URL (Aktif: /:slug/admin/...) */}
      <Route path="/:slug/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin_bimbel']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/:slug/admin/classes"   element={<ProtectedRoute allowedRoles={['admin_bimbel']}><AdminClasses /></ProtectedRoute>} />
      <Route path="/:slug/admin/users"     element={<ProtectedRoute allowedRoles={['admin_bimbel']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/:slug/admin/invoices"  element={<ProtectedRoute allowedRoles={['admin_bimbel']}><Invoices /></ProtectedRoute>} />
      <Route path="/:slug/admin/profile"   element={<ProtectedRoute allowedRoles={['admin_bimbel']}><AdminProfile /></ProtectedRoute>} />

      {/* Admin Bimbel redirect dari /admin/... ke /:slug/admin/... */}
      <Route path="/admin/dashboard" element={<AdminSlugRedirect path="dashboard" />} />
      <Route path="/admin/classes"   element={<AdminSlugRedirect path="classes" />} />
      <Route path="/admin/users"     element={<AdminSlugRedirect path="users" />} />
      <Route path="/admin/invoices"  element={<AdminSlugRedirect path="invoices" />} />
      <Route path="/admin/profile"   element={<AdminSlugRedirect path="profile" />} />
      <Route path="/admin"           element={<AdminSlugRedirect path="dashboard" />} />

      {/* Tutor */}
      <Route path="/tutor" element={<ProtectedRoute allowedRoles={['tutor']}><TutorClass /></ProtectedRoute>} />

      {/* Student */}
      <Route path="/student"        element={<ProtectedRoute allowedRoles={['student']}><StudentHome /></ProtectedRoute>} />
      <Route path="/student/exam"   element={<ProtectedRoute allowedRoles={['student']}><Exam /></ProtectedRoute>} />
      <Route path="/student/result" element={<ProtectedRoute allowedRoles={['student']}><Result /></ProtectedRoute>} />

      {/* Workspace status — HANYA untuk pengguna yang login dengan status menunggu/pending */}
      <Route path="/workspace-status" element={<ProtectedRoute allowPending={true}><WorkspaceStatus /></ProtectedRoute>} />

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
