import { Link } from 'react-router-dom'

export default function FinalCTA({ t }) {
  return (
    <section className="bg-[#0D47A1] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-[72px] flex flex-wrap items-center justify-between gap-6">
        <h2 className="m-0 text-[36px] leading-snug font-extrabold tracking-[-0.02em] max-w-[640px]">
          {t.finalTitle}
        </h2>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 h-[52px] px-[26px] rounded-xl bg-[#3EB6FF] text-[#0a3880] no-underline font-extrabold text-base hover:bg-[#60c8ff] transition-all"
        >
          {t.ctaPrimary}
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
            <path d="M5 12h14 M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
