const ICONS = [
  'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5',
  'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M8.5 13.9 7 22l5-3 5 3-1.5-8.1',
  'M12 3c3 1.5 5 5 5 9l-2.5 3h-5L7 12c0-4 2-7.5 5-9z M12 9.5h.01',
]

export default function HowItWorks({ t }) {
  return (
    <section id="how" aria-labelledby="how-h" className="max-w-[1200px] mx-auto px-6 py-[88px] flex flex-col gap-10">
      <h2 id="how-h" className="m-0 text-[40px] leading-[1.15] font-extrabold tracking-[-0.025em] text-[#1F2937]">
        {t.howTitle}
      </h2>

      <ol className="m-0 p-0 list-none grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        {t.steps.map((s, i) => (
          <li key={i} className="flex flex-col gap-3 pt-5 border-t-[3px] border-[#0D47A1]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[32px] font-semibold text-[#0D47A1]">{s.n}</span>
              <span className="w-11 h-11 rounded-xl bg-[#DBEAFE] text-[#0D47A1] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={ICONS[i]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <span className="text-[20px] font-bold text-[#1F2937]">{s.title}</span>
            <span className="text-[15px] leading-relaxed text-[#4A4A55]">{s.body}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
