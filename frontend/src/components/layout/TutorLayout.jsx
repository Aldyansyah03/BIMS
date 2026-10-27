import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function TutorLayout({ children, lang, setLang }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const btnOn = 'h-8 min-w-[40px] px-3 rounded-full bg-[#0D47A1] text-white text-sm font-bold border-0 cursor-pointer'
  const btnOff = 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-[#1F2937] text-sm font-bold border-0 cursor-pointer'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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
            <span className="font-bold text-[15px]">Rina S.</span>
            <span className="text-[12px] text-[#5F6368]">
              Tutor · Bimbel Cahaya Ilmu
            </span>
          </div>

          <div className="flex-1" />

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

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
