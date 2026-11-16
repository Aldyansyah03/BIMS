export default function Problem({ t }) {
  return (
    <section aria-labelledby="problem-h" className="bg-[#0D47A1] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-16 flex flex-col gap-8">
        <h2 id="problem-h" className="m-0 text-[34px] leading-snug font-extrabold tracking-[-0.02em] max-w-[720px]">
          {t.problemTitle}
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {t.problems.map((p, i) => (
            <div key={i} className="flex flex-col gap-3.5 p-6 border border-[#1e5cb8] rounded-2xl bg-[#0a3880]">
              <span className="text-sm text-[#93C5FD] line-through decoration-[#3EB6FF]">{p.before}</span>
              <span className="text-[18px] font-bold leading-snug">{p.after}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
