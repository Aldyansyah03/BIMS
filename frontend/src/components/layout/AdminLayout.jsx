import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = {
  en: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z' },
    { label: 'Students & tutors', href: '/admin/classes', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8' },
    { label: 'Classes', href: '/admin/classes', icon: 'M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8' },
    { label: 'Reports', href: '/admin/dashboard', icon: 'M3 3v18h18 M7 16v-5 M12 16V8 M17 16V5' },
    { label: 'Subscription', href: '/admin/dashboard', icon: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20' },
  ],
  id: [
    { label: 'Dasbor', href: '/admin/dashboard', icon: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z' },
    { label: 'Siswa & tutor', href: '/admin/classes', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8' },
    { label: 'Kelas', href: '/admin/classes', icon: 'M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8' },
    { label: 'Laporan', href: '/admin/dashboard', icon: 'M3 3v18h18 M7 16v-5 M12 16V8 M17 16V5' },
    { label: 'Langganan', href: '/admin/dashboard', icon: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20' },
  ],
}

export default function AdminLayout({ children, lang, setLang }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const btnOn = 'h-8 min-w-[40px] px-3 rounded-full bg-[#0D47A1] text-white text-sm font-bold border-0 cursor-pointer'
  const btnOff = 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-[#1F2937] text-sm font-bold border-0 cursor-pointer'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = NAV_ITEMS[lang]

  return (
    <div className="h-screen bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#1F2937] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-[#E6E6EA] flex-none z-40">
        <div className="px-6 py-3 flex flex-wrap items-center gap-3 gap-x-5">
          <Link to="/" className="flex items-center no-underline flex-none">
            <img src="/logo.png" alt="BIMS" className="h-10 w-auto object-contain" />
          </Link>

          <span className="w-px h-7 bg-[#E6E6EA]" aria-hidden="true" />

          <div className="flex flex-col">
            <span className="font-bold text-[15px]">Bimbel Cahaya Ilmu</span>
            <span className="text-[12px] text-[#5F6368]">Admin Bimbel</span>
          </div>

          <div className="flex-1" />

          {/* Language toggle */}
          <div className="flex gap-0.5 p-[3px] border border-[#E6E6EA] rounded-full items-center bg-[#F3F6FA]">
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? btnOn : btnOff}>EN</button>
            <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? btnOn : btnOff}>ID</button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center h-10 px-4 text-[#1F2937] font-semibold text-sm gap-2 rounded-xl hover:bg-[#F3F6FA] transition cursor-pointer border-0 bg-transparent"
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
          aria-label="Admin"
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
