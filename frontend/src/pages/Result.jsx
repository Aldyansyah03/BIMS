import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MOCK_RESULT } from '../mock/student'

const TEXT = {
  en: {
    home: 'Back to home', scoreAria: 'Score 85 out of 100',
    finalized: 'Submitted · score final', examName: 'Mathematics Tryout 1',
    meta: 'Submitted 18 Oct 2026, 08:47 WIB · time used 47 of 60 min',
    sCorrect: 'Correct', sWrong: 'Wrong', sBlank: 'Unanswered',
    formula: 'Score = 17 correct ÷ 20 questions × 100 = 85',
    perQ: 'Question by question', correct: 'Correct', wrong: 'Wrong', blank: 'Unanswered', q: 'Question',
    keyNote: 'Answer keys stay with your tutor. Ask them in class to go through the questions you missed.',
    history: 'Your mathematics scores',
  },
  id: {
    home: 'Kembali ke beranda', scoreAria: 'Skor 85 dari 100',
    finalized: 'Sudah dikumpulkan · skor final', examName: 'Tryout Matematika 1',
    meta: 'Dikumpulkan 18 Okt 2026, 08.47 WIB · waktu terpakai 47 dari 60 menit',
    sCorrect: 'Benar', sWrong: 'Salah', sBlank: 'Kosong',
    formula: 'Skor = 17 benar ÷ 20 soal × 100 = 85',
    perQ: 'Per soal', correct: 'Benar', wrong: 'Salah', blank: 'Kosong', q: 'Soal',
    keyNote: 'Kunci jawaban tetap dipegang tutor. Tanyakan di kelas untuk membahas soal yang terlewat.',
    history: 'Nilai matematika Anda',
  },
}

export default function Result() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]
  const r = MOCK_RESULT

  const btnOn = 'h-8 min-w-[40px] px-3 rounded-full bg-[#0D47A1] text-white text-sm font-bold border-0 cursor-pointer'
  const btnOff = 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-[#1F2937] text-sm font-bold border-0 cursor-pointer'

  const stats = [
    { n: r.correct, label: t.sCorrect, style: 'flex flex-col gap-0.5 p-3.5 rounded-xl bg-[#E6F4EA] text-[#14532D]' },
    { n: r.wrong, label: t.sWrong, style: 'flex flex-col gap-0.5 p-3.5 rounded-xl bg-[#FDE7E5] text-[#8A1C12]' },
    { n: r.blank, label: t.sBlank, style: 'flex flex-col gap-0.5 p-3.5 rounded-xl bg-[#F2F2F5] text-[#4A4A55]' },
  ]

  const pct = Math.round((r.score / 100) * 360)

  return (
    <div className="min-h-screen bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#1F2937]">
      {/* Header */}
      <header className="bg-white border-b border-[#E6E6EA] sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex flex-wrap items-center gap-3 gap-x-6">
          <Link to="/" className="flex items-center no-underline flex-none">
            <img src="/logo.png" alt="BIMS" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex-1" />
          <div className="flex gap-0.5 p-[3px] border border-[#E6E6EA] rounded-full items-center bg-[#F3F6FA]">
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? btnOn : btnOff}>EN</button>
            <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? btnOn : btnOff}>ID</button>
          </div>
          <Link
            to="/student"
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-[#1F2937] text-[#1F2937] no-underline font-bold text-sm hover:bg-[#F3F6FA] transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.home}
          </Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-8 pb-14 flex flex-col gap-6">
        {/* Score card */}
        <section
          aria-labelledby="res-h"
          className="bg-white border border-[#E6E6EA] rounded-[22px] p-8 flex flex-wrap gap-8 items-center"
        >
          {/* Donut */}
          <div
            role="img"
            aria-label={t.scoreAria}
            className="flex-none w-[200px] h-[200px] rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(#0D47A1 0 ${r.score}%, #DBEAFE ${r.score}% 100%)`,
            }}
          >
            <div className="w-40 h-40 rounded-full bg-white flex flex-col items-center justify-center">
              <span className="font-mono text-[60px] font-semibold leading-none">{r.score}</span>
              <span className="text-sm text-[#5F6368]">/ 100</span>
            </div>
          </div>

          <div className="flex-1 min-w-[300px] flex flex-col gap-3">
            <span className="self-start text-[13px] font-bold bg-[#E6F4EA] text-[#1E6B3A] px-2.5 py-1.5 rounded-full">
              {t.finalized}
            </span>
            <h1 id="res-h" className="m-0 text-[32px] font-extrabold tracking-[-0.02em]">{t.examName}</h1>
            <span className="text-[15px] text-[#4A4A55]">{t.meta}</span>

            <div className="grid grid-cols-3 gap-3 mt-2">
              {stats.map((s) => (
                <div key={s.label} className={s.style}>
                  <span className="font-mono text-[28px] font-semibold">{s.n}</span>
                  <span className="text-[13px] font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
            <span className="font-mono text-[13px] text-[#5F6368]">{t.formula}</span>
          </div>
        </section>

        <div className="flex flex-wrap gap-6 items-start">
          {/* Per question grid */}
          <section aria-labelledby="ov-h" className="flex-[2_1_480px] min-w-0 bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-4">
            <h2 id="ov-h" className="m-0 text-[19px] font-extrabold">{t.perQ}</h2>
            <div className="grid grid-cols-10 gap-2">
              {Array.from({ length: r.total }, (_, i) => {
                const isWrong = r.wrong_indices.includes(i)
                const isBlank = r.blank_indices.includes(i)
                let cls = 'h-10 rounded-lg flex items-center justify-center font-mono font-semibold text-[13px] '
                let label
                if (isWrong) { cls += 'bg-white text-[#8A1C12] border-2 border-[#B42318]'; label = t.wrong }
                else if (isBlank) { cls += 'bg-[#ECECF0] text-[#4A4A55]'; label = t.blank }
                else { cls += 'bg-[#1E8E3E] text-white'; label = t.correct }
                return (
                  <div key={i} role="img" aria-label={`${t.q} ${i + 1}: ${label}`} className={cls}>
                    {i + 1}
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-4 text-[13px] text-[#4A4A55]">
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-[#1E8E3E]" />{t.correct}</span>
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-white border-2 border-[#B42318]" />{t.wrong}</span>
              <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-[#ECECF0]" />{t.blank}</span>
            </div>
            <p className="m-0 text-[13px] leading-relaxed text-[#5F6368]">{t.keyNote}</p>
          </section>

          {/* Score history */}
          <section aria-labelledby="hist-h" className="flex-1 min-w-[280px] bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-3.5">
            <h2 id="hist-h" className="m-0 text-[19px] font-extrabold">{t.history}</h2>
            {r.history.map((h, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-semibold">{h.name[lang]}</span>
                  <span className="font-mono font-semibold">{h.score}</span>
                </div>
                <div className="h-2 bg-[#F2F2F5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${h.score}%`, background: i === 0 ? '#0D47A1' : '#93C5FD' }}
                  />
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  )
}
