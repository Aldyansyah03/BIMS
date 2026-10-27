import { useState } from 'react'
import { Link } from 'react-router-dom'
import StudentLayout from '../components/layout/StudentLayout'
import {
  MOCK_CLASSES,
  MOCK_EXAMS_STUDENT,
  MOCK_MATERIALS_STUDENT,
  MOCK_TODAY,
  MOCK_SCORES,
} from '../mock/student'

const TEXT = {
  en: {
    cls: 'Class 12 IPA', hello: 'Good morning, Aditya',
    openNow: 'Open now', examName: 'Mathematics Tryout 1',
    examMeta: '20 questions · 60 minutes · Tutor: Rina S.',
    closes: 'Closes at', attempts: 'Attempts', start: 'Start exam',
    myClasses: 'My classes', materials: 'materials',
    newMat: 'New materials', today: "Today's schedule", scores: 'Recent scores',
    myExams: 'My exams',
    sOpen: 'Open', sSoon: 'Opens soon', sDone: 'Submitted', sClosed: 'Closed',
    ctaStart: 'Start exam', ctaScore: 'See score',
  },
  id: {
    cls: 'Kelas 12 IPA', hello: 'Selamat pagi, Aditya',
    openNow: 'Dibuka sekarang', examName: 'Tryout Matematika 1',
    examMeta: '20 soal · 60 menit · Tutor: Rina S.',
    closes: 'Ditutup pukul', attempts: 'Percobaan', start: 'Mulai ujian',
    myClasses: 'Kelas saya', materials: 'materi',
    newMat: 'Materi terbaru', today: 'Jadwal hari ini', scores: 'Nilai terbaru',
    myExams: 'Ujian saya',
    sOpen: 'Dibuka', sSoon: 'Akan dibuka', sDone: 'Selesai', sClosed: 'Ditutup',
    ctaStart: 'Mulai ujian', ctaScore: 'Lihat nilai',
  },
}

const STATUS_BADGE = {
  open: 'bg-[#E6F4EA] text-[#1E6B3A]',
  soon: 'bg-[#F1F1F4] text-[#1F2937]',
  done: 'bg-[#FCEFC9] text-[#6B4A00]',
  closed: 'bg-[#F2F2F5] text-[#4A4A55]',
}

const STATUS_ICON = {
  open: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  soon: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  done: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8 12l3 3 5-6',
  closed: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
}

export default function StudentHome() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]

  const classes = MOCK_CLASSES[lang]
  const exams = MOCK_EXAMS_STUDENT[lang]
  const mats = MOCK_MATERIALS_STUDENT[lang]
  const today = MOCK_TODAY[lang]
  const scores = MOCK_SCORES[lang]

  return (
    <StudentLayout lang={lang} setLang={setLang}>
      <div className="max-w-[1200px] mx-auto px-6 py-8 pb-14 flex flex-col gap-7">

        {/* Greeting */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[15px] text-[#5F6368]">Bimbel Cahaya Ilmu · {t.cls}</span>
          <h1 className="m-0 text-[34px] font-extrabold tracking-[-0.02em]">{t.hello}</h1>
        </div>

        {/* Open exam banner */}
        <section
          aria-labelledby="up-h"
          className="bg-[#0D47A1] text-white rounded-[20px] p-7 flex flex-wrap items-center gap-5 gap-x-8"
        >
          <div className="flex-1 min-w-[300px] flex flex-col gap-2.5">
            <span className="self-start font-mono text-[12px] font-semibold tracking-widest uppercase bg-[#3EB6FF] text-[#0a3880] px-2.5 py-1.5 rounded-md">
              {t.openNow}
            </span>
            <h2 id="up-h" className="m-0 text-[26px] font-extrabold">{t.examName}</h2>
            <span className="text-[15px] text-[#93C5FD]">{t.examMeta}</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-[#93C5FD]">{t.closes}</span>
              <span className="font-mono text-[18px] font-semibold">10:00 WIB</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[#93C5FD]">{t.attempts}</span>
              <span className="font-mono text-[18px] font-semibold">0 / 1</span>
            </div>
          </div>
          <Link
            to="/student/exam"
            className="inline-flex items-center gap-2 h-[52px] px-[26px] rounded-xl bg-white text-[#0D47A1] no-underline font-extrabold text-base hover:bg-[#F3F6FA] transition"
          >
            {t.start}
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M5 12h14 M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </section>

        <div className="flex flex-wrap gap-6 items-start">
          {/* Left column */}
          <div className="flex-[2_1_520px] min-w-0 flex flex-col gap-6">

            {/* My classes */}
            <section aria-labelledby="cls-h" className="flex flex-col gap-3.5">
              <h2 id="cls-h" className="m-0 text-[20px] font-extrabold">{t.myClasses}</h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
                {classes.map((c) => (
                  <a
                    key={c.id}
                    href="#"
                    className="flex flex-col gap-2 p-[18px] rounded-2xl bg-white border border-[#E6E6EA] text-[#1F2937] no-underline hover:shadow-[0_4px_16px_rgba(13,71,161,0.08)] hover:border-[#BFDBFE] transition"
                  >
                    <span
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: c.color }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="font-extrabold text-[17px]">{c.name}</span>
                    <span className="text-[13px] text-[#5F6368]">{c.tutor}</span>
                    <span className="text-[13px] font-semibold text-[#0D47A1]">{c.count} {t.materials}</span>
                  </a>
                ))}
              </div>
            </section>

            {/* My exams */}
            <section aria-labelledby="ex-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
              <h2 id="ex-h" className="m-0 px-[22px] py-[18px] text-[18px] font-extrabold border-b border-[#ECECF0]">
                {t.myExams}
              </h2>
              {exams.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center gap-2.5 gap-x-4 px-[22px] py-3.5 border-b border-[#F2F2F5]">
                  <div className="flex-1 min-w-[180px] flex flex-col gap-0.5">
                    <span className="font-bold text-[15px]">{e.name}</span>
                    <span className="text-[13px] text-[#5F6368]">{e.meta}</span>
                  </div>
                  <span className={`flex-none text-[12px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1.5 ${STATUS_BADGE[e.status]}`}>
                    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                      <path d={STATUS_ICON[e.status]} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t['s' + e.status.charAt(0).toUpperCase() + e.status.slice(1)]}
                  </span>
                  {e.href && (
                    <Link
                      to={e.href}
                      className="inline-flex items-center h-11 px-4 rounded-[10px] bg-[#0D47A1] text-white no-underline font-bold text-sm hover:bg-[#0a3880] transition"
                    >
                      {e.status === 'open' ? t.ctaStart : t.ctaScore}
                    </Link>
                  )}
                </div>
              ))}
            </section>

            {/* New materials */}
            <section aria-labelledby="mat-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
              <h2 id="mat-h" className="m-0 px-[22px] py-[18px] text-[18px] font-extrabold border-b border-[#ECECF0]">
                {t.newMat}
              </h2>
              {mats.map((m) => (
                <a
                  key={m.id}
                  href="#"
                  className="flex items-center gap-3.5 px-[22px] py-3.5 border-b border-[#F2F2F5] text-[#1F2937] no-underline min-h-[44px] hover:bg-[#F3F6FA] transition"
                >
                  <span className={`flex-none font-mono text-[12px] font-semibold px-2 py-1.5 rounded-md min-w-[44px] text-center ${
                    m.kind === 'PDF' ? 'bg-[#FDE7E5] text-[#8A1C12]' : 'bg-[#F1F1F4] text-[#1F2937]'
                  }`}>
                    {m.kind}
                  </span>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="font-bold text-[15px]">{m.title}</span>
                    <span className="text-[13px] text-[#5F6368]">{m.meta}</span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path d="M7 4l5 5-5 5" fill="none" stroke="#5F6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ))}
            </section>
          </div>

          {/* Right column */}
          <aside className="flex-1 min-w-[280px] flex flex-col gap-6">
            {/* Today's schedule */}
            <section aria-labelledby="today-h" className="bg-white border border-[#E6E6EA] rounded-[18px] px-[22px] py-[18px] flex flex-col gap-3">
              <h2 id="today-h" className="m-0 text-[18px] font-extrabold">{t.today}</h2>
              {today.map((s, i) => (
                <div key={i} className="flex gap-3.5 py-3 border-t border-[#F2F2F5]">
                  <span className="font-mono text-[13px] font-semibold text-[#0D47A1] w-24 flex-none">{s.time}</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-[15px]">{s.subject}</span>
                    <span className="text-[13px] text-[#5F6368]">{s.tutor}</span>
                  </div>
                </div>
              ))}
            </section>

            {/* Recent scores */}
            <section aria-labelledby="sc-h" className="bg-white border border-[#E6E6EA] rounded-[18px] px-[22px] py-[18px] flex flex-col gap-3">
              <h2 id="sc-h" className="m-0 text-[18px] font-extrabold">{t.scores}</h2>
              {scores.map((r, i) => (
                <Link
                  key={i}
                  to="/student/result"
                  className="flex items-center gap-3 py-2.5 border-t border-[#F2F2F5] text-[#1F2937] no-underline min-h-[44px] hover:opacity-80 transition"
                >
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="font-bold text-sm">{r.name}</span>
                    <span className="text-[12px] text-[#5F6368]">{r.date}</span>
                  </div>
                  <span className="font-mono text-[22px] font-semibold text-[#0D47A1]">{r.score}</span>
                </Link>
              ))}
            </section>
          </aside>
        </div>
      </div>
    </StudentLayout>
  )
}
