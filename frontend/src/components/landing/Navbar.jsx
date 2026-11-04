import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar({ t, lang, setLang }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const btnOn = 'h-8 min-w-[40px] px-3 rounded-full bg-[#0D47A1] text-white text-sm font-bold border-0 cursor-pointer transition-all'
  const btnOff = 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-[#1F2937] text-sm font-bold border-0 cursor-pointer transition-all'

  const navLinks = [
    { label: t.navFeatures, href: '#features' },
    { label: t.navRoles, href: '#roles' },
    { label: t.navHow, href: '#how' },
    { label: t.navPricing, href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 pb-1">
      {/* Floating pill container */}
      <div className="max-w-[1200px] mx-auto bg-white/90 backdrop-blur-md border border-[#E6E6EA] rounded-2xl shadow-[0_4px_24px_rgba(13,71,161,0.08)]">

        {/* Main row */}
        <div className="px-5 py-3 flex items-center gap-x-6 gap-y-3">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-none no-underline">
            <img src="/logo.png" alt="BIMS — LMS untuk Bimbel" className="h-10 w-auto object-contain" />
          </Link>

          {/* Nav links — hidden di mobile */}
          <div className="hidden md:flex flex-wrap gap-x-1 flex-1 text-[14px] font-medium">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}
                className="text-[#4A4A55] no-underline px-3 py-2 rounded-lg hover:text-[#0D47A1] hover:bg-[#EEF4FF] transition-all duration-200"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex-1 md:hidden" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <div role="group" aria-label="Language / Bahasa"
              className="flex gap-0.5 p-[3px] border border-[#E6E6EA] rounded-full items-center bg-[#F3F6FA]">
              <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? btnOn : btnOff}>EN</button>
              <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? btnOn : btnOff}>ID</button>
            </div>

            {/* Desktop: Login + Register */}
            <span className="hidden md:block w-px h-5 bg-[#E6E6EA]" aria-hidden="true" />
            <Link to="/login" className="hidden md:inline-flex items-center h-9 px-4 rounded-xl text-[#1F2937] no-underline font-semibold text-sm hover:bg-[#F7F7F8] transition-all">
              {t.login}
            </Link>
            <Link to="/register" className="hidden md:inline-flex items-center h-9 px-4 rounded-xl bg-[#0D47A1] text-white no-underline font-bold text-sm hover:bg-[#0a3880] transition-all gap-1.5">
              {t.register}
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                <path d="M5 12h14 M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {/* Mobile: hamburger */}
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 rounded-xl border border-[#E6E6EA] bg-white flex items-center justify-center cursor-pointer hover:bg-[#F3F6FA] transition"
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 6 6 18 M6 6l12 12" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6h18 M3 12h18 M3 18h18" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#E6E6EA] px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}
                className="text-[#4A4A55] no-underline px-3 py-3 rounded-lg text-sm font-medium hover:text-[#0D47A1] hover:bg-[#EEF4FF] transition-all"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex gap-2 mt-2 pt-2 border-t border-[#E6E6EA]">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="flex-1 flex items-center justify-center h-11 rounded-xl border border-[#0D47A1] text-[#0D47A1] no-underline font-bold text-sm hover:bg-[#EEF4FF] transition">
                {t.login}
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="flex-1 flex items-center justify-center h-11 rounded-xl bg-[#0D47A1] text-white no-underline font-bold text-sm hover:bg-[#0a3880] transition">
                {t.register}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
