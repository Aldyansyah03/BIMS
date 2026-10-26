export default function Trust({ t }) {
  return (
    <section aria-labelledby="trust-h" className="max-w-[1200px] mx-auto px-6 py-[72px] flex flex-wrap gap-10">
      <h2 id="trust-h" className="m-0 text-[30px] leading-snug font-extrabold tracking-[-0.02em] flex-1 basis-[300px] text-[#1F2937]">
        {t.trustTitle}
      </h2>

      <div className="flex-[2_1_560px] min-w-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-8 gap-y-4">
        {t.trust.map((x, i) => (
          <div key={i} className="flex gap-3">
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="flex-none mt-0.5">
              <path d="M11 2l7 3v5.5c0 4.4-3 7.8-7 9.5-4-1.7-7-5.1-7-9.5V5z" fill="none" stroke="#0D47A1" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M7.8 11l2.2 2.2 4.2-4.4" fill="none" stroke="#0D47A1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-base text-[#1F2937]">{x.title}</span>
              <span className="text-sm leading-snug text-[#4A4A55]">{x.body}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
