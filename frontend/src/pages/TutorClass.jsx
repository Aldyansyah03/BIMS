import { useState, useEffect, useCallback, useRef } from 'react'
import TutorLayout from '../components/layout/TutorLayout'
import {
  getTutorClasses, getMaterials, publishMaterial, deleteMaterial,
  getExams, createExam, updateExam, publishExam,
  getClassResults, exportResults,
} from '../services/tutorService'

// ── Text strings ──────────────────────────────────────────────────────────────
const TEXT = {
  en: {
    myClasses: 'My classes', noClasses: 'No classes assigned.',
    tabs: ['Materials', 'CBT Exams', 'Results & Students'],
    // Materials
    publishTitle: 'Publish a material', fTitle: 'Title', titlePh: 'e.g. Integrals — practice set 2',
    drop: 'Drop a PDF here', dropHint: 'PDF only · up to 20 MB',
    browse: 'Choose file', or: 'or',
    videoLabel: 'Video link (optional)', videoErr: 'Use a secure link starting with https://',
    publishBtn: 'Publish', publishing: 'Publishing…',
    published: 'Published materials', more: 'More actions',
    noMat: 'No materials yet.', delConfirm: 'Delete this material?',
    // Exams
    examsTitle: 'CBT Exams', newExam: 'New exam',
    examTitleLbl: 'Exam title', examTitlePh: 'e.g. Mathematics Tryout 1',
    durationLbl: 'Duration (min)', opensLbl: 'Opens (datetime)', closesLbl: 'Closes (datetime)',
    maxAttemptsLbl: 'Max attempts', noExam: 'No exams yet.',
    cantPublish: 'Cannot publish yet:', cantPublishOk: 'Ready to publish.',
    saveDraft: 'Save draft', saving: 'Saving…', publishExamBtn: 'Publish exam',
    statusLabels: { draft: 'Draft', published: 'Published', closed: 'Closed' },
    // Results
    studentsTitle: 'Students & results', examFilter: 'Exam', allExams: 'All exams',
    colName: 'Name', colStatus: 'Status', colScore: 'Score',
    sSubmitted: 'Submitted', sNotTaken: 'Not taken',
    exportCsv: 'Export CSV', exporting: 'Exporting…',
    noResults: 'No results yet.',
    loading: 'Loading…', errorRetry: 'Retry',
  },
  id: {
    myClasses: 'Kelas saya', noClasses: 'Belum ada kelas.',
    tabs: ['Materi', 'Ujian CBT', 'Hasil & Siswa'],
    // Materials
    publishTitle: 'Terbitkan materi', fTitle: 'Judul', titlePh: 'mis. Integral — latihan 2',
    drop: 'Letakkan PDF di sini', dropHint: 'Hanya PDF · maks. 20 MB',
    browse: 'Pilih berkas', or: 'atau',
    videoLabel: 'Tautan video (opsional)', videoErr: 'Gunakan tautan aman yang diawali https://',
    publishBtn: 'Terbitkan', publishing: 'Menerbitkan…',
    published: 'Materi terbit', more: 'Tindakan lain',
    noMat: 'Belum ada materi.', delConfirm: 'Hapus materi ini?',
    // Exams
    examsTitle: 'Ujian CBT', newExam: 'Ujian baru',
    examTitleLbl: 'Judul ujian', examTitlePh: 'mis. Tryout Matematika 1',
    durationLbl: 'Durasi (menit)', opensLbl: 'Dibuka (tanggal-waktu)', closesLbl: 'Ditutup (tanggal-waktu)',
    maxAttemptsLbl: 'Maks. percobaan', noExam: 'Belum ada ujian.',
    cantPublish: 'Belum bisa diterbitkan:', cantPublishOk: 'Siap diterbitkan.',
    saveDraft: 'Simpan draf', saving: 'Menyimpan…', publishExamBtn: 'Terbitkan ujian',
    statusLabels: { draft: 'Draf', published: 'Terbit', closed: 'Ditutup' },
    // Results
    studentsTitle: 'Siswa & hasil', examFilter: 'Ujian', allExams: 'Semua ujian',
    colName: 'Nama', colStatus: 'Status', colScore: 'Skor',
    sSubmitted: 'Dikumpulkan', sNotTaken: 'Tidak mengerjakan',
    exportCsv: 'Ekspor CSV', exporting: 'Mengekspor…',
    noResults: 'Belum ada hasil.',
    loading: 'Memuat…', errorRetry: 'Coba lagi',
  },
}

const TABS = ['mat', 'exam', 'stu']
const TAB_ICONS = [
  'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
  'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  'M3 3v18h18 M7 16v-5 M12 16V8 M17 16V5',
]

const STATUS_STYLE = {
  draft:     'bg-[#FCEFC9] text-[#6B4A00]',
  published: 'bg-[#E6F4EA] text-[#1E6B3A]',
  closed:    'bg-[#F1F1F4] text-[#4A4A55]',
}

function Spinner() {
  return (
    <div className="flex items-center gap-2 py-5 text-[#5F6368]">
      <div className="w-4 h-4 border-2 border-[#0D47A1] border-t-transparent rounded-full animate-spin flex-none" />
      <span className="text-sm">Memuat…</span>
    </div>
  )
}

function fmtDate(iso, lang) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return iso }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TutorClass() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]

  // ── Class list ───────────────────────────────────────────────────────────────
  const [classes, setClasses]       = useState([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [selClassId, setSelClassId] = useState(null)

  useEffect(() => {
    getTutorClasses()
      .then((r) => {
        const data = r.data.data ?? r.data ?? []
        const arr = Array.isArray(data) ? data : []
        setClasses(arr)
        if (arr.length > 0) setSelClassId(arr[0].id)
      })
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false))
  }, [])

  const selClass = classes.find((c) => c.id === selClassId) ?? null

  const [tab, setTab] = useState('mat')

  // ── Materials ────────────────────────────────────────────────────────────────
  const [materials, setMaterials]         = useState([])
  const [matsLoading, setMatsLoading]     = useState(false)
  const [matTitle, setMatTitle]           = useState('')
  const [videoUrl, setVideoUrl]           = useState('')
  const [pdfFile, setPdfFile]             = useState(null)
  const [matPublishing, setMatPublishing] = useState(false)
  const fileInputRef                      = useRef(null)

  const loadMaterials = useCallback((id) => {
    if (!id) return
    setMatsLoading(true)
    getMaterials(id)
      .then((r) => setMaterials(r.data.data ?? r.data ?? []))
      .catch(() => setMaterials([]))
      .finally(() => setMatsLoading(false))
  }, [])

  useEffect(() => { if (selClassId) loadMaterials(selClassId) }, [selClassId, loadMaterials])

  const videoErr = videoUrl !== '' && !videoUrl.startsWith('https://')

  const handlePublishMaterial = async () => {
    if (!selClassId || !matTitle.trim()) return
    setMatPublishing(true)
    try {
      const fd = new FormData()
      fd.append('title', matTitle.trim())
      if (pdfFile) fd.append('file', pdfFile)
      if (videoUrl && !videoErr) fd.append('video_url', videoUrl)
      await publishMaterial(selClassId, fd)
      setMatTitle('')
      setVideoUrl('')
      setPdfFile(null)
      loadMaterials(selClassId)
    } catch { /* silent */ }
    finally { setMatPublishing(false) }
  }

  const handleDeleteMaterial = async (matId) => {
    if (!window.confirm(t.delConfirm)) return
    try {
      await deleteMaterial(matId)
      setMaterials((prev) => prev.filter((m) => m.id !== matId))
    } catch { /* silent */ }
  }

  // ── Exams ────────────────────────────────────────────────────────────────────
  const [exams, setExams]                 = useState([])
  const [examsLoading, setExamsLoading]   = useState(false)
  const [selExamId, setSelExamId]         = useState(null)
  const [examForm, setExamForm]           = useState({ title: '', duration_minutes: 45, opens_at: '', closes_at: '', max_attempts: 1 })
  const [examSaving, setExamSaving]       = useState(false)
  const [examSaveState, setExamSaveState] = useState('idle') // idle | saved | error
  const [showNewExam, setShowNewExam]     = useState(false)

  const loadExams = useCallback((id) => {
    if (!id) return
    setExamsLoading(true)
    getExams(id)
      .then((r) => {
        const data = r.data.data ?? r.data ?? []
        setExams(Array.isArray(data) ? data : [])
      })
      .catch(() => setExams([]))
      .finally(() => setExamsLoading(false))
  }, [])

  useEffect(() => { if (selClassId) loadExams(selClassId) }, [selClassId, loadExams])

  const selExam = exams.find((e) => e.id === selExamId) ?? null

  // Saat pilih exam, isi form
  useEffect(() => {
    if (selExam) {
      setExamForm({
        title: selExam.title ?? '',
        duration_minutes: selExam.duration_minutes ?? 45,
        opens_at: selExam.opens_at ? selExam.opens_at.slice(0, 16) : '',
        closes_at: selExam.closes_at ? selExam.closes_at.slice(0, 16) : '',
        max_attempts: selExam.max_attempts ?? 1,
      })
    }
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [selExamId])

  const setEF = (key) => (e) => setExamForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSaveDraft = async () => {
    if (!selClassId) return
    setExamSaving(true)
    setExamSaveState('idle')
    try {
      if (selExamId) {
        await updateExam(selExamId, examForm)
      } else {
        const r = await createExam(selClassId, examForm)
        const newExam = r.data.data ?? r.data
        setSelExamId(newExam.id)
      }
      setExamSaveState('saved')
      loadExams(selClassId)
      setShowNewExam(false)
      setTimeout(() => setExamSaveState('idle'), 2000)
    } catch { setExamSaveState('error') }
    finally { setExamSaving(false) }
  }

  const handlePublishExam = async () => {
    if (!selExamId) return
    setExamSaving(true)
    try {
      await publishExam(selExamId)
      loadExams(selClassId)
    } catch { /* silent */ }
    finally { setExamSaving(false) }
  }

  const canPublish = selExam?.status === 'draft' && selExam?.question_count > 0

  // ── Results ──────────────────────────────────────────────────────────────────
  const [results, setResults]           = useState([])
  const [resultsLoading, setResultsLoading] = useState(false)
  const [filterExamId, setFilterExamId] = useState('')
  const [exporting, setExporting]       = useState(false)

  const loadResults = useCallback((classId, examId) => {
    if (!classId) return
    setResultsLoading(true)
    getClassResults(classId, examId || undefined)
      .then((r) => setResults(r.data.data ?? r.data ?? []))
      .catch(() => setResults([]))
      .finally(() => setResultsLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'stu' && selClassId) loadResults(selClassId, filterExamId)
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selClassId, filterExamId, loadResults])

  const handleExportCsv = async () => {
    if (!selClassId) return
    setExporting(true)
    try {
      const res = await exportResults(selClassId, filterExamId || undefined)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `results-class-${selClassId}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
    finally { setExporting(false) }
  }

  return (
    <TutorLayout lang={lang} setLang={setLang}>
      <div className="max-w-[1200px] mx-auto px-6 py-7 pb-12 flex flex-col gap-6">

        {/* ── Class selector / title ─────────────────────────────────────── */}
        {classesLoading ? (
          <Spinner />
        ) : classes.length === 0 ? (
          <p className="text-[#5F6368]">{t.noClasses}</p>
        ) : (
          <>
            {/* Class tabs when multiple classes */}
            {classes.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {classes.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelClassId(c.id)}
                    className={`h-11 px-4 rounded-[10px] font-bold text-sm transition cursor-pointer border ${
                      c.id === selClassId
                        ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                        : 'bg-white text-[#1F2937] border-[#C7C7CF] hover:border-[#0D47A1]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* Class header */}
            {selClass && (
              <div className="flex flex-col gap-1">
                <h1 className="m-0 text-[32px] font-extrabold tracking-[-0.02em]">
                  {selClass.subject ? `${selClass.subject} · ${selClass.name}` : selClass.name}
                </h1>
                <span className="text-[15px] text-[#4A4A55]">
                  {selClass.student_count ?? 0} {lang === 'id' ? 'siswa' : 'students'}
                  {selClass.schedule_label ? ` · ${selClass.schedule_label}` : ''}
                </span>
              </div>
            )}

            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <div role="tablist" aria-label="Class sections" className="flex flex-wrap gap-1.5 border-b border-[#E6E6EA]">
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

            {/* ── Tab: Materials ─────────────────────────────────────────── */}
            {tab === 'mat' && (
              <div className="flex flex-wrap gap-5 items-start">
                {/* Upload form */}
                <section aria-labelledby="pub-h" className="flex-1 min-w-[320px] bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-4">
                  <h2 id="pub-h" className="m-0 text-[19px] font-extrabold">{t.publishTitle}</h2>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold" htmlFor="mat-title">{t.fTitle}</label>
                    <input
                      id="mat-title"
                      value={matTitle}
                      onChange={(e) => setMatTitle(e.target.value)}
                      placeholder={t.titlePh}
                      className="h-11 border border-[#C7C7CF] rounded-[10px] px-3 text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition"
                    />
                  </div>

                  {/* Drop zone */}
                  <div
                    className="flex flex-col items-center gap-2 py-6 px-4 border-2 border-dashed border-[#C7C7CF] rounded-[14px] bg-[#FAFAFB] text-center cursor-pointer hover:border-[#0D47A1] transition"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const f = e.dataTransfer.files[0]
                      if (f?.type === 'application/pdf') setPdfFile(f)
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
                      <path d="M9 4h10l6 6v18H9z" fill="none" stroke="#0D47A1" strokeWidth="2" strokeLinejoin="round" />
                      <path d="M19 4v6h6M17 22v-8m0 0l-3 3m3-3l3 3" fill="none" stroke="#0D47A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {pdfFile ? (
                      <span className="font-bold text-[15px] text-[#0D47A1]">{pdfFile.name}</span>
                    ) : (
                      <span className="font-bold text-[15px]">{t.drop}</span>
                    )}
                    <span className="text-[13px] text-[#5F6368]">{t.dropHint}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setPdfFile(e.target.files[0] ?? null)}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-[13px] text-[#5F6368]">
                    <span className="flex-1 h-px bg-[#E6E6EA]" />{t.or}<span className="flex-1 h-px bg-[#E6E6EA]" />
                  </div>

                  {/* Video link */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold" htmlFor="mat-video">{t.videoLabel}</label>
                    <input
                      id="mat-video"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/…"
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

                  <button
                    type="button"
                    onClick={handlePublishMaterial}
                    disabled={matPublishing || !matTitle.trim() || videoErr || (!pdfFile && !videoUrl)}
                    className="h-12 rounded-xl border-0 bg-[#0D47A1] text-white font-bold text-[15px] cursor-pointer hover:bg-[#0a3880] transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                      <path d="M22 2 11 13 M22 2l-7 20-4-9-9-4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {matPublishing ? t.publishing : t.publishBtn}
                  </button>
                </section>

                {/* Materials list */}
                <section aria-labelledby="list-h" className="flex-[2_1_480px] min-w-0 bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
                  <h2 id="list-h" className="m-0 px-6 py-5 text-[19px] font-extrabold border-b border-[#ECECF0]">
                    {t.published}
                  </h2>
                  {matsLoading ? (
                    <div className="px-6"><Spinner /></div>
                  ) : materials.length === 0 ? (
                    <p className="px-6 py-5 text-[14px] text-[#5F6368] m-0">{t.noMat}</p>
                  ) : (
                    materials.map((m) => {
                      const kind = (m.type ?? m.kind ?? '').toUpperCase()
                      const isPDF = kind === 'PDF'
                      return (
                        <div key={m.id} className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-[#F2F2F5] last:border-0">
                          <span className={`flex-none font-mono text-[12px] font-semibold px-2 py-1.5 rounded-md min-w-[44px] text-center ${
                            isPDF ? 'bg-[#FDE7E5] text-[#8A1C12]' : 'bg-[#F1F1F4] text-[#1F2937]'
                          }`}>
                            {isPDF ? 'PDF' : kind === 'VIDEO' ? 'Video' : kind}
                          </span>
                          <div className="flex-1 min-w-[200px] flex flex-col gap-0.5">
                            <span className="font-bold text-[15px]">{m.title}</span>
                            <span className="text-[13px] text-[#5F6368]">
                              {[m.file_size_label, fmtDate(m.created_at, lang)].filter(Boolean).join(' · ')}
                            </span>
                          </div>
                          <button
                            type="button"
                            aria-label={`${t.more}: ${m.title}`}
                            onClick={() => handleDeleteMaterial(m.id)}
                            className="w-11 h-11 rounded-[10px] border border-[#E6E6EA] bg-white cursor-pointer flex items-center justify-center hover:bg-[#FDE7E5] hover:border-[#B42318] hover:text-[#B42318] transition text-[#5F6368]"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M3 6h18 M19 6l-1 14H6L5 6 M10 11v6 M14 11v6 M9 6V4h6v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      )
                    })
                  )}
                </section>
              </div>
            )}

            {/* ── Tab: CBT Exams ─────────────────────────────────────────── */}
            {tab === 'exam' && (
              <div className="flex flex-wrap gap-5 items-start">
                {/* Exam list */}
                <section aria-labelledby="ex-h" className="flex-1 min-w-[280px] bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
                  <div className="px-6 py-5 flex items-center justify-between gap-2 border-b border-[#ECECF0]">
                    <h2 id="ex-h" className="m-0 text-[19px] font-extrabold">{t.examsTitle}</h2>
                    <button
                      type="button"
                      onClick={() => { setSelExamId(null); setExamForm({ title: '', duration_minutes: 45, opens_at: '', closes_at: '', max_attempts: 1 }); setShowNewExam(true) }}
                      className="h-11 px-4 rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer flex items-center gap-1.5 hover:bg-[#0a3880] transition"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                        <path d="M12 5v14 M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t.newExam}
                    </button>
                  </div>
                  {examsLoading ? (
                    <div className="px-6"><Spinner /></div>
                  ) : exams.length === 0 ? (
                    <p className="px-6 py-5 text-[14px] text-[#5F6368] m-0">{t.noExam}</p>
                  ) : (
                    exams.map((e) => {
                      const status = e.status ?? 'draft'
                      return (
                        <div
                          key={e.id}
                          onClick={() => { setSelExamId(e.id); setShowNewExam(false) }}
                          className={`flex flex-wrap items-center gap-3 px-6 py-4 border-b border-[#F2F2F5] last:border-0 cursor-pointer hover:bg-[#F3F6FA] transition ${selExamId === e.id ? 'bg-[#EEF4FF]' : ''}`}
                        >
                          <div className="flex-1 min-w-[160px] flex flex-col gap-0.5">
                            <span className="font-bold text-[15px]">{e.title}</span>
                            <span className="text-[13px] text-[#5F6368]">
                              {[
                                e.question_count != null && `${e.question_count} ${lang === 'id' ? 'soal' : 'questions'}`,
                                e.duration_minutes && `${e.duration_minutes} ${lang === 'id' ? 'menit' : 'min'}`,
                                e.opens_at && fmtDate(e.opens_at, lang),
                              ].filter(Boolean).join(' · ')}
                            </span>
                          </div>
                          <span className={`flex-none text-[12px] font-bold px-2.5 py-1.5 rounded-full ${STATUS_STYLE[status] ?? STATUS_STYLE.draft}`}>
                            {t.statusLabels[status] ?? status}
                          </span>
                        </div>
                      )
                    })
                  )}
                </section>

                {/* Exam editor */}
                {(selExamId || showNewExam) && (
                  <section aria-labelledby="ed-h" className="flex-[2_1_480px] min-w-0 bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-4">
                    <h2 id="ed-h" className="m-0 text-[19px] font-extrabold">
                      {selExam ? selExam.title : t.newExam}
                    </h2>

                    {/* Publish readiness */}
                    {selExam && (
                      <div role="status" className={`px-3.5 py-3 rounded-[10px] text-sm leading-relaxed ${
                        canPublish
                          ? 'bg-[#E6F4EA] text-[#1E6B3A]'
                          : 'bg-[#FCEFC9] text-[#4A3A12]'
                      }`}>
                        {canPublish ? t.cantPublishOk : (
                          <><strong>{t.cantPublish}</strong> {lang === 'id' ? 'Belum ada soal yang ditambahkan.' : 'No questions added yet.'}</>
                        )}
                      </div>
                    )}

                    {/* Exam form fields */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold" htmlFor="exam-title">{t.examTitleLbl}</label>
                      <input
                        id="exam-title"
                        value={examForm.title}
                        onChange={setEF('title')}
                        placeholder={t.examTitlePh}
                        className="h-11 border border-[#C7C7CF] rounded-[10px] px-3 text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition"
                      />
                    </div>

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold" htmlFor="exam-dur">{t.durationLbl}</label>
                        <input
                          id="exam-dur"
                          type="number"
                          min={1}
                          value={examForm.duration_minutes}
                          onChange={setEF('duration_minutes')}
                          className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 font-mono text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold" htmlFor="exam-opens">{t.opensLbl}</label>
                        <input
                          id="exam-opens"
                          type="datetime-local"
                          value={examForm.opens_at}
                          onChange={setEF('opens_at')}
                          className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 font-mono text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold" htmlFor="exam-closes">{t.closesLbl}</label>
                        <input
                          id="exam-closes"
                          type="datetime-local"
                          value={examForm.closes_at}
                          onChange={setEF('closes_at')}
                          className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 font-mono text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold" htmlFor="exam-att">{t.maxAttemptsLbl}</label>
                        <input
                          id="exam-att"
                          type="number"
                          min={1}
                          value={examForm.max_attempts}
                          onChange={setEF('max_attempts')}
                          className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 font-mono text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition"
                        />
                      </div>
                    </div>

                    {examSaveState === 'saved' && (
                      <div role="status" className="px-3.5 py-2.5 rounded-[10px] bg-[#E6F4EA] text-[#1E6B3A] text-sm font-bold">
                        {lang === 'id' ? 'Tersimpan.' : 'Saved.'}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2.5 justify-end">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={examSaving || !examForm.title.trim()}
                        className="h-11 px-[18px] rounded-[10px] border border-[#1F2937] bg-white text-[#1F2937] font-bold text-sm cursor-pointer flex items-center gap-2 hover:bg-[#F3F6FA] transition disabled:opacity-60"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                          <path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M7 3v5h8 M7 21v-7h10v7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {examSaving ? t.saving : t.saveDraft}
                      </button>
                      <button
                        type="button"
                        onClick={handlePublishExam}
                        disabled={!canPublish || examSaving}
                        className="h-11 px-[18px] rounded-[10px] border-0 font-bold text-sm cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed bg-[#0D47A1] text-white hover:bg-[#0a3880]"
                      >
                        {t.publishExamBtn}
                      </button>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ── Tab: Results & Students ────────────────────────────────── */}
            {tab === 'stu' && (
              <section aria-labelledby="st-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
                <div className="px-6 py-5 flex flex-wrap items-center gap-3 border-b border-[#ECECF0]">
                  <h2 id="st-h" className="m-0 text-[19px] font-extrabold flex-1">{t.studentsTitle}</h2>
                  <label className="text-[13px] font-bold" htmlFor="res-filter">{t.examFilter}</label>
                  <select
                    id="res-filter"
                    value={filterExamId}
                    onChange={(e) => setFilterExamId(e.target.value)}
                    className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 text-sm font-semibold text-[#1F2937] bg-white focus:outline-none focus:border-[#0D47A1]"
                  >
                    <option value="">{t.allExams}</option>
                    {exams.map((e) => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={exporting}
                    className="h-11 px-4 rounded-[10px] border border-[#1F2937] bg-white text-[#1F2937] font-bold text-sm cursor-pointer flex items-center gap-2 hover:bg-[#F3F6FA] transition disabled:opacity-60"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                      <path d="M12 3v12 M7 10l5 5 5-5 M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {exporting ? t.exporting : t.exportCsv}
                  </button>
                </div>

                {resultsLoading ? (
                  <div className="px-6"><Spinner /></div>
                ) : results.length === 0 ? (
                  <p className="px-6 py-6 text-[14px] text-[#5F6368] m-0">{t.noResults}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] border-collapse text-sm">
                      <thead>
                        <tr className="text-left text-[#5F6368] text-[12px] uppercase tracking-widest">
                          <th className="px-6 py-3 font-bold">{t.colName}</th>
                          <th className="px-3 py-3 font-bold">{t.colStatus}</th>
                          <th className="px-6 py-3 font-bold">{t.colScore}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => {
                          const submitted = r.status === 'submitted'
                          return (
                            <tr key={r.id} className="border-t border-[#F2F2F5]">
                              <td className="px-6 py-3.5 font-semibold">{r.name}</td>
                              <td className="px-3 py-3.5">
                                <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${
                                  submitted ? 'bg-[#E6F4EA] text-[#1E6B3A]' : 'bg-[#FDE7E5] text-[#8A1C12]'
                                }`}>
                                  {submitted ? t.sSubmitted : t.sNotTaken}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 font-mono font-semibold">
                                {r.score != null ? r.score : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </TutorLayout>
  )
}
