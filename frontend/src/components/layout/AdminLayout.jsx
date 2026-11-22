import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getImageUrl } from '../../services/api'

const NAV_GROUPS = {
  en: [
    {
      items: [
        { label: 'Dashboard',        path: 'dashboard', icon: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z' },
      ],
    },
    {
      label: 'Manage',
      items: [
        { label: 'Students & tutors', path: 'users',    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8' },
        { label: 'Classes',           path: 'classes',  icon: 'M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8' },
      ],
    },
    {
      label: 'Finance',
      items: [
        { label: 'Invoices',          path: 'invoices',  icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5' },
        { label: 'Subscription',      path: 'dashboard', icon: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20' },
      ],
    },
    {
      label: 'Settings',
      items: [
        { label: 'Bimbel profile',    path: 'profile',   icon: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
      ],
    },
  ],
  id: [
    {
      items: [
        { label: 'Dasbor',           path: 'dashboard', icon: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z' },
      ],
    },
    {
      label: 'Kelola',
      items: [
        { label: 'Siswa & tutor',    path: 'users',    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8' },
        { label: 'Kelas',            path: 'classes',  icon: 'M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8' },
      ],
    },
    {
      label: 'Keuangan',
      items: [
        { label: 'Tagihan',          path: 'invoices',  icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5' },
        { label: 'Langganan',        path: 'dashboard', icon: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20' },
      ],
    },
    {
      label: 'Pengaturan',
      items: [
        { label: 'Profil bimbel',    path: 'profile',   icon: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
      ],
    },
  ],
}

export default function AdminLayout({ children, lang, setLang }) {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { slug: routeSlug } = useParams()

  const tenantSlug = routeSlug || user?.tenant?.slug || (user?.tenant?.name ? user.tenant.name.toLowerCase().replace(/\s+/g, '-') : '')
  const baseAdmin  = tenantSlug ? `/${tenantSlug}/admin` : '/admin'

  const bimbelName = user?.tenant?.name || user?.tenant_name || 'Bimbel'
  const userName   = user?.name || 'Admin'
  const initials   = userName.split(' ').slice(0, 2).map((w) => w[0].toUpperCase()).join('')

  const btnOn  = 'h-8 min-w-[40px] px-3 rounded-full bg-[#0D47A1] text-white text-sm font-bold border-0 cursor-pointer transition-all'
  const btnOff = 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-[#1F2937] text-sm font-bold border-0 cursor-pointer transition-all'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navGroups = NAV_GROUPS[lang]

  return (
    <div className="h-screen bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#1F2937] flex flex-col overflow-hidden">

      {/* ── Top header — floating pill style matching landing Navbar ── */}
      <header className="flex-none z-40 px-4 pt-3 pb-2">
        <div className="bg-white border border-[#E6E6EA] rounded-2xl shadow-[0_4px_24px_rgba(13,71,161,0.06)] px-5 py-2.5 flex items-center gap-4">

          {/* Logo Bimbel (Menggantikan logo default BIMS pada topbar dashboard) */}
          <Link to={`${baseAdmin}/dashboard`} className="flex items-center no-underline flex-none group" title={bimbelName}>
            <img
              src={getImageUrl(user?.tenant?.logo || user?.tenant?.logo_url) || '/logo.png'}
              alt={bimbelName}
              className="h-9 w-auto max-w-[140px] object-contain rounded-lg transition-transform group-hover:scale-105"
              onError={(e) => {
                if (e.currentTarget.src !== window.location.origin + '/logo.png') {
                  e.currentTarget.src = '/logo.png'
                }
              }}
            />
          </Link>

          <span className="w-px h-6 bg-[#E6E6EA] flex-none" aria-hidden="true" />

          {/* Bimbel info */}
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[14px] text-[#1F2937] truncate leading-tight">{bimbelName}</span>
            <span className="text-[11px] text-[#5F6368] leading-tight font-medium">Admin Bimbel</span>
          </div>

          <div className="flex-1" />

          {/* Language toggle */}
          <div className="flex gap-0.5 p-[3px] border border-[#E6E6EA] rounded-full items-center bg-[#F3F6FA]">
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? btnOn : btnOff}>EN</button>
            <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? btnOn : btnOff}>ID</button>
          </div>

          {/* Avatar + name */}
          <Link
            to={`${baseAdmin}/profile`}
            className="flex items-center gap-2.5 pl-1 no-underline text-inherit hover:opacity-80 transition cursor-pointer"
            title={lang === 'id' ? 'Buka Profil' : 'Open Profile'}
          >
            <div className="w-8 h-8 rounded-full bg-[#EEF4FF] text-[#0D47A1] flex items-center justify-center font-bold text-[12px] flex-none select-none">
              {initials}
            </div>
            <span className="hidden sm:block text-[13px] font-semibold text-[#1F2937]">{userName}</span>
          </Link>

          <span className="w-px h-6 bg-[#E6E6EA] flex-none" aria-hidden="true" />

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label={lang === 'id' ? 'Keluar' : 'Log out'}
            title={lang === 'id' ? 'Keluar' : 'Log out'}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-[#5F6368] font-semibold text-sm rounded-xl hover:bg-[#FDE7E5] hover:text-[#8A1C12] transition cursor-pointer border-0 bg-transparent"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:block">{lang === 'id' ? 'Keluar' : 'Log out'}</span>
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + main ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden px-4 pb-4 gap-3">

        {/* Sidebar */}
        <nav
          aria-label={lang === 'id' ? 'Menu Admin' : 'Admin menu'}
          className="w-[210px] flex-none bg-white border border-[#E6E6EA] rounded-2xl shadow-[0_4px_24px_rgba(13,71,161,0.04)] p-3 flex flex-col gap-1 overflow-y-auto"
        >
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-2' : ''}>
              {/* Group label */}
              {group.label && (
                <span className="block px-3 mb-1 text-[11px] font-bold uppercase tracking-widest text-[#C7C7CF]">
                  {group.label}
                </span>
              )}
              {group.items.map((item) => {
                const targetHref = `${baseAdmin}/${item.path}`
                const active = location.pathname === targetHref || location.pathname.endsWith('/admin/' + item.path)
                return (
                  <Link
                    key={item.label}
                    to={targetHref}
                    className={`flex items-center gap-2.5 min-h-[40px] px-3 rounded-[10px] no-underline text-[14px] transition-all ${
                      active
                        ? 'bg-[#EEF4FF] text-[#0D47A1] font-bold'
                        : 'text-[#4A4A55] font-medium hover:bg-[#F3F6FA] hover:text-[#1F2937]'
                    }`}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                      <path d={item.icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}

          {/* Bottom: plan info */}
          <div className="mt-auto pt-3 border-t border-[#F2F2F5]">
            <Link
              to={`${baseAdmin}/invoices`}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] no-underline hover:bg-[#F3F6FA] transition-all group"
            >
              <span className="w-7 h-7 rounded-lg bg-[#EEF4FF] text-[#0D47A1] flex items-center justify-center flex-none">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-bold text-[#1F2937] truncate">{bimbelName}</span>
                <span className="text-[11px] text-[#5F6368]">{lang === 'id' ? 'Lihat tagihan' : 'View invoices'}</span>
              </div>
            </Link>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
