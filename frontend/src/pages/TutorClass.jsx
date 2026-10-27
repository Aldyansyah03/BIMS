import { useState } from 'react'
import TutorLayout from '../components/layout/TutorLayout'
import {
  MOCK_MATERIALS,
  MOCK_EXAMS,
  MOCK_EXAM_OPTS,
  MOCK_STUDENTS,
} from '../mock/tutor'

const TEXT = {
  en: {
    myClasses: 'My classes',
    classTitle: 'Mathematics · Class 12 IPA',
    classMeta: '32 students · Mon 13:00–14:30, Wed 15:00–16:30',
    tabs: ['Materials', 'CBT Exams', 'Results & Students'],
    // Materials
    publishTitle: 'Publish a material',
    fTitle: 'Title', sampleTitle: 'Integrals — practice set 2',
    drop: 'Drop a PDF here', dropHint: 'PDF only · up to 20 MB',
    browse: 'Choose file', or: 'or',
    videoLabel: 'Video link', videoErr: 'Use a secure link that starts with https://',
    publishBtn: 'Publish to Class 12 IPA',
    published: 'Published materials', more: 'More actions for',
    // Exams
    examsTitle: 'CBT Exams', newExam: 'New exam',
    editorTitle: 'Integrals Quiz', editorMeta: '20 questions · 45 min',
    cantPublish: 'Not ready to publish:', cantPublishBody: 'questions 7 and 12 have no answer key yet.',
    opens: 'Opens (WIB)', closes: 'Closes (WIB)', duration: 'Duration (min)', attemptsL: 'Attempts per student',
    deadlineRule: "Each student's deadline is the earlier of start time + duration and the closing time.",
    q7: 'QUESTION 7 OF 20', qText: '∫ (3x² + 2x) dx = …', answerKey: 'Answer key',
    saveDraft: 'Save draft', publishExam: 'Publish exam',
    // Students
    studentsTitle: 'Students in this class',
    examFilter: 'Exam', lastExam: 'Derivatives Quiz',
    colName: 'Name', colScore: 'Score',
    exportCls: 'Export CSV',
  },
  id: {
    myClasses: 'Kelas saya',
    classTitle: 'Matematika · Kelas 12 IPA',
    classMeta: '32 siswa · Sen 13.00–14.30, Rab 15.00–16.30',
    tabs: ['Materi', 'Ujian CBT', 'Hasil & Siswa'],
    // Materials
    publishTitle: 'Terbitkan materi',
    fTitle: 'Judul', sampleTitle: 'Integral — latihan 2',
    drop: 'Letakkan PDF di sini', dropHint: 'Hanya PDF · maks. 20 MB',
    browse: 'Pilih berkas', or: 'atau',
    videoLabel: 'Tautan video', videoErr: 'Gunakan tautan aman yang diawali https://',
    publishBtn: 'Terbitkan ke Kelas 12 IPA',
    published: 'Materi terbit', more: 'Tindakan lain untuk',
    // Exams
    examsTitle: 'Ujian CBT', newExam: 'Ujian baru',
    editorTitle: 'Kuis Integral', editorMeta: '20 soal · 45 menit',
    cantPublish: 'Belum bisa diterbitkan:', cantPublishBody: 'soal 7 dan 12 belum memiliki kunci jawaban.',
    opens: 'Dibuka (WIB)', closes: 'Ditutup (WIB)', duration: 'Durasi (menit)', attemptsL: 'Percobaan per siswa',
    deadlineRule: 'Tenggat tiap siswa adalah yang lebih awal antara waktu mulai + durasi dan waktu ditutup.',
    q7: 'SOAL 7 DARI 20', qText: '∫ (3x² + 2x) dx = …', answerKey: 'Kunci jawaban',
    saveDraft: 'Simpan draf', publishExam: 'Terbitkan ujian',
    // Students
    studentsTitle: 'Siswa di kelas ini',
    examFilter: 'Ujian', lastExam: 'Kuis Turunan',
    colName: 'Nama', colScore: 'Skor',
    exportCls: 'Ekspor CSV',
  },
}

const TABS = ['mat', 'exam', 'stu']
const TAB_ICONS = [
  'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
  'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  'M3 3v18h18 M7 16v-5 M12 16V8 M17 16V5',
]

const STATUS_STYLE = {
  d: 'bg-[#FCEFC9] text-[#6B4A00]',
  p: 'bg-[#E6F4EA] text-[#1E6B3A]',
  c: 'bg-[#F1F1F4] text-[#4A4A55]',
}

export default function TutorClass() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]
  const [tab, setTab] = useState('mat')
  const [videoUrl, setVideoUrl] = useState('http://video.example/limit')
  const videoErr = videoUrl && !videoUrl.startsWith('https://')

  const materials = MOCK_MATERIALS[lang]
  const exams = MOCK_EXAMS[lang]
  const opts = MOCK_EXAM_OPTS[lang]
  const students = MOCK_STUDENTS[lang]

  return (
    <TutorLayout lang={lang} setLang={setLang}>
      <div className="max-w-[1200px] mx-auto px-6 py-7 pb-12 flex flex-col gap-6">

        {/* Back + title */}
        <div className="flex flex-col gap-2">
          <a href="#" className="text-sm font-semibold text-[#0D47A1] no-underline hover:underline">
            ← {t.myClasses}
          </a>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="m-0 text-[32px] font-extrabold tracking-[-0.02em]">{t.classTitle}</h1>
              <span className="text-[15px] text-[#4A4A55]">{t.classMeta}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Class sections"
          className="flex flex-wrap gap-1.5 border-b border-[#E6E6EA]"
        >
          {t.tabs.map((label, i) => {
            const id = TABS[i]
            const active = tab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`h-12 px-[18px] border-0 border-b-[3px] bg-transparent font-['Plus_Jakarta_Sans',sans-serif] text-[15px] cursor-pointer flex items-center gap-2 mb-[-1px] transition ${
                  active
                    ? 'border-[#0D47A1] text-[#1F2937] font-extrabold'
                    : 'border-transparent text-[#5F6368] font-semibold hover:text-[#1F2937]'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                  <path d={TAB_ICONS[i]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {label}
              </button>
            )
          })}
        </div>

        {/* Tab: Materials */}
        {tab === 'mat' && (
          <div className="flex flex-wrap gap-5 items-start">
            {/* Upload form */}
            <section aria-labelledby="pub-h" className="flex-1 min-w-[320px] bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-4">
              <h2 id="pub-h" className="m-0 text-[19px] font-extrabold">{t.publishTitle}</h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold">{t.fTitle}</label>
                <input
                  defaultValue={t.sampleTitle}
                  className="h-11 border border-[#C7C7CF] rounded-[10px] px-3 text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition"
                />
              </div>

              {/* Drop zone */}
              <div className="flex flex-col items-center gap-2 py-6 px-4 border-2 border-dashed border-[#C7C7CF] rounded-[14px] bg-[#FAFAFB] text-center">
                <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M9 4h10l6 6v18H9z" fill="none" stroke="#0D47A1" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M19 4v6h6M17 22v-8m0 0l-3 3m3-3l3 3" fill="none" stroke="#0D47A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-bold text-[15px]">{t.drop}</span>
                <span className="text-[13px] text-[#5F6368]">{t.dropHint}</span>
                <button type="button" className="h-11 px-4 rounded-[10px] border border-[#1F2937] bg-white text-[#1F2937] font-bold text-sm cursor-pointer flex items-center gap-2 hover:bg-[#F3F6FA] transition">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                    <path d="M12 15V3 M7 8l5-5 5 5 M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t.browse}
                </button>
              </div>

              <div className="flex items-center gap-2 text-[13px] text-[#5F6368]">
                <span className="flex-1 h-px bg-[#E6E6EA]" />
                {t.or}
                <span className="flex-1 h-px bg-[#E6E6EA]" />
              </div>

              {/* Video link */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold">{t.videoLabel}</label>
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className={`h-11 border-2 rounded-[10px] px-3 font-mono text-sm focus:outline-none transition ${
                    videoErr
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-[#C7C7CF] text-[#1F2937] focus:border-[#0D47A1]'
                  }`}
                />
                {videoErr && (
                  <span className="text-[13px] font-semibold text-red-600">{t.videoErr}</span>
                )}
              </div>

              <button type="button" className="h-12 rounded-xl border-0 bg-[#0D47A1] text-white font-bold text-[15px] cursor-pointer hover:bg-[#0a3880] transition flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                  <path d="M22 2 11 13 M22 2l-7 20-4-9-9-4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.publishBtn}
              </button>
            </section>

            {/* Materials list */}
            <section aria-labelledby="list-h" className="flex-[2_1_480px] min-w-0 bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
              <h2 id="list-h" className="m-0 px-6 py-5 text-[19px] font-extrabold border-b border-[#ECECF0]">
                {t.published}
              </h2>
              {materials.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-[#F2F2F5]">
                  <span className={`flex-none font-mono text-[12px] font-semibold px-2 py-1.5 rounded-md min-w-[44px] text-center ${
                    m.kind === 'PDF' ? 'bg-[#FDE7E5] text-[#8A1C12]' : 'bg-[#F1F1F4] text-[#1F2937]'
                  }`}>
                    {m.kind}
                  </span>
                  <div className="flex-1 min-w-[200px] flex flex-col gap-0.5">
                    <span className="font-bold text-[15px]">{m.title}</span>
                    <span className="text-[13px] text-[#5F6368]">{m.meta}</span>
                  </div>
                  <button type="button" aria-label={`${t.more} ${m.title}`} className="w-11 h-11 rounded-[10px] border border-[#E6E6EA] bg-white cursor-pointer flex items-center justify-center hover:bg-[#F3F6FA] transition">
                    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                      <circle cx="4" cy="9" r="1.6" fill="#1F2937" />
                      <circle cx="9" cy="9" r="1.6" fill="#1F2937" />
                      <circle cx="14" cy="9" r="1.6" fill="#1F2937" />
                    </svg>
                  </button>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* Tab: CBT Exams */}
        {tab === 'exam' && (
          <div className="flex flex-wrap gap-5 items-start">
            {/* Exam list */}
            <section aria-labelledby="ex-h" className="flex-1 min-w-[300px] bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between gap-2 border-b border-[#ECECF0]">
                <h2 id="ex-h" className="m-0 text-[19px] font-extrabold">{t.examsTitle}</h2>
                <button type="button" className="h-11 px-4 rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer flex items-center gap-1.5 hover:bg-[#0a3880] transition">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                    <path d="M12 5v14 M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t.newExam}
                </button>
              </div>
              {exams.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-[#F2F2F5]">
                  <div className="flex-1 min-w-[180px] flex flex-col gap-0.5">
                    <span className="font-bold text-[15px]">{e.title}</span>
                    <span className="text-[13px] text-[#5F6368]">{e.meta}</span>
                  </div>
                  <span className={`flex-none text-[12px] font-bold px-2.5 py-1.5 rounded-full ${STATUS_STYLE[e.statusKey]}`}>
                    {e.status}
                  </span>
                </div>
              ))}
            </section>

            {/* Exam editor */}
            <section aria-labelledby="ed-h" className="flex-[2_1_480px] min-w-0 bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h2 id="ed-h" className="m-0 text-[19px] font-extrabold">{t.editorTitle}</h2>
                <span className="font-mono text-[13px] text-[#5F6368]">{t.editorMeta}</span>
              </div>

              {/* Warning */}
              <div role="alert" className="px-3.5 py-3 rounded-[10px] bg-[#FCEFC9] text-[#4A3A12] text-sm leading-relaxed">
                <strong>{t.cantPublish}</strong> {t.cantPublishBody}
              </div>

              {/* Schedule fields */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                {[
                  { label: t.opens, val: '21/10/2026 13:00' },
                  { label: t.closes, val: '21/10/2026 15:00' },
                  { label: t.duration, val: '45' },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold">{f.label}</label>
                    <input defaultValue={f.val} className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 font-mono text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition" />
                  </div>
                ))}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-bold">{t.attemptsL}</span>
                  <span className="h-11 flex items-center font-mono font-semibold text-sm text-[#4A4A55]">1</span>
                </div>
              </div>

              <span className="text-[12px] leading-relaxed text-[#5F6368]">{t.deadlineRule}</span>

              {/* Sample question */}
              <div className="flex flex-col gap-2.5 p-4 border border-[#E6E6EA] rounded-[14px]">
                <span className="font-mono text-[12px] font-semibold text-[#5F6368]">{t.q7}</span>
                <span className="text-[16px] font-semibold leading-relaxed">{t.qText}</span>
                {opts.map((o) => (
                  <div
                    key={o.k}
                    className={`flex items-center gap-3 min-h-[44px] px-3.5 rounded-[10px] ${
                      o.key
                        ? 'border-2 border-[#0D47A1] bg-[#EEF4FF]'
                        : 'border border-[#E6E6EA] bg-white'
                    }`}
                  >
                    <span className="font-mono font-semibold">{o.k}</span>
                    <span className="flex-1">{o.v}</span>
                    {o.key && (
                      <span className="text-[12px] font-bold text-[#0D47A1]">{t.answerKey}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2.5 justify-end">
                <button type="button" className="h-11 px-[18px] rounded-[10px] border border-[#1F2937] bg-white text-[#1F2937] font-bold text-sm cursor-pointer flex items-center gap-2 hover:bg-[#F3F6FA] transition">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                    <path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M7 3v5h8 M7 21v-7h10v7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t.saveDraft}
                </button>
                <button type="button" disabled className="h-11 px-[18px] rounded-[10px] border-0 bg-[#DADADF] text-[#4A4A55] font-bold text-sm cursor-not-allowed">
                  {t.publishExam}
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Tab: Students */}
        {tab === 'stu' && (
          <section aria-labelledby="st-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
            <div className="px-6 py-5 flex flex-wrap items-center gap-3 border-b border-[#ECECF0]">
              <h2 id="st-h" className="m-0 text-[19px] font-extrabold flex-1">{t.studentsTitle}</h2>
              <label className="text-[13px] font-bold">{t.examFilter}</label>
              <select className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 text-sm font-semibold text-[#1F2937] bg-white focus:outline-none focus:border-[#0D47A1]">
                <option>{t.lastExam}</option>
              </select>
              <button type="button" className="h-11 px-4 rounded-[10px] border border-[#1F2937] bg-white text-[#1F2937] font-bold text-sm cursor-pointer flex items-center gap-2 hover:bg-[#F3F6FA] transition">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                  <path d="M12 3v12 M7 10l5 5 5-5 M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.exportCls}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[#5F6368] text-[12px] uppercase tracking-widest">
                    <th className="px-6 py-3 font-bold">{t.colName}</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-6 py-3 font-bold">{t.colScore}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t border-[#F2F2F5]">
                      <td className="px-6 py-3.5 font-semibold">{s.name}</td>
                      <td className="px-3 py-3.5">
                        <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${
                          s.done ? 'bg-[#E6F4EA] text-[#1E6B3A]' : 'bg-[#FDE7E5] text-[#8A1C12]'
                        }`}>
                          {s.exam}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono font-semibold">{s.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </TutorLayout>
  )
}
