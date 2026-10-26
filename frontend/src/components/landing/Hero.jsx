import { Link } from 'react-router-dom'

export default function Hero({ t }) {
  const isEn = t.heroChecks[0] === 'Separate data per bimbel'
  const mockSchedule = [
    { time: '13:00–14:30', subject: isEn ? 'Mathematics · Class 12 IPA' : 'Matematika · Kelas 12 IPA', who: 'Tutor: Rina S.' },
    { time: '14:30–16:00', subject: isEn ? 'Physics · Class 12 IPA' : 'Fisika · Kelas 12 IPA', who: 'Tutor: Dimas P.' },
    { time: '16:00–17:30', subject: isEn ? 'English · Class 9 SMP' : 'Bahasa Inggris · Kelas 9 SMP', who: 'Tutor: Ayu L.' },
  ]

  return (
    <section id="top" className="max-w-[1200px] mx-auto px-6 pt-16 pb-20 flex flex-wrap gap-14 items-center">
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

      {/* Right — mock dashboard */}
      <div className="flex-1 min-w-0 basis-[440px] relative pb-8">
        <div className="bg-white border border-[#E6E6EA] rounded-[20px] shadow-[0_24px_60px_rgba(13,71,161,0.12)] overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 bg-[#0D47A1] text-white">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[11px] tracking-widest uppercase text-[#93C5FD]">{t.mockTenant}</span>
              <span className="font-bold text-base">Bimbel Cahaya Ilmu</span>
            </div>
            <span className="text-[12px] font-bold bg-white text-[#0D47A1] px-[10px] py-1.5 rounded-full">{t.mockActive}</span>
          </div>

          {/* Card body */}
          <div className="p-5 flex flex-col gap-4 bg-[#F3F6FA]">
            <div className="text-[13px] font-bold text-[#5F6368] uppercase tracking-widest">{t.mockToday}</div>

            {mockSchedule.map((s) => (
              <div key={s.time} className="flex items-center gap-3.5 px-3.5 py-3 border border-[#E6E6EA] rounded-xl bg-white">
                <span className="font-mono text-[13px] font-semibold text-[#0D47A1] w-[92px]">{s.time}</span>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="font-bold text-[15px] text-[#1F2937]">{s.subject}</span>
                  <span className="text-[13px] text-[#5F6368]">{s.who}</span>
                </div>
              </div>
            ))}

            {/* Exam card */}
            <div className="flex items-center gap-3.5 p-4 rounded-[14px] bg-[#DBEAFE]">
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[12px] font-bold uppercase tracking-widest text-[#1e40af]">CBT</span>
                <span className="font-bold text-[15px] text-[#1F2937]">{t.mockExam}</span>
                <span className="text-[13px] text-[#374151]">{t.mockExamMeta}</span>
              </div>
              <span className="font-mono text-[20px] font-semibold text-[#0D47A1]">59:41</span>
            </div>
          </div>
        </div>

        {/* Score badge */}
        <div className="absolute -right-3 -bottom-1 bg-white border border-[#E6E6EA] rounded-[14px] px-[18px] py-3.5 shadow-[0_12px_30px_rgba(13,71,161,0.12)] flex items-center gap-3">
          <span className="font-mono text-[28px] font-semibold text-[#0D47A1]">85</span>
          <span className="text-[13px] leading-snug text-[#4A4A55] max-w-[140px]">{t.mockScore}</span>
        </div>
      </div>
    </section>
  )
}
