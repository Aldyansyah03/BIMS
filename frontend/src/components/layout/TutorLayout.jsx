import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const ROLE_HOME = {
  super_admin:  '/super-admin',
  admin_bimbel: '/admin/dashboard',
  tutor:        '/tutor',
  student:      '/student',
}

const NAV_ITEMS = {
  en: [
    { label: 'My Classes', href: '/tutor', icon: 'M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8' },
  ],
  id: [
    { label: 'Kelas Saya', href: '/tutor', icon: 'M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8' },
  ],
}

export default function TutorLayout({ children, lang, setLang }) {
  const { logout, user } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const tutorName  = user?.name ?? 'Tutor'
  const bimbelName = user?.tenant?.name ?? user?.tenant_name ?? 'BIMS'
  const initials   = tutorName.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

  const btnOn  = 'h-8 min-w-[40px] px-3 rounded-full bg-[#0D47A1] text-white text-sm font-bold border-0 cursor-pointer transition-all'
  const btnOff = 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-[#1F2937] text-sm font-bold border-0 cursor-pointer transition-all'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = NAV_ITEMS[lang]

  return (
    <div className="h-screen bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#1F2937] flex flex-col overflow-hidden">

      {/* ── Header — floating pill, sama dengan AdminLayout ──────────────── */}
      <header className="flex-none z-40 px-4 pt-3 pb-2">
        <div className="bg-white border border-[#E6E6EA] rounded-2xl shadow-[0_4px_24px_rgba(13,71,161,0.06)] px-5 py-2.5 flex items-center gap-4">

          {/* Logo */}
          <Link to={ROLE_HOME[user?.role] ?? '/tutor'} className="flex items-center no-underline flex-none">
            <img src="/logo.png" alt="BIMS" className="h-9 w-auto object-contain" />
          </Link>

          <span className="w-px h-6 bg-[#E6E6EA] flex-none" aria-hidden="true" />

          {/* Bimbel + role */}
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[14px] text-[#1F2937] truncate leading-tight">{bimbelName}</span>
            <span className="text-[11px] text-[#5F6368] leading-tight">Tutor</span>
          </div>

          <div className="flex-1" />

          {/* Language toggle */}
          <div className="flex gap-0.5 p-[3px] border border-[#E6E6EA] rounded-full items-center bg-[#F3F6FA]">
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? btnOn : btnOff}>EN</button>
            <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? btnOn : btnOff}>ID</button>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full bg-[#EEF4FF] text-[#0D47A1] flex items-center justify-center font-bold text-[12px] flex-none select-none">
              {initials}
            </div>
            <span className="hidden sm:block text-[13px] font-semibold text-[#1F2937]">{tutorName}</span>
          </div>

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

      {/* ── Body: sidebar + main ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden px-4 pb-4 gap-3">

        {/* Sidebar */}
        <nav
          aria-label={lang === 'id' ? 'Menu Tutor' : 'Tutor menu'}
          className="w-[210px] flex-none bg-white border border-[#E6E6EA] rounded-2xl shadow-[0_4px_24px_rgba(13,71,161,0.04)] p-3 flex flex-col gap-1 overflow-y-auto"
        >
          {/* Nav items */}
          {navItems.map((item) => {
            const active = location.pathname === item.href
            return (
              <Link
                key={item.label}
                to={item.href}
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

          {/* Spacer */}
          <div className="flex-1" />

          {/* Profile card di bottom sidebar */}
          <div className="mt-2 pt-3 border-t border-[#F2F2F5]">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px]">
              <div className="w-8 h-8 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-[12px] flex-none select-none">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-[#1F2937] truncate">{tutorName}</span>
                <span className="text-[11px] text-[#5F6368]">Tutor</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
