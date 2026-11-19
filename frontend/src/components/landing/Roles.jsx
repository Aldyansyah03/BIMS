const ICONS = [
  'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z',
  'M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16 M16 9h2a2 2 0 0 1 2 2v10 M2 21h20 M8 7h4 M8 11h4 M8 15h4',
  'M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8',
  'M22 10 12 5 2 10l10 5z M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5',
]

export default function Roles({ t }) {
  return (
    <section id="roles" aria-labelledby="roles-h" className="bg-[#F3F6FA] border-t border-b border-[#E6E6EA]">
      <div className="max-w-[1200px] mx-auto px-6 py-[88px] flex flex-col gap-10">
        <div className="flex flex-col gap-3 max-w-[680px]">
          <span className="font-mono text-[13px] font-semibold tracking-widest uppercase text-[#0D47A1]">
            {t.rolesEyebrow}
          </span>
          <h2 id="roles-h" className="m-0 text-[40px] leading-[1.15] font-extrabold tracking-[-0.025em] text-[#1F2937]">
            {t.rolesTitle}
          </h2>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {t.roles.map((r, i) => (
            <div key={i} className="flex flex-col gap-3.5 p-6 rounded-2xl bg-white border-t-[3px] border-[#0D47A1] shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-[#EEF4FF] text-[#0D47A1] flex items-center justify-center flex-none">
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={ICONS[i]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-[18px] font-extrabold text-[#1F2937]">{r.name}</span>
              </div>
              <ul className="m-0 pl-[18px] flex flex-col gap-2 text-sm leading-relaxed text-[#4A4A55]">
                {r.can.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
