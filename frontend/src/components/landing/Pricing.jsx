import { Link } from 'react-router-dom'

const PLANS = ['Basic', 'Standard', 'Pro']

export default function Pricing({ t }) {
  return (
    <section id="pricing" aria-labelledby="pricing-h" className="bg-[#EEF4FF]">
      <div className="max-w-[1200px] mx-auto px-6 py-[88px] flex flex-col gap-10">
        <div className="flex flex-col gap-3 max-w-[680px]">
          <h2 id="pricing-h" className="m-0 text-[40px] leading-[1.15] font-extrabold tracking-[-0.025em] text-[#1F2937]">
            {t.priceTitle}
          </h2>
          <p className="m-0 text-[17px] leading-relaxed text-[#374151]">{t.priceSub}</p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 items-stretch">
          {PLANS.map((name, i) => {
            const featured = i === 1
            return (
              <div
                key={name}
                className={featured
                  ? 'bg-[#0D47A1] text-white rounded-[20px] p-7 flex flex-col gap-4 shadow-[0_16px_40px_rgba(13,71,161,0.25)]'
                  : 'bg-white text-[#1F2937] border border-[#E6E6EA] rounded-[20px] p-7 flex flex-col gap-4'
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[20px] font-extrabold">{name}</span>
                  {featured && (
                    <span className="text-[12px] font-bold bg-[#3EB6FF] text-[#0a3880] px-[10px] py-1.5 rounded-full">
                      {t.popular}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[30px] font-semibold">[PRICE]</span>
                  <span className={`text-sm ${featured ? 'opacity-80' : 'text-[#5F6368]'}`}>{t.perMonth}</span>
                </div>

                <span className="text-sm font-semibold">{t.planUsers}</span>

                <ul className="m-0 pl-[18px] flex flex-col gap-2 text-sm leading-relaxed">
                  {t.planItems[i].map((item) => <li key={item}>{item}</li>)}
                </ul>

                <Link
                  to="/register"
                  className={featured
                    ? 'mt-auto flex items-center justify-center h-12 rounded-xl bg-[#3EB6FF] text-[#0a3880] no-underline font-extrabold text-[15px] hover:bg-[#60c8ff] transition-all'
                    : 'mt-auto flex items-center justify-center h-12 rounded-xl border-[1.5px] border-[#0D47A1] text-[#0D47A1] no-underline font-bold text-[15px] hover:bg-[#EEF4FF] transition-all'
                  }
                >
                  {t.choosePlan}
                </Link>
              </div>
            )
          })}
        </div>

        <p className="m-0 text-sm text-[#374151]">{t.priceNote}</p>
      </div>
    </section>
  )
}
