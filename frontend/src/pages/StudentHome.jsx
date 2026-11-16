import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StudentLayout from '../components/layout/StudentLayout'
import { getStudentExams } from '../services/examService'
import { getMyClasses, getMyMaterials, getTodaySchedule, getMyScores } from '../services/studentService'
import { useAuth } from '../hooks/useAuth'

// ── Text strings ──────────────────────────────────────────────────────────────
const TEXT = {
  en: {
    opens: 'Open now', closes: 'Closes at', attempts: 'Attempts', start: 'Start exam',
    myClasses: 'My classes', materials: 'materials',
    newMat: 'New materials', today: "Today's schedule", scores: 'Recent scores',
    myExams: 'My exams',
    sOpen: 'Open', sSoon: 'Opens soon', sDone: 'Submitted', sClosed: 'Closed',
    ctaStart: 'Start exam', ctaScore: 'See score',
    noClass: 'No classes yet.', noMat: 'No materials yet.',
    noSchedule: 'No schedule today.', noScores: 'No scores yet.', noExam: 'No exams yet.',
    loading: 'Loading…', min: 'min', questions: 'questions',
  },
  id: {
    opens: 'Dibuka sekarang', closes: 'Ditutup pukul', attempts: 'Percobaan', start: 'Mulai ujian',
    myClasses: 'Kelas saya', materials: 'materi',
    newMat: 'Materi terbaru', today: 'Jadwal hari ini', scores: 'Nilai terbaru',
    myExams: 'Ujian saya',
    sOpen: 'Dibuka', sSoon: 'Akan dibuka', sDone: 'Selesai', sClosed: 'Ditutup',
    ctaStart: 'Mulai ujian', ctaScore: 'Lihat nilai',
    noClass: 'Belum ada kelas.', noMat: 'Belum ada materi.',
    noSchedule: 'Tidak ada jadwal hari ini.', noScores: 'Belum ada nilai.', noExam: 'Belum ada ujian.',
    loading: 'Memuat…', min: 'menit', questions: 'soal',
  },
}

const STATUS_BADGE = {
  open:   'bg-[#E6F4EA] text-[#1E6B3A]',
  soon:   'bg-[#F1F1F4] text-[#1F2937]',
  done:   'bg-[#FCEFC9] text-[#6B4A00]',
  closed: 'bg-[#F2F2F5] text-[#4A4A55]',
}

const STATUS_ICON = {
  open:   'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  soon:   'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  done:   'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8 12l3 3 5-6',
  closed: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
}

// Warna avatar fallback untuk kelas (cycling)
const CLASS_COLORS = ['#0D47A1', '#1B5E20', '#4A148C', '#E65100', '#880E4F', '#006064']

// ── Spinner kecil ─────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center gap-2.5 py-4 px-1 text-[#5F6368] text-sm">
      <div className="w-4 h-4 border-2 border-[#0D47A1] border-t-transparent rounded-full animate-spin flex-none" />
      <span>Memuat…</span>
    </div>
  )
}

// ── Hook generic untuk fetch data ─────────────────────────────────────────────
function useFetch(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fn()
      .then((res) => {
        if (!cancelled) setData(res.data.data ?? res.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message ?? err.message)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, deps) // deps di-pass dari caller, tidak perlu exhaustive check di sini

  return { data, loading, error }
}

// ── Format waktu dari string "HH:MM:SS" atau ISO ───────────────────────────────
function fmtTime(val, locale) {
  if (!val) return '—'
  // Kalau format "HH:MM" atau "HH:MM:SS", kembalikan langsung dua bagian pertama
  if (/^\d{2}:\d{2}/.test(val)) return val.slice(0, 5)
  try {
    return new Date(val).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  } catch { return val }
}

// ── Format tanggal relatif singkat ────────────────────────────────────────────
function fmtDate(iso, lang) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric', month: 'short',
    })
  } catch { return iso }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StudentHome() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]
  const { user } = useAuth()
  const locale = lang === 'id' ? 'id-ID' : 'en-US'

  // ── Fetch semua data paralel ─────────────────────────────────────────────────
  const { data: examsRaw, loading: examsLoading } = useFetch(getStudentExams)
  const { data: classesRaw, loading: classesLoading } = useFetch(getMyClasses)
  const { data: materialsRaw, loading: matsLoading } = useFetch(getMyMaterials)
  const { data: scheduleRaw, loading: schedLoading } = useFetch(getTodaySchedule)
  const { data: scoresRaw, loading: scoresLoading } = useFetch(getMyScores)

  // Normalisasi ke array
  const exams     = Array.isArray(examsRaw)     ? examsRaw     : []
  const classes   = Array.isArray(classesRaw)   ? classesRaw   : []
  const materials = Array.isArray(materialsRaw) ? materialsRaw : []
  const schedule  = Array.isArray(scheduleRaw)  ? scheduleRaw  : []
  const scores    = Array.isArray(scoresRaw)    ? scoresRaw    : []

  // Banner: exam pertama yang statusnya open
  const openExam = exams.find((e) => e.status === 'open')

  return (
    <StudentLayout lang={lang} setLang={setLang}>
      <div className="max-w-[1200px] mx-auto px-6 py-8 pb-14 flex flex-col gap-7">

        {/* ── Greeting ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[15px] text-[#5F6368]">
            {user?.tenant?.name ?? 'BIMS'} · {user?.class_name ?? (lang === 'id' ? 'Siswa' : 'Student')}
          </span>
          <h1 className="m-0 text-[34px] font-extrabold tracking-[-0.02em]">
            {lang === 'id' ? `Halo, ${user?.name ?? 'Siswa'}` : `Hello, ${user?.name ?? 'Student'}`}
          </h1>
        </div>

        {/* ── Open exam banner ─────────────────────────────────────────────── */}
        {!examsLoading && openExam && (
          <section
            aria-labelledby="up-h"
            className="bg-[#0D47A1] text-white rounded-[20px] p-7 flex flex-wrap items-center gap-5 gap-x-8"
          >
            <div className="flex-1 min-w-[280px] flex flex-col gap-2.5">
              <span className="self-start font-mono text-[12px] font-semibold tracking-widest uppercase bg-[#3EB6FF] text-[#0a3880] px-2.5 py-1.5 rounded-md">
                {t.opens}
              </span>
              <h2 id="up-h" className="m-0 text-[26px] font-extrabold">
                {openExam.title ?? openExam.name}
              </h2>
              <span className="text-[15px] text-[#93C5FD]">
                {[
                  openExam.total_questions != null && `${openExam.total_questions} ${t.questions}`,
                  openExam.duration_seconds != null && `${Math.round(openExam.duration_seconds / 60)} ${t.min}`,
                  openExam.subject,
                ].filter(Boolean).join(' · ')}
              </span>
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              {openExam.closes_at && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[#93C5FD]">{t.closes}</span>
                  <span className="font-mono text-[18px] font-semibold">
                    {fmtTime(openExam.closes_at, locale)}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-[#93C5FD]">{t.attempts}</span>
                <span className="font-mono text-[18px] font-semibold">
                  {openExam.attempts_used ?? 0} / {openExam.max_attempts ?? 1}
                </span>
              </div>
            </div>

            <Link
              to={`/student/exam?id=${openExam.id}`}
              className="inline-flex items-center gap-2 h-[52px] px-[26px] rounded-xl bg-white text-[#0D47A1] no-underline font-extrabold text-base hover:bg-[#F3F6FA] transition"
            >
              {t.start}
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                <path d="M5 12h14 M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </section>
        )}

        <div className="flex flex-wrap gap-6 items-start">
          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="flex-[2_1_520px] min-w-0 flex flex-col gap-6">

            {/* My classes */}
            <section aria-labelledby="cls-h" className="flex flex-col gap-3.5">
              <h2 id="cls-h" className="m-0 text-[20px] font-extrabold">{t.myClasses}</h2>
              {classesLoading ? (
                <Spinner />
              ) : classes.length === 0 ? (
                <p className="text-[14px] text-[#5F6368] m-0">{t.noClass}</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
                  {classes.map((c, idx) => {
                    const bg = c.color ?? CLASS_COLORS[idx % CLASS_COLORS.length]
                    return (
                      <div
                        key={c.id}
                        className="flex flex-col gap-2 p-[18px] rounded-2xl bg-white border border-[#E6E6EA] hover:shadow-[0_4px_16px_rgba(13,71,161,0.08)] hover:border-[#BFDBFE] transition"
                      >
                        <span
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-none"
                          style={{ background: bg }}
                        >
                          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="font-extrabold text-[17px]">{c.name ?? c.subject}</span>
                        <span className="text-[13px] text-[#5F6368]">
                          {c.tutor_name ? `Tutor: ${c.tutor_name}` : '—'}
                        </span>
                        <span className="text-[13px] font-semibold text-[#0D47A1]">
                          {c.material_count ?? 0} {t.materials}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* My exams */}
            <section aria-labelledby="ex-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
              <h2 id="ex-h" className="m-0 px-[22px] py-[18px] text-[18px] font-extrabold border-b border-[#ECECF0]">
                {t.myExams}
              </h2>

              {examsLoading ? (
                <div className="px-[22px] py-2"><Spinner /></div>
              ) : exams.length === 0 ? (
                <p className="px-[22px] py-5 text-[14px] text-[#5F6368] m-0">{t.noExam}</p>
              ) : (
                exams.map((e) => {
                  const status = e.status ?? 'soon'
                  const name   = e.title ?? e.name ?? '—'

                  // Build meta string dari field yang tersedia
                  const metaParts = e.meta
                    ? [e.meta]
                    : [
                        e.opens_at     && fmtDate(e.opens_at, lang),
                        e.duration_seconds && `${Math.round(e.duration_seconds / 60)} ${t.min}`,
                        e.max_attempts && `${e.attempts_used ?? 0}/${e.max_attempts} ${lang === 'id' ? 'percobaan' : 'attempts'}`,
                      ].filter(Boolean)

                  const href = status === 'open'
                    ? `/student/exam?id=${e.id}`
                    : status === 'done' && e.result_id
                    ? `/student/result?id=${e.result_id}`
                    : null

                  return (
                    <div
                      key={e.id}
                      className="flex flex-wrap items-center gap-2.5 gap-x-4 px-[22px] py-3.5 border-b border-[#F2F2F5] last:border-0"
                    >
                      <div className="flex-1 min-w-[180px] flex flex-col gap-0.5">
                        <span className="font-bold text-[15px]">{name}</span>
                        {metaParts.length > 0 && (
                          <span className="text-[13px] text-[#5F6368]">{metaParts.join(' · ')}</span>
                        )}
                      </div>

                      <span className={`flex-none text-[12px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1.5 ${STATUS_BADGE[status] ?? STATUS_BADGE.soon}`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                          <path
                            d={STATUS_ICON[status] ?? STATUS_ICON.soon}
                            fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                          />
                        </svg>
                        {t[`s${status.charAt(0).toUpperCase()}${status.slice(1)}`] ?? status}
                      </span>

                      {href && (
                        <Link
                          to={href}
                          className="inline-flex items-center h-11 px-4 rounded-[10px] bg-[#0D47A1] text-white no-underline font-bold text-sm hover:bg-[#0a3880] transition"
                        >
                          {status === 'open' ? t.ctaStart : t.ctaScore}
                        </Link>
                      )}
                    </div>
                  )
                })
              )}
            </section>

            {/* New materials */}
            <section aria-labelledby="mat-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
              <h2 id="mat-h" className="m-0 px-[22px] py-[18px] text-[18px] font-extrabold border-b border-[#ECECF0]">
                {t.newMat}
              </h2>

              {matsLoading ? (
                <div className="px-[22px] py-2"><Spinner /></div>
              ) : materials.length === 0 ? (
                <p className="px-[22px] py-5 text-[14px] text-[#5F6368] m-0">{t.noMat}</p>
              ) : (
                materials.map((m) => {
                  // type bisa 'pdf', 'video', 'PDF', 'Video' — normalisasi
                  const kind = (m.type ?? m.kind ?? '').toUpperCase()
                  const isPDF = kind === 'PDF'
                  const displayKind = isPDF ? 'PDF' : kind === 'VIDEO' ? 'Video' : kind || '—'

                  // Buat href ke file atau url jika tersedia
                  const href = m.url ?? m.file_url ?? '#'

                  return (
                    <a
                      key={m.id}
                      href={href}
                      target={href !== '#' ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="flex items-center gap-3.5 px-[22px] py-3.5 border-b border-[#F2F2F5] last:border-0 text-[#1F2937] no-underline min-h-[44px] hover:bg-[#F3F6FA] transition"
                    >
                      <span className={`flex-none font-mono text-[12px] font-semibold px-2 py-1.5 rounded-md min-w-[44px] text-center ${
                        isPDF ? 'bg-[#FDE7E5] text-[#8A1C12]' : 'bg-[#F1F1F4] text-[#1F2937]'
                      }`}>
                        {displayKind}
                      </span>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span className="font-bold text-[15px]">{m.title}</span>
                        <span className="text-[13px] text-[#5F6368]">
                          {[m.subject, m.created_at && fmtDate(m.created_at, lang)].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="flex-none">
                        <path d="M7 4l5 5-5 5" fill="none" stroke="#5F6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  )
                })
              )}
            </section>
          </div>

          {/* ── Right column ─────────────────────────────────────────────────── */}
          <aside className="flex-1 min-w-[280px] flex flex-col gap-6">

            {/* Today's schedule */}
            <section aria-labelledby="today-h" className="bg-white border border-[#E6E6EA] rounded-[18px] px-[22px] py-[18px] flex flex-col gap-3">
              <h2 id="today-h" className="m-0 text-[18px] font-extrabold">{t.today}</h2>

              {schedLoading ? (
                <Spinner />
              ) : schedule.length === 0 ? (
                <p className="text-[14px] text-[#5F6368] m-0 pt-2">{t.noSchedule}</p>
              ) : (
                schedule.map((s) => {
                  const timeStr = s.start_time && s.end_time
                    ? `${fmtTime(s.start_time, locale)}–${fmtTime(s.end_time, locale)}`
                    : s.time ?? '—'
                  return (
                    <div key={s.id ?? timeStr} className="flex gap-3.5 py-3 border-t border-[#F2F2F5]">
                      <span className="font-mono text-[13px] font-semibold text-[#0D47A1] w-24 flex-none">
                        {timeStr}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-[15px]">{s.subject ?? s.title ?? '—'}</span>
                        <span className="text-[13px] text-[#5F6368]">
                          {s.type === 'exam' ? 'CBT' : s.tutor_name ? `Tutor: ${s.tutor_name}` : '—'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </section>

            {/* Recent scores */}
            <section aria-labelledby="sc-h" className="bg-white border border-[#E6E6EA] rounded-[18px] px-[22px] py-[18px] flex flex-col gap-3">
              <h2 id="sc-h" className="m-0 text-[18px] font-extrabold">{t.scores}</h2>

              {scoresLoading ? (
                <Spinner />
              ) : scores.length === 0 ? (
                <p className="text-[14px] text-[#5F6368] m-0 pt-2">{t.noScores}</p>
              ) : (
                scores.map((r) => (
                  <Link
                    key={r.id ?? r.result_id}
                    to={r.result_id ? `/student/result?id=${r.result_id}` : '#'}
                    className="flex items-center gap-3 py-2.5 border-t border-[#F2F2F5] text-[#1F2937] no-underline min-h-[44px] hover:opacity-80 transition"
                  >
                    <div className="flex-1 flex flex-col gap-0.5">
                      <span className="font-bold text-sm">{r.exam_title ?? r.name ?? '—'}</span>
                      <span className="text-[12px] text-[#5F6368]">
                        {r.submitted_at ? fmtDate(r.submitted_at, lang) : r.date ?? ''}
                      </span>
                    </div>
                    <span className="font-mono text-[22px] font-semibold text-[#0D47A1]">
                      {Math.round(r.score)}
                    </span>
                  </Link>
                ))
              )}
            </section>
          </aside>
        </div>
      </div>
    </StudentLayout>
  )
}
