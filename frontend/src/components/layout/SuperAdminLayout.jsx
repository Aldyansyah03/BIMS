import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = {
  en: [
    { label: 'Overview', href: '/super-admin', icon: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z' },
    { label: 'Bimbel registrations', href: '/super-admin', icon: 'M9 3h6a1 1 0 0 1 1 1v2H8V4a1 1 0 0 1 1-1z M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2 M9 14l2 2 4-4' },
    { label: 'Plans & billing', href: '/super-admin', icon: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20 M6 15h4' },
    { label: 'Service health', href: '/super-admin', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
    { label: 'Backups', href: '/super-admin', icon: 'M4 6c0 1.7 3.6 3 8 3s8-1.3 8-3-3.6-3-8-3-8 1.3-8 3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3' },
  ],
  id: [
    { label: 'Ringkasan', href: '/super-admin', icon: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z' },
    { label: 'Pendaftaran bimbel', href: '/super-admin', icon: 'M9 3h6a1 1 0 0 1 1 1v2H8V4a1 1 0 0 1 1-1z M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2 M9 14l2 2 4-4' },
    { label: 'Paket & tagihan', href: '/super-admin', icon: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20 M6 15h4' },
    { label: 'Kondisi layanan', href: '/super-admin', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
    { label: 'Backup', href: '/super-admin', icon: 'M4 6c0 1.7 3.6 3 8 3s8-1.3 8-3-3.6-3-8-3-8 1.3-8 3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3' },
  ],
}

export default function SuperAdminLayout({ children, lang, setLang }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const btnOn = 'h-8 min-w-[40px] px-3 rounded-full bg-white text-[#1F2937] text-sm font-bold border-0 cursor-pointer'
  const btnOff = 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-white text-sm font-bold border-0 cursor-pointer'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = NAV_ITEMS[lang]

  return (
    <div className="h-screen bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#1F2937] flex flex-col overflow-hidden">
      {/* Header — dark */}
      <header className="bg-[#1F2937] text-white flex-none z-40">
        <div className="px-6 py-3 flex flex-wrap items-center gap-3 gap-x-5">
          <Link to="/" className="flex items-center no-underline flex-none">
            <img src="/logo.png" alt="BIMS" className="h-10 w-auto object-contain brightness-0 invert" />
          </Link>

          <span className="font-mono text-[12px] font-semibold tracking-widest uppercase bg-[#E3B53B] text-[#1F2937] px-2.5 py-1.5 rounded-md">
            Super Admin
          </span>

          <div className="flex-1" />

          <div className="flex gap-0.5 p-[3px] border border-white/30 rounded-full items-center">
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? btnOn : btnOff}>EN</button>
            <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? btnOn : btnOff}>ID</button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center h-10 px-4 text-white font-semibold text-sm gap-2 rounded-xl hover:bg-white/10 transition cursor-pointer border-0 bg-transparent"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {lang === 'id' ? 'Keluar' : 'Log out'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav
          aria-label="Super Admin"
          className="w-[220px] flex-none bg-white border-r border-[#E6E6EA] p-4 flex flex-col gap-1 overflow-y-auto"
        >
          {navItems.map((item) => {
            const active = location.pathname === item.href
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 min-h-[44px] px-3.5 rounded-[10px] no-underline font-medium text-[15px] transition ${
                  active
                    ? 'bg-[#EEF4FF] text-[#0D47A1] font-bold'
                    : 'text-[#1F2937] hover:bg-[#F3F6FA]'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                  <path d={item.icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
