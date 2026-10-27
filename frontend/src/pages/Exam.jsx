import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MOCK_QUESTIONS } from '../mock/student'

const KEYS = ['A', 'B', 'C', 'D']
const N = 20

const TEXT = {
  en: {
    examName: 'Mathematics Tryout 1', cls: 'Class 12 IPA',
    saved: 'Answers saved · 3 s ago', unsaved: 'Not saved yet — check your connection',
    timeLeftAria: 'Time left: 42 minutes 17 seconds',
    submit: 'Submit', flag: 'Flag for review', prev: 'Previous', next: 'Next',
    questions: 'Questions', answered: 'answered',
    lAnswered: 'Answered', lFlagged: 'Flagged for review', lEmpty: 'Not answered',
    qOf: 'Question', of: 'of',
    rules: 'The timer runs on the server. Your deadline is the earlier of start + 60 min and 10:00 WIB. When time is up your saved answers are submitted automatically. One attempt only.',
    cfTitle: 'Submit your exam?', cfA: 'You have answered', cfB: 'Unanswered questions score zero, and you cannot change answers after submitting.',
    back: 'Keep working', cfSubmit: 'Submit now',
  },
  id: {
    examName: 'Tryout Matematika 1', cls: 'Kelas 12 IPA',
    saved: 'Jawaban tersimpan · 3 dtk lalu', unsaved: 'Belum tersimpan — periksa koneksi',
    timeLeftAria: 'Sisa waktu: 42 menit 17 detik',
    submit: 'Kumpulkan', flag: 'Tandai untuk ditinjau', prev: 'Sebelumnya', next: 'Berikutnya',
    questions: 'Daftar soal', answered: 'terjawab',
    lAnswered: 'Sudah dijawab', lFlagged: 'Ditandai', lEmpty: 'Belum dijawab',
    qOf: 'Soal', of: 'dari',
    rules: 'Timer berjalan di server. Tenggat Anda adalah yang lebih awal antara waktu mulai + 60 menit dan 10.00 WIB. Saat waktu habis, jawaban tersimpan dikumpulkan otomatis. Hanya satu percobaan.',
    cfTitle: 'Kumpulkan ujian?', cfA: 'Anda sudah menjawab', cfB: 'Soal yang tidak dijawab bernilai nol, dan jawaban tidak bisa diubah setelah dikumpulkan.',
    back: 'Lanjut mengerjakan', cfSubmit: 'Kumpulkan sekarang',
  },
}

export default function Exam() {
  const navigate = useNavigate()
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]
  const questions = MOCK_QUESTIONS[lang]

  const [cur, setCur] = useState(6)
  const [answers, setAnswers] = useState({ 0: 'A', 1: 'C', 2: 'B', 3: 'D', 4: 'A', 5: 'B', 7: 'C', 8: 'A', 10: 'B', 11: 'D' })
  const [flags, setFlags] = useState({ 9: true })
  const [confirm, setConfirm] = useState(false)

  const q = questions[cur % questions.length]
  const chosen = answers[cur]
  const flagged = !!flags[cur]
  const count = Object.keys(answers).length

  const btnOn = 'h-8 min-w-[40px] px-3 rounded-full bg-white text-[#1F2937] text-sm font-bold border-0 cursor-pointer'
  const btnOff = 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-white text-sm font-bold border-0 cursor-pointer'

  return (
    <div className="min-h-screen bg-white font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#1F2937] relative">
      {/* Header */}
      <header className="bg-[#0D47A1] text-white sticky top-0 z-40">
        <div className="px-6 py-3 flex flex-wrap items-center gap-3 gap-x-6">
          <img src="/logo.png" alt="BIMS" className="h-10 w-auto object-contain brightness-0 invert flex-none" />
          <div className="flex flex-col gap-0.5 flex-1 min-w-[200px]">
            <span className="font-extrabold text-[17px]">{t.examName}</span>
            <span className="text-[13px] text-[#93C5FD]">Aditya Pratama · {t.cls}</span>
          </div>

          {/* Save status */}
          <span role="status" className="inline-flex items-center gap-2 text-[13px] text-[#93C5FD]">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.saved}
          </span>

          {/* Timer */}
          <div
            role="timer"
            aria-label={t.timeLeftAria}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-[10px] bg-[#3EB6FF] text-[#0a3880]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <circle cx="9" cy="10" r="6.5" fill="none" stroke="#0a3880" strokeWidth="1.8" />
              <path d="M9 6.5V10l2.2 1.6M7 1.8h4" fill="none" stroke="#0a3880" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="font-mono text-[22px] font-semibold">42:17</span>
          </div>

          {/* Language toggle */}
          <div className="flex gap-0.5 p-[3px] border border-white/30 rounded-full items-center">
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? btnOn : btnOff}>EN</button>
            <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? btnOn : btnOff}>ID</button>
          </div>

          {/* Submit button */}
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="h-11 px-5 rounded-[10px] border-0 bg-white text-[#0D47A1] font-extrabold text-[15px] cursor-pointer hover:bg-[#F3F6FA] transition flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M22 2 11 13 M22 2l-7 20-4-9-9-4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.submit}
          </button>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-7 pb-12 flex flex-wrap gap-8 items-start">
        {/* Question area */}
        <main className="flex-[999_1_560px] min-w-0 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-sm font-semibold text-[#5F6368]">
              {t.qOf} {cur + 1} {t.of} {N}
            </span>
            <button
              type="button"
              onClick={() => setFlags((f) => ({ ...f, [cur]: !flagged }))}
              aria-pressed={flagged}
              className={`h-11 px-3.5 rounded-[10px] font-bold text-sm cursor-pointer flex items-center gap-2 transition ${
                flagged
                  ? 'bg-[#FCEFC9] text-[#4A3A12] border-2 border-[#C98A00]'
                  : 'bg-white text-[#1F2937] border border-[#C7C7CF] hover:bg-[#F3F6FA]'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                <path d="M4 22V4 M4 4h13l-2 4 2 4H4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.flag}
            </button>
          </div>

          <fieldset className="border-0 m-0 p-0 flex flex-col gap-3.5">
            <legend className="p-0 mb-5 text-[24px] leading-relaxed font-bold">{q.text}</legend>
            {q.options.map((v, i) => {
              const k = KEYS[i]
              const sel = chosen === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [cur]: k }))}
                  aria-pressed={sel}
                  className={`flex items-center gap-4 min-h-[60px] px-[18px] rounded-[14px] cursor-pointer font-['Plus_Jakarta_Sans',sans-serif] text-[18px] font-medium text-[#1F2937] transition ${
                    sel
                      ? 'border-2 border-[#0D47A1] bg-[#EEF4FF]'
                      : 'border border-[#D6D6DC] bg-white hover:border-[#0D47A1]/40'
                  }`}
                >
                  <span className={`flex-none w-9 h-9 rounded-[10px] flex items-center justify-center font-mono font-semibold text-[15px] ${
                    sel ? 'bg-[#0D47A1] text-white' : 'bg-[#F7F7F8] text-[#1F2937]'
                  }`}>
                    {k}
                  </span>
                  <span className="flex-1 text-left">{v}</span>
                </button>
              )
            })}
          </fieldset>

          <div className="flex flex-wrap justify-between gap-3 pt-3 border-t border-[#ECECF0]">
            <button
              type="button"
              onClick={() => setCur((c) => Math.max(0, c - 1))}
              className="h-12 px-5 rounded-xl border border-[#1F2937] bg-white text-[#1F2937] font-bold text-[15px] cursor-pointer flex items-center gap-2 hover:bg-[#F3F6FA] transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                <path d="M19 12H5 M11 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.prev}
            </button>
            <button
              type="button"
              onClick={() => setCur((c) => Math.min(N - 1, c + 1))}
              className="h-12 px-[22px] rounded-xl border-0 bg-[#0D47A1] text-white font-bold text-[15px] cursor-pointer flex items-center gap-2 hover:bg-[#0a3880] transition"
            >
              {t.next}
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                <path d="M5 12h14 M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </main>

        {/* Question grid */}
        <aside
          aria-labelledby="nav-h"
          className="flex-1 min-w-[260px] p-5 border border-[#E6E6EA] rounded-[18px] bg-[#F7F7F8] flex flex-col gap-4 sticky top-[73px]"
        >
          <div className="flex justify-between items-baseline gap-2">
            <h2 id="nav-h" className="m-0 text-base font-extrabold">{t.questions}</h2>
            <span className="font-mono text-[13px] font-semibold">{count} / {N} {t.answered}</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: N }, (_, i) => {
              const a = answers[i] != null
              const f = !!flags[i]
              const c = i === cur
              let cls = 'h-11 rounded-[10px] font-mono font-semibold text-sm cursor-pointer transition '
              if (f) cls += 'bg-[#FCEFC9] text-[#4A3A12] border-2 border-[#C98A00] '
              else if (a) cls += 'bg-[#0D47A1] text-white border-2 border-[#0D47A1] '
              else cls += 'bg-white text-[#1F2937] border border-[#C7C7CF] hover:border-[#0D47A1] '
              if (c) cls += 'ring-2 ring-[#1F2937] ring-offset-1 '
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCur(i)}
                  aria-label={`${t.qOf} ${i + 1}${a ? ' · ' + t.lAnswered : ''}${f ? ' · ' + t.lFlagged : ''}`}
                  aria-current={c ? 'step' : undefined}
                  className={cls}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2 text-[13px] text-[#4A4A55]">
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#0D47A1]" />{t.lAnswered}</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#FCEFC9] border-2 border-[#C98A00]" />{t.lFlagged}</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-white border border-[#C7C7CF]" />{t.lEmpty}</span>
          </div>

          <p className="m-0 text-[12px] leading-relaxed text-[#5F6368]">{t.rules}</p>
        </aside>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 bg-[#1D1D1F]/55 flex items-start justify-center pt-28 px-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cf-h"
            className="w-full max-w-[460px] bg-white rounded-[20px] p-7 flex flex-col gap-4 shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
          >
            <h2 id="cf-h" className="m-0 text-[22px] font-extrabold">{t.cfTitle}</h2>
            <p className="m-0 text-[15px] leading-relaxed text-[#4A4A55]">
              {t.cfA} {count} / {N}. {t.cfB}
            </p>
            <div className="flex flex-wrap gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="h-12 px-[18px] rounded-xl border border-[#1F2937] bg-white text-[#1F2937] font-bold text-[15px] cursor-pointer hover:bg-[#F3F6FA] transition"
              >
                {t.back}
              </button>
              <Link
                to="/student/result"
                className="inline-flex items-center gap-2 h-12 px-5 rounded-xl bg-[#0D47A1] text-white no-underline font-extrabold text-[15px] hover:bg-[#0a3880] transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                  <path d="M22 2 11 13 M22 2l-7 20-4-9-9-4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.cfSubmit}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
