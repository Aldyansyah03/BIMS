const ICONS = [
  'M12 2 2 7l10 5 10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
  'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  'M3 3v18h18 M7 16v-5 M12 16V8 M17 16V5',
]

export default function Features({ t }) {
  return (
    <section id="features" aria-labelledby="features-h" className="max-w-[1200px] mx-auto px-6 py-[88px] flex flex-col gap-10">
      <div className="flex flex-col gap-3 max-w-[680px]">
        <span className="font-mono text-[13px] font-semibold tracking-widest uppercase text-[#0D47A1]">
          {t.featEyebrow}
        </span>
        <h2 id="features-h" className="m-0 text-[40px] leading-[1.15] font-extrabold tracking-[-0.025em] text-[#1F2937]">
          {t.featTitle}
        </h2>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
        {t.features.map((f, i) => (
          <article key={i} className="bg-white border border-[#E6E6EA] rounded-[18px] p-7 flex flex-col gap-3 hover:shadow-[0_8px_24px_rgba(13,71,161,0.08)] hover:border-[#BFDBFE] transition-all">
            <span className="w-[52px] h-[52px] rounded-[14px] bg-[#EEF4FF] text-[#0D47A1] flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                <path d={ICONS[i]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h3 className="m-0 text-[20px] font-bold text-[#1F2937]">{f.title}</h3>
            <p className="m-0 text-[15px] leading-relaxed text-[#4A4A55]">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
