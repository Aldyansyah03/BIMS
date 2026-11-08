import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import { getDashboard, createSession, getAdminClasses, getAdminTutors, exportPerformance } from '../services/adminService'

// ── Icon paths ────────────────────────────────────────────────────────────────
const ICONS = {
  students: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  tutors:   'M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8',
  classes:  'M12 2 2 7l10 5 10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  avg:      'M3 17l6-6 4 4 8-8 M14 7h7v7',
}

// Warna jadwal
const SESSION_COLORS = {
  blue:   'bg-[#EEF4FF] text-[#0D47A1]',
  yellow: 'bg-[#FCEFC9] text-[#6B4A00]',
  gray:   'bg-[#F3F6FA] text-[#1F2937]',
  green:  'bg-[#E6F4EA] text-[#1E6B3A]',
  red:    'bg-[#FDE7E5] text-[#8A1C12]',
}

// ── Text strings ──────────────────────────────────────────────────────────────
const TEXT = {
  en: {
    title: 'Dashboard',
    planMonthly: 'Monthly', planActive: 'Active until',
    usersOf: 'of', usersLabel: 'users',
    weekTitle: "This week's schedule",
    perfTitle: 'Performance by class',
    colClass: 'Class', colTutor: 'Tutor', colStudents: 'Students', colExams: 'Exams', colAvg: 'Avg. score',
    export: 'Export CSV', exporting: 'Exporting…',
    addTitle: 'Add a session',
    fClass: 'Class', fTutor: 'Tutor', fDay: 'Day', fStart: 'Start', fEnd: 'End',
    saveBtn: 'Save session', saving: 'Saving…',
    saved: 'Session saved.',
    clashTitle: 'This overlaps another session',
    clashFix: (t) => `Start at ${t} instead`,
    allClasses: 'All classes', allExams: 'All exams',
    loading: 'Loading dashboard…',
    errorTitle: 'Failed to load dashboard',
    retry: 'Try again',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    kpiLabels: { students: 'Students', tutors: 'Tutors', classes: 'Classes', avg: 'Avg. CBT score' },
    noSession: 'No sessions',
    noPerf: 'No class data.',
  },
  id: {
    title: 'Dasbor',
    planMonthly: 'Bulanan', planActive: 'Aktif sampai',
    usersOf: 'dari', usersLabel: 'pengguna',
    weekTitle: 'Jadwal minggu ini',
    perfTitle: 'Performa per kelas',
    colClass: 'Kelas', colTutor: 'Tutor', colStudents: 'Siswa', colExams: 'Ujian', colAvg: 'Rata-rata nilai',
    export: 'Ekspor CSV', exporting: 'Mengekspor…',
    addTitle: 'Tambah sesi',
    fClass: 'Kelas', fTutor: 'Tutor', fDay: 'Hari', fStart: 'Mulai', fEnd: 'Selesai',
    saveBtn: 'Simpan sesi', saving: 'Menyimpan…',
    saved: 'Sesi tersimpan.',
    clashTitle: 'Bentrok dengan sesi lain',
    clashFix: (t) => `Mulai pukul ${t}`,
    allClasses: 'Semua kelas', allExams: 'Semua ujian',
    loading: 'Memuat dasbor…',
    errorTitle: 'Gagal memuat dasbor',
    retry: 'Coba lagi',
    days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    kpiLabels: { students: 'Siswa', tutors: 'Tutor', classes: 'Kelas', avg: 'Rata-rata nilai CBT' },
    noSession: 'Tidak ada sesi',
    noPerf: 'Belum ada data kelas.',
  },
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ label }) {
  return (
    <div className="flex items-center gap-3 py-8 text-[#5F6368]">
      <div className="w-5 h-5 border-2 border-[#0D47A1] border-t-transparent rounded-full animate-spin flex-none" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

// ── Format "HH:MM:SS" → "HH:MM" ──────────────────────────────────────────────
function fmtT(v) {
  if (!v) return ''
  return String(v).slice(0, 5)
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]

  // ── Dashboard data ───────────────────────────────────────────────────────────
  const [dash, setDash] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDashboard = useCallback(() => {
    setLoading(true)
    setError(null)
    getDashboard()
      .then((res) => setDash(res.data.data ?? res.data))
      .catch((err) => setError(err.response?.data?.message ?? err.message ?? 'Error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  // ── Add-session form data ────────────────────────────────────────────────────
  const [formClasses, setFormClasses] = useState([])
  const [formTutors, setFormTutors] = useState([])

  useEffect(() => {
    getAdminClasses().then((r) => setFormClasses(r.data.data ?? r.data ?? [])).catch(() => {})
    getAdminTutors().then((r) => setFormTutors(r.data.data ?? r.data ?? [])).catch(() => {})
  }, [])

  // ── Add-session form state ───────────────────────────────────────────────────
  const [form, setForm] = useState({ class_id: '', tutor_id: '', day_of_week: '1', time_start: '', time_end: '' })
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | clash | error
  const [clashMsg, setClashMsg] = useState('')
  const [clashSuggestion, setClashSuggestion] = useState('')

  const setF = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSaveSession = async () => {
    setSaveState('saving')
    setClashMsg('')
    try {
      const res = await createSession(form)
      const data = res.data.data ?? res.data
      if (data.clash) {
        setClashMsg(data.clash.message ?? '')
        setClashSuggestion(data.clash.suggestion_start ?? '')
        setSaveState('clash')
      } else {
        setSaveState('saved')
        loadDashboard() // refresh jadwal
        // Reset form setelah 2 detik
        setTimeout(() => setSaveState('idle'), 2000)
      }
    } catch (err) {
      const d = err.response?.data
      if (d?.clash) {
        setClashMsg(d.clash.message ?? '')
        setClashSuggestion(d.clash.suggestion_start ?? '')
        setSaveState('clash')
      } else {
        setClashMsg(err.response?.data?.message ?? err.message ?? 'Gagal menyimpan.')
        setSaveState('error')
      }
    }
  }

  const applyClashFix = () => {
    setForm((f) => ({ ...f, time_start: clashSuggestion }))
    setSaveState('idle')
  }

  // ── Export CSV ───────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await exportPerformance()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'performance.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent fail
    } finally {
      setExporting(false)
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const plan = dash?.plan ?? {}
  const kpis = dash?.kpis ?? {}
  const weekDays = dash?.week?.days ?? []
  const perf = dash?.performance ?? []
  const weekRange = dash?.week?.range_label ?? ''

  const usersUsed = plan.users_used ?? 0
  const usersLimit = plan.users_limit ?? 1
  const usersPercent = Math.min(100, Math.round((usersUsed / usersLimit) * 100))

  const kpiCards = [
    { key: 'students', icon: 'students', value: kpis.students ?? '—' },
    { key: 'tutors',   icon: 'tutors',   value: kpis.tutors   ?? '—' },
    { key: 'classes',  icon: 'classes',  value: kpis.classes  ?? '—' },
    { key: 'avg',      icon: 'avg',      value: kpis.avg_score != null ? String(kpis.avg_score) : '—' },
  ]

  // Days of week options for form
  const DOW = t.days.slice(0, 7).map((label, i) => ({ label, value: String(i + 1) }))

  // ── Loading / error states ───────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout lang={lang} setLang={setLang}>
        <Spinner label={t.loading} />
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout lang={lang} setLang={setLang}>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" className="text-[#C8102E]">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v4 M12 16h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="font-bold text-[18px]">{t.errorTitle}</p>
          <p className="text-[#5F6368]">{error}</p>
          <button
            type="button"
            onClick={loadDashboard}
            className="h-11 px-5 rounded-[10px] bg-[#0D47A1] text-white font-bold border-0 cursor-pointer hover:bg-[#0a3880] transition"
          >
            {t.retry}
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout lang={lang} setLang={setLang}>

      {/* ── Plan banner ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 gap-x-6 px-5 py-4 bg-white border border-[#E6E6EA] rounded-[14px] mb-6">
        <span className="font-bold text-[15px]">
          {plan.name ?? '—'} · {t.planMonthly}
        </span>
        <span className="text-sm text-[#4A4A55]">
          {t.planActive} {plan.active_until ?? '—'}
        </span>
        <div className="flex-1 min-w-[200px] flex items-center gap-2.5">
          <div
            role="img"
            aria-label={`${usersUsed} ${t.usersOf} ${usersLimit} ${t.usersLabel}`}
            className="flex-1 h-2 bg-[#DBEAFE] rounded-full overflow-hidden"
          >
            <div className="h-full bg-[#0D47A1] rounded-full" style={{ width: `${usersPercent}%` }} />
          </div>
          <span className="font-mono text-[13px] font-semibold">{usersUsed} / {usersLimit}</span>
        </div>
      </div>

      <h1 className="m-0 mb-6 text-[30px] font-extrabold tracking-[-0.02em]">{t.title}</h1>

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
        {kpiCards.map((k) => (
          <div key={k.key} className="bg-white border border-[#E6E6EA] rounded-2xl p-5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[#5F6368]">{t.kpiLabels[k.key]}</span>
              <span className="w-9 h-9 rounded-[10px] bg-[#EEF4FF] text-[#0D47A1] flex items-center justify-center flex-none">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={ICONS[k.icon]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <span className="font-mono text-[32px] font-semibold">{k.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-5 mb-6">
        {/* ── Weekly schedule ──────────────────────────────────────────────── */}
        <section aria-labelledby="week-h" className="flex-[2_1_560px] min-w-0 bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="week-h" className="m-0 text-[19px] font-extrabold">{t.weekTitle}</h2>
            {weekRange && <span className="font-mono text-[13px] text-[#5F6368]">{weekRange}</span>}
          </div>

          {weekDays.length === 0 ? (
            <p className="text-[14px] text-[#5F6368]">{t.noSession}</p>
          ) : (
            <div className="overflow-x-auto">
              <div
                className="grid gap-2.5 min-w-[560px]"
                style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(100px, 1fr))` }}
              >
                {weekDays.map((day) => (
                  <div key={day.label ?? day.date} className="flex flex-col gap-2">
                    <span className="text-[13px] font-bold text-[#5F6368] pb-1.5 border-b-2 border-[#1F2937]">
                      {day.label}
                    </span>
                    {(day.sessions ?? []).length === 0 ? (
                      <span className="text-[12px] text-[#C7C7CF] px-1">{t.noSession}</span>
                    ) : (
                      (day.sessions ?? []).map((s) => {
                        const colorCls = SESSION_COLORS[s.color ?? 'gray'] ?? SESSION_COLORS.gray
                        return (
                          <div key={s.id ?? s.time_start} className={`flex flex-col gap-0.5 p-2.5 rounded-[10px] ${colorCls}`}>
                            <span className="font-mono text-[11px] font-semibold">
                              {fmtT(s.time_start)}–{fmtT(s.time_end)}
                            </span>
                            <span className="text-[13px] font-bold leading-snug">
                              {s.subject ?? s.class_name ?? '—'}
                              {s.class_name && s.subject ? ` · ${s.class_name}` : ''}
                            </span>
                            <span className="text-[12px]">{s.tutor_name ?? '—'}</span>
                          </div>
                        )
                      })
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Add session form ─────────────────────────────────────────────── */}
        <section aria-labelledby="add-h" className="flex-1 min-w-[280px] bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-3.5">
          <h2 id="add-h" className="m-0 text-[19px] font-extrabold">{t.addTitle}</h2>

          {/* Class */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold" htmlFor="sess-class">{t.fClass}</label>
            <select
              id="sess-class"
              value={form.class_id}
              onChange={setF('class_id')}
              className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 text-sm font-medium text-[#1F2937] bg-white focus:outline-none focus:border-[#0D47A1]"
            >
              <option value="">— {t.fClass} —</option>
              {formClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tutor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold" htmlFor="sess-tutor">{t.fTutor}</label>
            <select
              id="sess-tutor"
              value={form.tutor_id}
              onChange={setF('tutor_id')}
              className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 text-sm font-medium text-[#1F2937] bg-white focus:outline-none focus:border-[#0D47A1]"
            >
              <option value="">— {t.fTutor} —</option>
              {formTutors.map((tu) => (
                <option key={tu.id} value={tu.id}>{tu.name}</option>
              ))}
            </select>
          </div>

          {/* Day, Start, End */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold" htmlFor="sess-day">{t.fDay}</label>
              <select
                id="sess-day"
                value={form.day_of_week}
                onChange={setF('day_of_week')}
                className="h-11 border border-[#C7C7CF] rounded-[10px] px-2 text-sm font-medium text-[#1F2937] bg-white focus:outline-none focus:border-[#0D47A1]"
              >
                {DOW.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold" htmlFor="sess-start">{t.fStart}</label>
              <input
                id="sess-start"
                type="time"
                value={form.time_start}
                onChange={setF('time_start')}
                className={`h-11 border rounded-[10px] px-2.5 font-mono text-sm w-full focus:outline-none ${
                  saveState === 'clash' ? 'border-red-400 bg-red-50 text-red-700' : 'border-[#C7C7CF]'
                }`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold" htmlFor="sess-end">{t.fEnd}</label>
              <input
                id="sess-end"
                type="time"
                value={form.time_end}
                onChange={setF('time_end')}
                className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 font-mono text-sm w-full focus:outline-none"
              />
            </div>
          </div>

          {/* Clash / error alert */}
          {(saveState === 'clash' || saveState === 'error') && clashMsg && (
            <div role="alert" className="flex flex-col gap-2 p-3.5 rounded-[10px] bg-red-50 text-red-700 text-sm">
              <strong className="text-[14px]">{saveState === 'clash' ? t.clashTitle : 'Error'}</strong>
              <span>{clashMsg}</span>
              {saveState === 'clash' && clashSuggestion && (
                <button
                  type="button"
                  onClick={applyClashFix}
                  className="self-start h-10 px-3.5 rounded-lg border border-red-400 bg-white text-red-700 font-bold text-[13px] cursor-pointer hover:bg-red-50 transition"
                >
                  {t.clashFix(fmtT(clashSuggestion))}
                </button>
              )}
            </div>
          )}

          {/* Saved */}
          {saveState === 'saved' && (
            <div role="status" className="px-3.5 py-3 rounded-[10px] bg-[#E6F4EA] text-[#1E6B3A] text-sm font-bold">
              {t.saved}
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveSession}
            disabled={saveState === 'saving' || !form.class_id || !form.tutor_id || !form.time_start || !form.time_end}
            className="h-12 rounded-xl border-0 bg-[#0D47A1] text-white font-bold text-[15px] cursor-pointer hover:bg-[#0a3880] transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M12 13v6 M9 16h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {saveState === 'saving' ? t.saving : t.saveBtn}
          </button>
        </section>
      </div>

      {/* ── Performance table ─────────────────────────────────────────────── */}
      <section aria-labelledby="perf-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
        <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#ECECF0]">
          <h2 id="perf-h" className="m-0 text-[19px] font-extrabold flex-1">{t.perfTitle}</h2>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="h-11 px-4 rounded-[10px] border border-[#1F2937] bg-white text-[#1F2937] font-bold text-sm cursor-pointer flex items-center gap-2 hover:bg-[#F3F6FA] transition disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10" fill="none" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {exporting ? t.exporting : t.export}
          </button>
        </div>

        {perf.length === 0 ? (
          <p className="px-6 py-6 text-[14px] text-[#5F6368] m-0">{t.noPerf}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[#5F6368] text-[12px] uppercase tracking-widest">
                  <th className="px-6 py-3 font-bold">{t.colClass}</th>
                  <th className="px-3 py-3 font-bold">{t.colTutor}</th>
                  <th className="px-3 py-3 font-bold">{t.colStudents}</th>
                  <th className="px-3 py-3 font-bold">{t.colExams}</th>
                  <th className="px-6 py-3 font-bold w-[32%]">{t.colAvg}</th>
                </tr>
              </thead>
              <tbody>
                {perf.map((r) => {
                  const avg = r.avg_score ?? r.avg ?? 0
                  return (
                    <tr key={r.class_id ?? r.cls} className="border-t border-[#F2F2F5]">
                      <td className="px-6 py-3.5 font-bold">{r.class_name ?? r.cls}</td>
                      <td className="px-3 py-3.5">{r.tutor_name ?? r.tutor}</td>
                      <td className="px-3 py-3.5 font-mono">{r.student_count ?? r.students}</td>
                      <td className="px-3 py-3.5 font-mono">{r.exam_count ?? r.exams}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-2 bg-[#F2F2F5] rounded-full overflow-hidden">
                            <div className="h-full bg-[#0D47A1] rounded-full" style={{ width: `${avg}%` }} />
                          </div>
                          <span className="font-mono font-semibold w-7 text-right">{avg}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  )
}
