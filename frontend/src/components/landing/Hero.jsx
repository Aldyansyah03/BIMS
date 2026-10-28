import { Link } from 'react-router-dom'

export default function Hero({ t }) {
  return (
    <section id="top" className="max-w-[1200px] mx-auto px-6 pt-16 pb-24 flex flex-wrap gap-12 items-center">

      {/* Left */}
      <div className="flex-1 min-w-0 basis-[480px] flex flex-col gap-6">
        <span className="self-start font-mono text-[13px] font-semibold tracking-widest uppercase text-[#0D47A1] bg-[#EEF4FF] px-3 py-2 rounded-md">
          {t.eyebrow}
        </span>

        <h1 className="m-0 text-[58px] leading-[1.05] font-extrabold tracking-[-0.035em] text-[#1F2937]">
          {t.heroA}{' '}
          <span style={{ background: 'linear-gradient(transparent 58%, #3EB6FF 58%, #3EB6FF 92%, transparent 92%)' }}>
            {t.heroB}
          </span>
        </h1>

        <p className="m-0 text-[19px] leading-relaxed text-[#4A4A55] max-w-[540px]">{t.heroSub}</p>

        <div className="flex flex-wrap gap-3">
          <Link to="/register" className="inline-flex items-center h-[52px] px-[26px] rounded-xl bg-[#0D47A1] text-white no-underline font-bold text-base gap-2 hover:bg-[#0a3880] transition-all">
            {t.ctaPrimary}
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M5 12h14 M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link to="/login" className="inline-flex items-center h-[52px] px-[26px] rounded-xl border-[1.5px] border-[#0D47A1] text-[#0D47A1] no-underline font-bold text-base hover:bg-[#EEF4FF] transition-all">
            {t.ctaSecondary}
          </Link>
        </div>

        <ul className="m-0 p-0 list-none flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#4A4A55]">
          {t.heroChecks.map((c) => (
            <li key={c} className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <circle cx="9" cy="9" r="8" fill="#EEF4FF" />
                <path d="M5.5 9.2l2.3 2.3 4.7-4.9" fill="none" stroke="#0D47A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {c}
            </li>
          ))}
        </ul>
      </div>

      {/* Right — video demo dalam frame browser */}
      <div className="flex-1 min-w-0 basis-[560px] relative">
        {/* Browser frame */}
        <div className="bg-white border border-[#E6E6EA] rounded-[20px] shadow-[0_24px_60px_rgba(13,71,161,0.15)] overflow-hidden">

          {/* Browser top bar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0D47A1] flex-none">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex-1 flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" className="flex-none text-white">
                <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <span className="font-mono text-[12px] text-white/80 truncate">app.bims.id/admin/dashboard</span>
            </div>
          </div>

          {/* Video — natural aspect ratio */}
          <video
            src="/demo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto block"
          />
        </div>

        {/* Score badge */}
        <div className="absolute -right-3 -bottom-10 bg-white border border-[#E6E6EA] rounded-[14px] px-[18px] py-3.5 shadow-[0_12px_30px_rgba(13,71,161,0.12)] flex items-center gap-3">
          <span className="font-mono text-[28px] font-semibold text-[#0D47A1]">85</span>
          <span className="text-[13px] leading-snug text-[#4A4A55] max-w-[140px]">{t.mockScore}</span>
        </div>
      </div>

    </section>
  )
}
