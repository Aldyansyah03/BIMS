export default function FAQ({ t }) {
  return (
    <section id="faq" aria-labelledby="faq-h" className="bg-[#F3F6FA] border-t border-[#E6E6EA]">
      <div className="max-w-[860px] mx-auto px-6 py-20 flex flex-col gap-6">
        <h2 id="faq-h" className="m-0 text-[36px] font-extrabold tracking-[-0.02em] text-[#1F2937]">
          {t.faqTitle}
        </h2>

        {t.faq.map((q, i) => (
          <details key={i} className="border-b border-[#E6E6EA] py-[18px] group">
            <summary className="cursor-pointer text-[18px] font-bold min-h-7 list-none flex justify-between items-center gap-3 text-[#1F2937]">
              {q.q}
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="flex-none text-[#0D47A1] group-open:rotate-180 transition-transform">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <p className="mt-3 mb-0 text-[15px] leading-relaxed text-[#4A4A55]">{q.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
