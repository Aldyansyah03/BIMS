import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = {
  en: [
    { label: 'Home', href: '/student', icon: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
    { label: 'Classes', href: '/student', icon: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z' },
    { label: 'Exams', href: '/student/exam', icon: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' },
    { label: 'Scores', href: '/student/result', icon: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M8.5 13.9 7 22l5-3 5 3-1.5-8.1' },
  ],
  id: [
    { label: 'Beranda', href: '/student', icon: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
    { label: 'Kelas', href: '/student', icon: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z' },
    { label: 'Ujian', href: '/student/exam', icon: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' },
    { label: 'Nilai', href: '/student/result', icon: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M8.5 13.9 7 22l5-3 5 3-1.5-8.1' },
  ],
}

export default function StudentLayout({ children, lang, setLang }) {
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
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex flex-wrap items-center gap-3 gap-x-6">
          <Link to="/" className="flex items-center no-underline flex-none">
            <img src="/logo.png" alt="BIMS" className="h-10 w-auto object-contain" />
          </Link>

          {/* Nav links */}
          <nav aria-label="Student" className="flex flex-wrap gap-1 flex-1">
            {navItems.map((item) => {
              const active = location.pathname === item.href
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-2 h-11 px-3.5 rounded-[10px] no-underline text-[15px] transition ${
                    active
                      ? 'bg-[#EEF4FF] text-[#0D47A1] font-bold'
                      : 'text-[#1F2937] font-medium hover:bg-[#F3F6FA]'
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                    <path d={item.icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Language toggle */}
          <div className="flex gap-0.5 p-[3px] border border-[#E6E6EA] rounded-full items-center bg-[#F3F6FA]">
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? btnOn : btnOff}>EN</button>
            <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? btnOn : btnOff}>ID</button>
          </div>

          {/* Avatar */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Account: Aditya Pratama"
            className="w-11 h-11 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-extrabold text-sm border-0 cursor-pointer hover:bg-[#0a3880] transition"
          >
            AP
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
