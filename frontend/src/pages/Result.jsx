import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getExamResult } from '../services/examService'

// ── Shared style constants ────────────────────────────────────────────────────
const BTN_LANG_ON = 'h-8 min-w-[40px] px-3 rounded-full bg-[#0D47A1] text-white text-sm font-bold border-0 cursor-pointer'
const BTN_LANG_OFF = 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-[#1F2937] text-sm font-bold border-0 cursor-pointer'

// ── ResultHeader component (declared outside Result to avoid re-creation) ─────
function ResultHeader({ lang, onLangChange }) {
  const homeLabel = lang === 'id' ? 'Kembali ke beranda' : 'Back to home'
  return (
    <header className="bg-white border-b border-[#E6E6EA] sticky top-0 z-40">
      <div className="max-w-[1100px] mx-auto px-6 py-3 flex flex-wrap items-center gap-3 gap-x-6">
        <Link to="/" className="flex items-center no-underline flex-none">
          <img src="/logo.png" alt="BIMS" className="h-10 w-auto object-contain" />
        </Link>
        <div className="flex-1" />
        <div className="flex gap-0.5 p-[3px] border border-[#E6E6EA] rounded-full items-center bg-[#F3F6FA]">
          <button type="button" onClick={() => onLangChange('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? BTN_LANG_ON : BTN_LANG_OFF}>EN</button>
          <button type="button" onClick={() => onLangChange('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? BTN_LANG_ON : BTN_LANG_OFF}>ID</button>
        </div>
        <Link
          to="/student"
          className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-[#1F2937] text-[#1F2937] no-underline font-bold text-sm hover:bg-[#F3F6FA] transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
            <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {homeLabel}
        </Link>
      </div>
    </header>
  )
}

// ── Text strings ──────────────────────────────────────────────────────────────
const TEXT = {
  en: {
    loading: 'Loading result…',
    errorTitle: 'Failed to load result',
    retry: 'Try again',
    finalized: 'Submitted · final score',
    sCorrect: 'Correct', sWrong: 'Wrong', sBlank: 'Unanswered',
    perQ: 'Question by question',
    correct: 'Correct', wrong: 'Wrong', blank: 'Unanswered', q: 'Question',
    keyNote: 'Answer keys stay with your tutor. Ask them in class to go through the questions you missed.',
    history: 'Your recent scores',
    minUsed: 'min used of', submitted: 'Submitted',
    scoreFormula: (c, t, s) => `Score = ${c} correct ÷ ${t} questions × 100 = ${s}`,
  },
  id: {
    loading: 'Memuat hasil ujian…',
    errorTitle: 'Gagal memuat hasil',
    retry: 'Coba lagi',
    finalized: 'Sudah dikumpulkan · skor final',
    sCorrect: 'Benar', sWrong: 'Salah', sBlank: 'Kosong',
    perQ: 'Per soal',
    correct: 'Benar', wrong: 'Salah', blank: 'Kosong', q: 'Soal',
    keyNote: 'Kunci jawaban tetap dipegang tutor. Tanyakan di kelas untuk membahas soal yang terlewat.',
    history: 'Nilai ujian terbaru',
    minUsed: 'menit terpakai dari', submitted: 'Dikumpulkan',
    scoreFormula: (c, t, s) => `Skor = ${c} benar ÷ ${t} soal × 100 = ${s}`,
  },
}

function formatSubmittedAt(iso, lang) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    })
  } catch {
    return iso
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Result() {
  const [searchParams] = useSearchParams()
  const resultId = searchParams.get('id')

  const [lang, setLang] = useState('id')
  const t = TEXT[lang]

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!resultId) {
      setError('Result ID tidak ditemukan.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getExamResult(resultId)
      .then((res) => { if (!cancelled) setResult(res.data.data ?? res.data) })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message ?? err.message ?? 'Gagal memuat hasil.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [resultId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
        <ResultHeader lang={lang} onLangChange={setLang} />
        <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
          <div className="w-10 h-10 border-4 border-[#0D47A1] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#4A4A55] font-semibold">{t.loading}</span>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
        <ResultHeader lang={lang} onLangChange={setLang} />
        <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4 px-6 text-center">
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
      </div>
    )
  }

  const {
    exam_title,
    subject,
    submitted_at,
    duration_used_seconds = 0,
    duration_seconds = 3600,
    score,
    correct,
    wrong,
    blank,
    total,
    question_results = [],
    history = [],
  } = result

  const minutesUsed = Math.round(duration_used_seconds / 60)
  const minutesTotal = Math.round(duration_seconds / 60)
  const scoreDisplay = Math.round(score)

  const stats = [
    { n: correct, label: t.sCorrect, style: 'flex flex-col gap-0.5 p-3.5 rounded-xl bg-[#E6F4EA] text-[#14532D]' },
    { n: wrong, label: t.sWrong, style: 'flex flex-col gap-0.5 p-3.5 rounded-xl bg-[#FDE7E5] text-[#8A1C12]' },
    { n: blank, label: t.sBlank, style: 'flex flex-col gap-0.5 p-3.5 rounded-xl bg-[#F2F2F5] text-[#4A4A55]' },
  ]

  return (
    <div className="min-h-screen bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#1F2937]">
      <ResultHeader lang={lang} onLangChange={setLang} />

      <main className="max-w-[1100px] mx-auto px-6 py-8 pb-14 flex flex-col gap-6">
        {/* Score card */}
        <section
          aria-labelledby="res-h"
          className="bg-white border border-[#E6E6EA] rounded-[22px] p-8 flex flex-wrap gap-8 items-center"
        >
          {/* Donut chart */}
          <div
            role="img"
            aria-label={`Skor ${scoreDisplay} dari 100`}
            className="flex-none w-[200px] h-[200px] rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(#0D47A1 0 ${scoreDisplay}%, #DBEAFE ${scoreDisplay}% 100%)`,
            }}
          >
            <div className="w-40 h-40 rounded-full bg-white flex flex-col items-center justify-center">
              <span className="font-mono text-[60px] font-semibold leading-none">{scoreDisplay}</span>
              <span className="text-sm text-[#5F6368]">/ 100</span>
            </div>
          </div>

          <div className="flex-1 min-w-[300px] flex flex-col gap-3">
            <span className="self-start text-[13px] font-bold bg-[#E6F4EA] text-[#1E6B3A] px-2.5 py-1.5 rounded-full">
              {t.finalized}
            </span>
            <h1 id="res-h" className="m-0 text-[32px] font-extrabold tracking-[-0.02em]">
              {exam_title ?? subject ?? '—'}
            </h1>
            <span className="text-[15px] text-[#4A4A55]">
              {t.submitted} {formatSubmittedAt(submitted_at, lang)} · {minutesUsed} {t.minUsed} {minutesTotal}
            </span>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {stats.map((s) => (
                <div key={s.label} className={s.style}>
                  <span className="font-mono text-[28px] font-semibold">{s.n}</span>
                  <span className="text-[13px] font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
            <span className="font-mono text-[13px] text-[#5F6368]">
              {t.scoreFormula(correct, total, scoreDisplay)}
            </span>
          </div>
        </section>

        <div className="flex flex-wrap gap-6 items-start">
          {/* Per-question grid */}
          <section aria-labelledby="ov-h" className="flex-[2_1_480px] min-w-0 bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-4">
            <h2 id="ov-h" className="m-0 text-[19px] font-extrabold">{t.perQ}</h2>
            {question_results.length > 0 ? (
              <>
                <div className="grid grid-cols-10 gap-2">
                  {question_results.map((qr, i) => {
                    const isWrong = qr.status === 'wrong'
                    const isBlank = qr.status === 'blank'
                    let cls = 'h-10 rounded-lg flex items-center justify-center font-mono font-semibold text-[13px] '
                    let label
                    if (isWrong) { cls += 'bg-white text-[#8A1C12] border-2 border-[#B42318]'; label = t.wrong }
                    else if (isBlank) { cls += 'bg-[#ECECF0] text-[#4A4A55]'; label = t.blank }
                    else { cls += 'bg-[#1E8E3E] text-white'; label = t.correct }
                    return (
                      <div key={qr.number ?? i} role="img" aria-label={`${t.q} ${qr.number ?? i + 1}: ${label}`} className={cls}>
                        {qr.number ?? i + 1}
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-4 text-[13px] text-[#4A4A55]">
                  <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-[#1E8E3E]" />{t.correct}</span>
                  <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-white border-2 border-[#B42318]" />{t.wrong}</span>
                  <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-[#ECECF0]" />{t.blank}</span>
                </div>
              </>
            ) : (
              <p className="text-[14px] text-[#5F6368]">—</p>
            )}
            <p className="m-0 text-[13px] leading-relaxed text-[#5F6368]">{t.keyNote}</p>
          </section>

          {/* Score history */}
          {history.length > 0 && (
            <section aria-labelledby="hist-h" className="flex-1 min-w-[280px] bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-3.5">
              <h2 id="hist-h" className="m-0 text-[19px] font-extrabold">{t.history}</h2>
              {history.map((h, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-semibold">
                      {typeof h.name === 'object' ? (h.name[lang] ?? h.name.id ?? h.name.en) : h.name}
                    </span>
                    <span className="font-mono font-semibold">{Math.round(h.score)}</span>
                  </div>
                  <div className="h-2 bg-[#F2F2F5] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, h.score)}%`, background: i === 0 ? '#0D47A1' : '#93C5FD' }}
                    />
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
