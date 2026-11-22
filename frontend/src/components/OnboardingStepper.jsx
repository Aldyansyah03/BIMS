import React from 'react'

const STEPS = [
  { step: 1, label: 'Registrasi' },
  { step: 2, label: 'Verifikasi Email' },
  { step: 3, label: 'Pembayaran' },
  { step: 4, label: 'Lengkapi Profil' },
  { step: 5, label: 'Dashboard' },
]

export default function OnboardingStepper({ currentStep = 1 }) {
  return (
    <nav aria-label="Alur Pendaftaran" className="w-full mb-8">
      <ol className="m-0 p-0 list-none flex flex-wrap items-center justify-between gap-y-3 gap-x-2 text-sm bg-white border border-[#E6E6EA] rounded-2xl px-5 py-3.5 shadow-sm">
        {STEPS.map((s, index) => {
          const isDone = s.step < currentStep
          const isCurrent = s.step === currentStep
          const isUpcoming = s.step > currentStep

          return (
            <React.Fragment key={s.step}>
              <li className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-colors ${
                    isCurrent
                      ? 'bg-[#0D47A1] text-white shadow-sm ring-2 ring-[#0D47A1]/20'
                      : isDone
                      ? 'bg-[#1E6B3A] text-white'
                      : 'bg-[#ECECF0] text-[#71717A]'
                  }`}
                >
                  {isDone ? '✓' : s.step}
                </span>
                <span
                  className={`text-xs md:text-sm whitespace-nowrap ${
                    isCurrent
                      ? 'font-bold text-[#0D47A1]'
                      : isDone
                      ? 'font-semibold text-[#1E6B3A]'
                      : 'text-[#71717A]'
                  }`}
                >
                  {s.label}
                </span>
              </li>

              {index < STEPS.length - 1 && (
                <li aria-hidden="true" className="hidden sm:block flex-1 mx-2">
                  <div
                    className={`h-[2px] w-full rounded ${
                      s.step < currentStep ? 'bg-[#1E6B3A]' : 'bg-[#E6E6EA]'
                    }`}
                  />
                </li>
              )}
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
