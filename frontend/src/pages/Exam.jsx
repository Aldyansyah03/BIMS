import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useExam } from '../hooks/useExam'
import { useAuth } from '../hooks/useAuth'

const TEXT = {
  en: {
    loading: 'Loading exam…',
    errorTitle: 'Failed to load exam',
    retry: 'Try again',
    saved: 'Answers saved',
    saving: 'Saving…',
    unsaved: 'Not saved — check connection',
    timeLeftAria: (t) => `Time left: ${t}`,
    submit: 'Submit',
    flag: 'Flag for review',
    prev: 'Previous',
    next: 'Next',
    questions: 'Questions',
    answered: 'answered',
    lAnswered: 'Answered',
    lFlagged: 'Flagged for review',
    lEmpty: 'Not answered',
    qOf: 'Question',
    of: 'of',
    rules: 'The timer runs on the server. When time is up your saved answers are submitted automatically. One attempt only.',
    cfTitle: 'Submit your exam?',
    cfA: 'You have answered',
    cfB: 'Unanswered questions score zero, and you cannot change answers after submitting.',
    back: 'Keep working',
    cfSubmit: 'Submit now',
    submitting: 'Submitting…',
    timeUp: 'Time is up — submitting automatically…',
  },
  id: {
    loading: 'Memuat ujian…',
    errorTitle: 'Gagal memuat ujian',
    retry: 'Coba lagi',
    saved: 'Jawaban tersimpan',
    saving: 'Menyimpan…',
    unsaved: 'Belum tersimpan — periksa koneksi',
    timeLeftAria: (t) => `Sisa waktu: ${t}`,
    submit: 'Kumpulkan',
    flag: 'Tandai untuk ditinjau',
    prev: 'Sebelumnya',
    next: 'Berikutnya',
    questions: 'Daftar soal',
    answered: 'terjawab',
    lAnswered: 'Sudah dijawab',
    lFlagged: 'Ditandai',
    lEmpty: 'Belum dijawab',
    qOf: 'Soal',
    of: 'dari',
    rules: 'Timer berjalan di server. Saat waktu habis, jawaban tersimpan dikumpulkan otomatis. Hanya satu percobaan.',
    cfTitle: 'Kumpulkan ujian?',
    cfA: 'Anda sudah menjawab',
    cfB: 'Soal yang tidak dijawab bernilai nol, dan jawaban tidak bisa diubah setelah dikumpulkan.',
    back: 'Lanjut mengerjakan',
    cfSubmit: 'Kumpulkan sekarang',
    submitting: 'Mengumpulkan…',
    timeUp: 'Waktu habis — mengumpulkan otomatis…',
  },
}

const KEYS = ['A', 'B', 'C', 'D', 'E']

export default function Exam() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const examId = searchParams.get('id')

  const [lang, setLang] = useState('id')
  const t = TEXT[lang]

  const { user } = useAuth()

  const {
    examMeta,
    questions,
    totalQ,
    answers,
    flags,
    curIndex,
    currentQuestion,
    answeredCount,
    formattedTime,
    isWarning,
    secondsLeft,
    loading,
    error,
    saveStatus,
    submitting,
    setAnswer,
    toggleFlag,
    goTo,
    goNext,
    goPrev,
    handleSubmit,
  } = useExam(examId)

  const [confirm, setConfirm] = useState(false)
  const [timeUpBanner, setTimeUpBanner] = useState(false)

  // Saat waktu habis, tampilkan banner lalu submit otomatis (handleSubmit sudah dipanggil dari hook)
  useEffect(() => {
    if (secondsLeft === 0 && !submitting) {
      setTimeUpBanner(true)
    }
  }, [secondsLeft, submitting])

  // Setelah submit berhasil, navigasi ke result
  const doSubmit = async () => {
    setConfirm(false)
    const resultId = await handleSubmit()
    if (resultId) {
      navigate(`/student/result?id=${resultId}`)
    }
  }

  const btnLangOn = 'h-8 min-w-[40px] px-3 rounded-full bg-white text-[#1F2937] text-sm font-bold border-0 cursor-pointer'
  const btnLangOff = 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-white text-sm font-bold border-0 cursor-pointer'

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4">
        <div className="w-10 h-10 border-4 border-[#0D47A1] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#4A4A55] font-semibold">{t.loading}</span>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !currentQuestion) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4 px-6 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" aria-hidden="true" className="text-[#C8102E]">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v4 M12 16h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="font-bold text-[18px]">{t.errorTitle}</p>
        <p className="text-[#5F6368] text-[15px] max-w-[360px]">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-11 px-5 rounded-[10px] bg-[#0D47A1] text-white font-bold cursor-pointer border-0 hover:bg-[#0a3880] transition"
        >
          {t.retry}
        </button>
      </div>
    )
  }

  const curQuestionId = currentQuestion.id
  const chosen = answers[curQuestionId]
  const isFlagged = !!flags[curQuestionId]

  // ── Save status label ────────────────────────────────────────────────────────
  const saveLabel = saveStatus === 'saving'
    ? t.saving
    : saveStatus === 'error'
    ? t.unsaved
    : t.saved

  const saveLabelColor = saveStatus === 'error' ? '#FCA5A5' : '#93C5FD'

  return (
    <div className="min-h-screen bg-white font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#1F2937] relative">
      {/* Header */}
      <header className="bg-[#0D47A1] text-white sticky top-0 z-40">
        <div className="px-6 py-3 flex flex-wrap items-center gap-3 gap-x-6">
          <img src="/logo.png" alt="BIMS" className="h-10 w-auto object-contain brightness-0 invert flex-none" />

          <div className="flex flex-col gap-0.5 flex-1 min-w-[200px]">
            <span className="font-extrabold text-[17px]">{examMeta?.title ?? '—'}</span>
            <span className="text-[13px] text-[#93C5FD]">
              {user?.name ?? '—'} · {examMeta?.class ?? examMeta?.subject ?? '—'}
            </span>
          </div>

          {/* Save status */}
          <span role="status" className="inline-flex items-center gap-2 text-[13px]" style={{ color: saveLabelColor }}>
            {saveStatus !== 'error' && (
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {saveLabel}
          </span>

          {/* Timer */}
          <div
            role="timer"
            aria-label={t.timeLeftAria(formattedTime)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-[10px] font-mono text-[22px] font-semibold transition ${
              isWarning
                ? 'bg-[#FDE7E5] text-[#8A1C12]'
                : 'bg-[#3EB6FF] text-[#0a3880]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <circle cx="9" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M9 6.5V10l2.2 1.6M7 1.8h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {formattedTime}
          </div>

          {/* Language toggle */}
          <div className="flex gap-0.5 p-[3px] border border-white/30 rounded-full items-center">
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? btnLangOn : btnLangOff}>EN</button>
            <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? btnLangOn : btnLangOff}>ID</button>
          </div>

          {/* Submit button */}
          <button
            type="button"
            onClick={() => setConfirm(true)}
            disabled={submitting}
            className="h-11 px-5 rounded-[10px] border-0 bg-white text-[#0D47A1] font-extrabold text-[15px] cursor-pointer hover:bg-[#F3F6FA] transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M22 2 11 13 M22 2l-7 20-4-9-9-4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {submitting ? t.submitting : t.submit}
          </button>
        </div>
      </header>

      {/* Time-up banner */}
      {timeUpBanner && (
        <div role="alert" className="bg-[#C8102E] text-white text-center py-3 font-bold text-[15px]">
          {t.timeUp}
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-6 py-7 pb-12 flex flex-wrap gap-8 items-start">
        {/* Question area */}
        <main className="flex-[999_1_560px] min-w-0 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-sm font-semibold text-[#5F6368]">
              {t.qOf} {curIndex + 1} {t.of} {totalQ}
            </span>
            <button
              type="button"
              onClick={() => toggleFlag(curQuestionId)}
              aria-pressed={isFlagged}
              className={`h-11 px-3.5 rounded-[10px] font-bold text-sm cursor-pointer flex items-center gap-2 transition ${
                isFlagged
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
            <legend className="p-0 mb-5 text-[24px] leading-relaxed font-bold">
              {currentQuestion.text}
            </legend>
            {currentQuestion.options.map((opt) => {
              // Opsi bisa berupa string atau { key, text }
              const key = typeof opt === 'string' ? KEYS[currentQuestion.options.indexOf(opt)] : opt.key
              const label = typeof opt === 'string' ? opt : opt.text
              const sel = chosen === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAnswer(curQuestionId, key)}
                  aria-pressed={sel}
                  className={`flex items-center gap-4 min-h-[60px] px-[18px] rounded-[14px] cursor-pointer font-['Plus_Jakarta_Sans',sans-serif] text-[18px] font-medium text-[#1F2937] transition text-left ${
                    sel
                      ? 'border-2 border-[#0D47A1] bg-[#EEF4FF]'
                      : 'border border-[#D6D6DC] bg-white hover:border-[#0D47A1]/40'
                  }`}
                >
                  <span className={`flex-none w-9 h-9 rounded-[10px] flex items-center justify-center font-mono font-semibold text-[15px] ${
                    sel ? 'bg-[#0D47A1] text-white' : 'bg-[#F7F7F8] text-[#1F2937]'
                  }`}>
                    {key}
                  </span>
                  <span className="flex-1">{label}</span>
                </button>
              )
            })}
          </fieldset>

          <div className="flex flex-wrap justify-between gap-3 pt-3 border-t border-[#ECECF0]">
            <button
              type="button"
              onClick={goPrev}
              disabled={curIndex === 0}
              className="h-12 px-5 rounded-xl border border-[#1F2937] bg-white text-[#1F2937] font-bold text-[15px] cursor-pointer flex items-center gap-2 hover:bg-[#F3F6FA] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                <path d="M19 12H5 M11 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.prev}
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={curIndex === totalQ - 1}
              className="h-12 px-[22px] rounded-xl border-0 bg-[#0D47A1] text-white font-bold text-[15px] cursor-pointer flex items-center gap-2 hover:bg-[#0a3880] transition disabled:opacity-40 disabled:cursor-not-allowed"
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
            <span className="font-mono text-[13px] font-semibold">{answeredCount} / {totalQ} {t.answered}</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              const a = answers[q.id] != null
              const f = !!flags[q.id]
              const c = i === curIndex
              let cls = 'h-11 rounded-[10px] font-mono font-semibold text-sm cursor-pointer transition '
              if (f) cls += 'bg-[#FCEFC9] text-[#4A3A12] border-2 border-[#C98A00] '
              else if (a) cls += 'bg-[#0D47A1] text-white border-2 border-[#0D47A1] '
              else cls += 'bg-white text-[#1F2937] border border-[#C7C7CF] hover:border-[#0D47A1] '
              if (c) cls += 'ring-2 ring-[#1F2937] ring-offset-1 '
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${t.qOf} ${i + 1}${a ? ' · ' + t.lAnswered : ''}${f ? ' · ' + t.lFlagged : ''}`}
                  aria-current={c ? 'step' : undefined}
                  className={cls}
                >
                  {q.number ?? i + 1}
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

      {/* Confirm submit modal */}
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
              {t.cfA} {answeredCount} / {totalQ}. {t.cfB}
            </p>
            <div className="flex flex-wrap gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setConfirm(false)}
                disabled={submitting}
                className="h-12 px-[18px] rounded-xl border border-[#1F2937] bg-white text-[#1F2937] font-bold text-[15px] cursor-pointer hover:bg-[#F3F6FA] transition disabled:opacity-50"
              >
                {t.back}
              </button>
              <button
                type="button"
                onClick={doSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 h-12 px-5 rounded-xl bg-[#0D47A1] text-white font-extrabold text-[15px] cursor-pointer hover:bg-[#0a3880] transition disabled:opacity-60 disabled:cursor-not-allowed border-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                  <path d="M22 2 11 13 M22 2l-7 20-4-9-9-4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {submitting ? t.submitting : t.cfSubmit}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
