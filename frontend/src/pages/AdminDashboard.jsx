import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import {
  MOCK_ADMIN_PROFILE,
  MOCK_KPIS,
  MOCK_WEEK,
  MOCK_PERF,
} from '../mock/admin'

const ICONS = {
  grad: 'M22 10 12 5 2 10l10 5z M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5',
  present: 'M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8',
  layers: 'M12 2 2 7l10 5 10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  trend: 'M3 17l6-6 4 4 8-8 M14 7h7v7',
}

const SESSION_COLORS = {
  blue: 'bg-[#EEF4FF] text-[#0D47A1]',
  yellow: 'bg-[#FCEFC9] text-[#6B4A00]',
  gray: 'bg-[#F3F6FA] text-[#1F2937]',
}

const TEXT = {
  en: {
    planLine: 'Standard plan · Monthly',
    planUntil: 'Active until 30 Nov 2026',
    usersAria: '142 of 200 users used',
    title: 'Dashboard',
    weekTitle: "This week's schedule",
    perfTitle: 'Performance by class',
    colClass: 'Class', colTutor: 'Tutor', colStudents: 'Students', colExams: 'Exams', colAvg: 'Avg. score',
    export: 'Export CSV',
    addTitle: 'Add a session',
    fClass: 'Class', fTutor: 'Tutor', fDay: 'Day', fStart: 'Start', fEnd: 'End',
    saveBtn: 'Save session',
    saved: 'Session saved.',
    clashTitle: 'This overlaps another session',
    clashBody: 'Rina S. already teaches Class 12 IPA on Monday 13:00–14:30.',
    clashFix: 'Start at 14:30 instead',
    allClasses: 'All classes', allExams: 'All exams', thisMonth: 'October 2026',
    mon: 'Mon', cls12: 'Class 12 IPA',
  },
  id: {
    planLine: 'Paket Standard · Bulanan',
    planUntil: 'Aktif sampai 30 Nov 2026',
    usersAria: '142 dari 200 pengguna terpakai',
    title: 'Dasbor',
    weekTitle: 'Jadwal minggu ini',
    perfTitle: 'Performa per kelas',
    colClass: 'Kelas', colTutor: 'Tutor', colStudents: 'Siswa', colExams: 'Ujian', colAvg: 'Rata-rata nilai',
    export: 'Ekspor CSV',
    addTitle: 'Tambah sesi',
    fClass: 'Kelas', fTutor: 'Tutor', fDay: 'Hari', fStart: 'Mulai', fEnd: 'Selesai',
    saveBtn: 'Simpan sesi',
    saved: 'Sesi tersimpan.',
    clashTitle: 'Bentrok dengan sesi lain',
    clashBody: 'Rina S. sudah mengajar Kelas 12 IPA hari Senin 13.00–14.30.',
    clashFix: 'Mulai pukul 14.30',
    allClasses: 'Semua kelas', allExams: 'Semua ujian', thisMonth: 'Oktober 2026',
    mon: 'Sen', cls12: 'Kelas 12 IPA',
  },
}

export default function AdminDashboard() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]
  const kpis = MOCK_KPIS[lang]
  const week = MOCK_WEEK[lang]
  const perf = MOCK_PERF[lang]

  // Add session state
  const [mode, setMode] = useState('idle') // idle | clash | fixed | saved
  const isFixed = mode === 'fixed' || mode === 'saved'

  return (
    <AdminLayout lang={lang} setLang={setLang}>
      {/* Plan banner */}
      <div className="flex flex-wrap items-center gap-3 gap-x-6 px-5 py-4 bg-white border border-[#E6E6EA] rounded-[14px] mb-6">
        <span className="font-bold text-[15px]">{t.planLine}</span>
        <span className="text-sm text-[#4A4A55]">{t.planUntil}</span>
        <div className="flex-1 min-w-[200px] flex items-center gap-2.5">
          <div
            role="img"
            aria-label={t.usersAria}
            className="flex-1 h-2 bg-[#DBEAFE] rounded-full overflow-hidden"
          >
            <div className="h-full bg-[#0D47A1] rounded-full" style={{ width: '71%' }} />
          </div>
          <span className="font-mono text-[13px] font-semibold">142 / 200</span>
        </div>
      </div>

      <h1 className="m-0 mb-6 text-[30px] font-extrabold tracking-[-0.02em]">{t.title}</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-[#E6E6EA] rounded-2xl p-5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[#5F6368]">{k.label}</span>
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
        {/* Weekly schedule */}
        <section aria-labelledby="week-h" className="flex-[2_1_560px] min-w-0 bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="week-h" className="m-0 text-[19px] font-extrabold">{t.weekTitle}</h2>
            <span className="font-mono text-[13px] text-[#5F6368]">13–18 Oct 2026 · WIB</span>
          </div>
          <div className="overflow-x-auto">
            <div className="grid gap-2.5 min-w-[700px]" style={{ gridTemplateColumns: `repeat(${week.days.length}, minmax(110px, 1fr))` }}>
              {week.days.map((day, i) => (
                <div key={day} className="flex flex-col gap-2">
                  <span className="text-[13px] font-bold text-[#5F6368] pb-1.5 border-b-2 border-[#1F2937]">{day}</span>
                  {week.sessions[i].map((s) => (
                    <div key={s.time} className={`flex flex-col gap-0.5 p-2.5 rounded-[10px] ${SESSION_COLORS[s.color]}`}>
                      <span className="font-mono text-[11px] font-semibold">{s.time}</span>
                      <span className="text-[13px] font-bold leading-snug">{s.subject}</span>
                      <span className="text-[12px]">{s.tutor}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Add session form */}
        <section aria-labelledby="add-h" className="flex-1 min-w-[280px] bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-3.5">
          <h2 id="add-h" className="m-0 text-[19px] font-extrabold">{t.addTitle}</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold">{t.fClass}</label>
            <select className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 text-sm font-medium text-[#1F2937] bg-white focus:outline-none focus:border-[#0D47A1]">
              <option>{t.cls12}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold">{t.fTutor}</label>
            <select className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 text-sm font-medium text-[#1F2937] bg-white focus:outline-none focus:border-[#0D47A1]">
              <option>Rina S.</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold">{t.fDay}</label>
              <select className="h-11 border border-[#C7C7CF] rounded-[10px] px-2 text-sm font-medium text-[#1F2937] bg-white focus:outline-none focus:border-[#0D47A1]">
                <option>{t.mon}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold">{t.fStart}</label>
              <input
                readOnly
                value={isFixed ? '14:30' : '13:30'}
                className={`h-11 border rounded-[10px] px-2.5 font-mono text-sm w-full focus:outline-none ${mode === 'clash' ? 'border-red-400 bg-red-50 text-red-700' : 'border-[#C7C7CF]'}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold">{t.fEnd}</label>
              <input
                readOnly
                value={isFixed ? '16:00' : '15:00'}
                className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 font-mono text-sm w-full focus:outline-none"
              />
            </div>
          </div>

          {/* Clash alert */}
          {mode === 'clash' && (
            <div role="alert" className="flex flex-col gap-2 p-3.5 rounded-[10px] bg-red-50 text-red-700 text-sm">
              <strong className="text-[14px]">{t.clashTitle}</strong>
              <span>{t.clashBody}</span>
              <button
                type="button"
                onClick={() => setMode('fixed')}
                className="self-start h-10 px-3.5 rounded-lg border border-red-400 bg-white text-red-700 font-bold text-[13px] cursor-pointer hover:bg-red-50 transition"
              >
                {t.clashFix}
              </button>
            </div>
          )}

          {/* Saved */}
          {mode === 'saved' && (
            <div role="status" className="px-3.5 py-3 rounded-[10px] bg-[#EEF4FF] text-[#0D47A1] text-sm font-bold">
              {t.saved}
            </div>
          )}

          <button
            type="button"
            onClick={() => setMode(isFixed ? 'saved' : 'clash')}
            className="h-12 rounded-xl border-0 bg-[#0D47A1] text-white font-bold text-[15px] cursor-pointer hover:bg-[#0a3880] transition flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M12 13v6 M9 16h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.saveBtn}
          </button>
        </section>
      </div>

      {/* Performance table */}
      <section aria-labelledby="perf-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
        <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#ECECF0]">
          <h2 id="perf-h" className="m-0 text-[19px] font-extrabold flex-1">{t.perfTitle}</h2>
          <div className="flex flex-wrap gap-2">
            <select className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 text-sm font-semibold text-[#1F2937] bg-white focus:outline-none">
              <option>{t.allClasses}</option>
            </select>
            <select className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 text-sm font-semibold text-[#1F2937] bg-white focus:outline-none">
              <option>{t.allExams}</option>
            </select>
            <select className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 text-sm font-semibold text-[#1F2937] bg-white focus:outline-none">
              <option>{t.thisMonth}</option>
            </select>
          </div>
          <button type="button" className="h-11 px-4 rounded-[10px] border border-[#1F2937] bg-white text-[#1F2937] font-bold text-sm cursor-pointer flex items-center gap-2 hover:bg-[#F3F6FA] transition">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10" fill="none" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.export}
          </button>
        </div>
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
              {perf.map((r) => (
                <tr key={r.cls} className="border-t border-[#F2F2F5]">
                  <td className="px-6 py-3.5 font-bold">{r.cls}</td>
                  <td className="px-3 py-3.5">{r.tutor}</td>
                  <td className="px-3 py-3.5 font-mono">{r.students}</td>
                  <td className="px-3 py-3.5 font-mono">{r.exams}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 bg-[#F2F2F5] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0D47A1] rounded-full" style={{ width: `${r.avg}%` }} />
                      </div>
                      <span className="font-mono font-semibold w-7 text-right">{r.avg}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}
