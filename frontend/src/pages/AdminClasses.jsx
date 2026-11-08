import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import api from '../services/api'

// ── API helpers (belum dipisah ke adminService agar mudah dilihat di sini) ────
const getClasses        = ()          => api.get('/admin/classes')
const getClassMembers   = (id)        => api.get(`/admin/classes/${id}/students`)
const getClassTutors    = (id)        => api.get(`/admin/classes/${id}/tutors`)
const updateClass       = (id, body)  => api.put(`/admin/classes/${id}`, body)
const createClass       = (body)      => api.post('/admin/classes', body)
const addStudents       = (id, ids)   => api.post(`/admin/classes/${id}/students`, { student_ids: ids })
const searchStudents    = (q)         => api.get('/admin/students/search', { params: { q } })
const getAllTutors       = ()          => api.get('/admin/tutors')
const assignTutor       = (id, tid)   => api.post(`/admin/classes/${id}/tutors`, { tutor_id: tid })
const removeTutorFromCls = (id, tid)  => api.delete(`/admin/classes/${id}/tutors/${tid}`)
const toggleMemberStatus = (uid)      => api.patch(`/admin/students/${uid}/toggle-active`)

// ── Text strings ──────────────────────────────────────────────────────────────
const TEXT = {
  en: {
    classes: 'Classes', newClass: 'New class', students: 'students',
    className: 'Class name', subject: 'Subject', save: 'Save', saving: 'Saving…', saved: 'Saved.',
    tutors: 'Assigned tutors', removeTutor: 'Remove', addTutor: 'Add tutor',
    tutorRule: 'At least one tutor is required.',
    members: 'Students in this class', addStudents: 'Add students',
    search: 'Search students', searchPh: 'Name or email',
    sameTenant: 'Only students from your own bimbel appear here.',
    add: 'Add', selected: 'selected', cancel: 'Cancel',
    colName: 'Name', colEmail: 'Email', colStatus: 'Status', colAction: 'Action',
    active: 'Active', inactive: 'Inactive', deactivate: 'Deactivate', activate: 'Reactivate',
    deactNote: 'Students with exam results cannot be deleted. Deactivating keeps their scores in reports and stops them from logging in.',
    loading: 'Loading…', errorRetry: 'Try again', noClass: 'No classes yet.',
    noMembers: 'No students in this class yet.',
    pick: 'Pick class to see details.',
    newClassPh: 'e.g. Class 12 IPA',
  },
  id: {
    classes: 'Kelas', newClass: 'Kelas baru', students: 'siswa',
    className: 'Nama kelas', subject: 'Mata pelajaran', save: 'Simpan', saving: 'Menyimpan…', saved: 'Tersimpan.',
    tutors: 'Tutor pengampu', removeTutor: 'Hapus', addTutor: 'Tambah tutor',
    tutorRule: 'Minimal satu tutor wajib dipilih.',
    members: 'Siswa di kelas ini', addStudents: 'Tambah siswa',
    search: 'Cari siswa', searchPh: 'Nama atau email',
    sameTenant: 'Hanya siswa dari bimbel Anda sendiri yang muncul di sini.',
    add: 'Tambahkan', selected: 'dipilih', cancel: 'Batal',
    colName: 'Nama', colEmail: 'Email', colStatus: 'Status', colAction: 'Tindakan',
    active: 'Aktif', inactive: 'Nonaktif', deactivate: 'Nonaktifkan', activate: 'Aktifkan',
    deactNote: 'Siswa yang sudah memiliki nilai tidak dapat dihapus. Menonaktifkan akun menjaga nilainya di laporan dan mencegahnya login.',
    loading: 'Memuat…', errorRetry: 'Coba lagi', noClass: 'Belum ada kelas.',
    noMembers: 'Belum ada siswa di kelas ini.',
    pick: 'Pilih kelas untuk melihat detail.',
    newClassPh: 'mis. Kelas 12 IPA',
  },
}

function Spinner() {
  return (
    <div className="flex items-center gap-2 py-5 text-[#5F6368]">
      <div className="w-4 h-4 border-2 border-[#0D47A1] border-t-transparent rounded-full animate-spin flex-none" />
      <span className="text-sm">Memuat…</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminClasses() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]

  // ── Classes list ─────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [selIdx, setSelIdx] = useState(0)

  const loadClasses = useCallback(() => {
    setClassesLoading(true)
    getClasses()
      .then((r) => {
        const data = r.data.data ?? r.data ?? []
        setClasses(Array.isArray(data) ? data : [])
      })
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false))
  }, [])

  useEffect(() => { loadClasses() }, [loadClasses])

  const selClass = classes[selIdx] ?? null

  // ── Class detail: members & tutors ───────────────────────────────────────────
  const [members, setMembers]           = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [classTutors, setClassTutors]   = useState([])
  const [tutorsLoading, setTutorsLoading]   = useState(false)

  const loadDetail = useCallback((classId) => {
    if (!classId) return
    setMembersLoading(true)
    setTutorsLoading(true)
    getClassMembers(classId)
      .then((r) => setMembers(r.data.data ?? r.data ?? []))
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false))
    getClassTutors(classId)
      .then((r) => setClassTutors(r.data.data ?? r.data ?? []))
      .catch(() => setClassTutors([]))
      .finally(() => setTutorsLoading(false))
  }, [])

  useEffect(() => {
    if (selClass) loadDetail(selClass.id)
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [selClass?.id, loadDetail])

  // ── Edit class info ──────────────────────────────────────────────────────────
  const [editName, setEditName]       = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [saveState, setSaveState]     = useState('idle') // idle | saving | saved | error

  useEffect(() => {
    setEditName(selClass?.name ?? '')
    setEditSubject(selClass?.subject ?? '')
    setSaveState('idle')
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [selClass?.id])

  const handleSaveClass = async () => {
    if (!selClass) return
    setSaveState('saving')
    try {
      await updateClass(selClass.id, { name: editName, subject: editSubject })
      setSaveState('saved')
      loadClasses()
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
    }
  }

  // ── New class ────────────────────────────────────────────────────────────────
  const [showNew, setShowNew]         = useState(false)
  const [newName, setNewName]         = useState('')
  const [newSubject, setNewSubject]   = useState('')
  const [creating, setCreating]       = useState(false)

  const handleCreateClass = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await createClass({ name: newName.trim(), subject: newSubject.trim() })
      setShowNew(false)
      setNewName('')
      setNewSubject('')
      loadClasses()
    } catch { /* silent */ }
    finally { setCreating(false) }
  }

  // ── Add students picker ──────────────────────────────────────────────────────
  const [showPicker, setShowPicker]   = useState(false)
  const [search, setSearch]           = useState('')
  const [candidates, setCandidates]   = useState([])
  const [searching, setSearching]     = useState(false)
  const [picked, setPicked]           = useState({})
  const [adding, setAdding]           = useState(false)

  useEffect(() => {
    if (!showPicker) { setSearch(''); setCandidates([]); setPicked({}) }
  }, [showPicker])

  useEffect(() => {
    if (!showPicker) return
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await searchStudents(search)
        setCandidates(r.data.data ?? r.data ?? [])
      } catch {
        setCandidates([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, showPicker])

  const nPicked = Object.values(picked).filter(Boolean).length

  const handleAddStudents = async () => {
    if (!selClass || nPicked === 0) return
    setAdding(true)
    const ids = Object.entries(picked).filter(([, v]) => v).map(([k]) => Number(k))
    try {
      await addStudents(selClass.id, ids)
      setShowPicker(false)
      loadDetail(selClass.id)
    } catch { /* silent */ }
    finally { setAdding(false) }
  }

  // ── Toggle member active/inactive ────────────────────────────────────────────
  const handleToggleActive = async (member) => {
    try {
      await toggleMemberStatus(member.id)
      setMembers((prev) =>
        prev.map((m) => m.id === member.id ? { ...m, active: !m.active, is_active: !m.is_active } : m)
      )
    } catch { /* silent */ }
  }

  // ── Add tutor dropdown ───────────────────────────────────────────────────────
  const [allTutors, setAllTutors]       = useState([])
  const [showAddTutor, setShowAddTutor] = useState(false)
  const [selTutorId, setSelTutorId]     = useState('')

  useEffect(() => {
    getAllTutors().then((r) => setAllTutors(r.data.data ?? r.data ?? [])).catch(() => {})
  }, [])

  const handleAddTutor = async () => {
    if (!selClass || !selTutorId) return
    try {
      await assignTutor(selClass.id, selTutorId)
      setShowAddTutor(false)
      setSelTutorId('')
      loadDetail(selClass.id)
    } catch { /* silent */ }
  }

  const handleRemoveTutor = async (tutorId) => {
    if (!selClass) return
    try {
      await removeTutorFromCls(selClass.id, tutorId)
      loadDetail(selClass.id)
    } catch { /* silent */ }
  }

  return (
    <AdminLayout lang={lang} setLang={setLang}>
      <div className="flex flex-wrap gap-6 items-start">

        {/* ── Left: class list ─────────────────────────────────────────────── */}
        <section aria-labelledby="cl-h" className="flex-1 min-w-[220px] max-w-[280px] flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h1 id="cl-h" className="m-0 text-[26px] font-extrabold tracking-[-0.02em]">
              {t.classes}
            </h1>
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="h-11 px-3.5 rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer flex items-center gap-1.5 hover:bg-[#0a3880] transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                <path d="M12 5v14 M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.newClass}
            </button>
          </div>

          {/* New class inline form */}
          {showNew && (
            <div className="flex flex-col gap-2 p-3.5 border border-[#0D47A1]/30 rounded-[12px] bg-[#EEF4FF]">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t.newClassPh}
                className="h-10 border border-[#C7C7CF] rounded-[9px] px-2.5 text-sm font-semibold text-[#1F2937] focus:outline-none focus:border-[#0D47A1]"
              />
              <input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder={t.subject}
                className="h-10 border border-[#C7C7CF] rounded-[9px] px-2.5 text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateClass}
                  disabled={creating || !newName.trim()}
                  className="flex-1 h-10 rounded-[9px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer hover:bg-[#0a3880] disabled:opacity-60 transition"
                >
                  {creating ? t.saving : t.save}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="h-10 px-3 rounded-[9px] border border-[#C7C7CF] bg-white text-[#1F2937] font-semibold text-sm cursor-pointer hover:bg-[#F3F6FA] transition"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}

          {classesLoading ? (
            <Spinner />
          ) : classes.length === 0 ? (
            <p className="text-[14px] text-[#5F6368]">{t.noClass}</p>
          ) : (
            classes.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelIdx(i)}
                aria-current={i === selIdx ? 'true' : 'false'}
                className={`flex flex-col items-start gap-1 p-4 rounded-[14px] cursor-pointer text-left font-['Plus_Jakarta_Sans',sans-serif] w-full transition ${
                  i === selIdx
                    ? 'border-2 border-[#0D47A1] bg-white'
                    : 'border border-[#E6E6EA] bg-white hover:border-[#0D47A1]/30'
                }`}
              >
                <span className="font-extrabold text-[15px] text-[#1F2937]">{c.name}</span>
                <span className="text-[13px] text-[#5F6368]">
                  {c.tutor_name ?? (classTutors[0]?.name ?? '—')} · {c.student_count ?? 0} {t.students}
                </span>
              </button>
            ))
          )}
        </section>

        {/* ── Right: class detail ──────────────────────────────────────────── */}
        <section
          aria-labelledby="cd-h"
          className="flex-[3_1_560px] min-w-0 bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-6"
        >
          {!selClass ? (
            <p className="text-[14px] text-[#5F6368]">{t.pick}</p>
          ) : (
            <>
              {/* Edit nama & subject */}
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold" htmlFor="cls-name">{t.className}</label>
                  <input
                    id="cls-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-11 border border-[#C7C7CF] rounded-[10px] px-3 text-[15px] font-semibold text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition"
                  />
                </div>
                <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold" htmlFor="cls-subj">{t.subject}</label>
                  <input
                    id="cls-subj"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder={t.subject}
                    className="h-11 border border-[#C7C7CF] rounded-[10px] px-3 text-[15px] text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveClass}
                    disabled={saveState === 'saving'}
                    className="h-11 px-[18px] rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer hover:bg-[#0a3880] disabled:opacity-60 transition"
                  >
                    {saveState === 'saving' ? t.saving : t.save}
                  </button>
                  {saveState === 'saved' && (
                    <span className="text-[13px] font-bold text-[#1E6B3A]">{t.saved}</span>
                  )}
                </div>
              </div>

              {/* ── Tutors ──────────────────────────────────────────────── */}
              <div className="flex flex-col gap-2.5">
                <h2 id="cd-h" className="m-0 text-[17px] font-extrabold">{t.tutors}</h2>
                {tutorsLoading ? (
                  <Spinner />
                ) : (
                  <div className="flex flex-wrap gap-2 items-center">
                    {classTutors.map((tu) => (
                      <span
                        key={tu.id}
                        className="inline-flex items-center gap-2 h-10 pl-3.5 pr-1.5 rounded-full bg-[#EEF4FF] text-[#0D47A1] font-bold text-sm"
                      >
                        {tu.name}
                        <button
                          type="button"
                          aria-label={`${t.removeTutor} ${tu.name}`}
                          onClick={() => handleRemoveTutor(tu.id)}
                          className="w-8 h-8 rounded-full border-0 bg-transparent cursor-pointer flex items-center justify-center hover:bg-[#0D47A1]/10 transition"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                            <path d="M2 2l8 8M10 2l-8 8" stroke="#0D47A1" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </button>
                      </span>
                    ))}

                    {/* Add tutor dropdown */}
                    {showAddTutor ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selTutorId}
                          onChange={(e) => setSelTutorId(e.target.value)}
                          className="h-10 border border-[#C7C7CF] rounded-full px-3 text-sm font-medium bg-white focus:outline-none focus:border-[#0D47A1]"
                        >
                          <option value="">— {t.fTutor ?? t.addTutor} —</option>
                          {allTutors.map((tu) => (
                            <option key={tu.id} value={tu.id}>{tu.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddTutor}
                          disabled={!selTutorId}
                          className="h-10 px-3.5 rounded-full border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer hover:bg-[#0a3880] disabled:opacity-60 transition"
                        >
                          {t.add}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddTutor(false)}
                          className="h-10 px-3 rounded-full border border-[#C7C7CF] bg-white text-[#1F2937] font-semibold text-sm cursor-pointer hover:bg-[#F3F6FA] transition"
                        >
                          {t.cancel}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddTutor(true)}
                        className="h-10 px-3.5 rounded-full border-[1.5px] border-dashed border-[#C7C7CF] bg-white text-[#1F2937] font-bold text-[13px] cursor-pointer flex items-center gap-1.5 hover:border-[#0D47A1] hover:text-[#0D47A1] transition"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M19 8v6 M22 11h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t.addTutor}
                      </button>
                    )}

                    {classTutors.length === 0 && (
                      <span className="text-[13px] text-[#5F6368]">{t.tutorRule}</span>
                    )}
                  </div>
                )}
              </div>

              {/* ── Members ─────────────────────────────────────────────── */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="m-0 text-[17px] font-extrabold">
                    {t.members}{' '}
                    <span className="font-mono font-semibold text-[#0D47A1]">({members.length})</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    aria-expanded={showPicker}
                    className="h-11 px-4 rounded-[10px] border border-[#1F2937] bg-white text-[#1F2937] font-bold text-sm cursor-pointer flex items-center gap-2 hover:bg-[#F3F6FA] transition"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M19 8v6 M22 11h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t.addStudents}
                  </button>
                </div>

                {/* Search & add picker */}
                {showPicker && (
                  <div className="flex flex-col gap-2.5 p-4 rounded-[14px] bg-[#F3F6FA] border border-[#E6E6EA]">
                    <label className="text-[13px] font-bold" htmlFor="stud-search">{t.search}</label>
                    <input
                      id="stud-search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t.searchPh}
                      className="h-11 border border-[#C7C7CF] rounded-[10px] px-3 text-sm text-[#1F2937] bg-white focus:outline-none focus:border-[#0D47A1] transition"
                    />

                    {searching ? (
                      <Spinner />
                    ) : candidates.length === 0 ? (
                      <p className="text-[13px] text-[#5F6368] m-0">{search ? 'Tidak ditemukan.' : 'Ketik untuk mencari.'}</p>
                    ) : (
                      candidates.map((c) => {
                        const isMember = members.some((m) => m.id === c.id)
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-3 min-h-[44px] text-sm cursor-pointer ${isMember ? 'opacity-50' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={!!picked[c.id]}
                              disabled={isMember}
                              onChange={() => !isMember && setPicked((p) => ({ ...p, [c.id]: !p[c.id] }))}
                              className="w-5 h-5 accent-[#0D47A1]"
                            />
                            <span className="font-semibold text-[#1F2937]">{c.name}</span>
                            <span className="text-[#5F6368]">{c.email}</span>
                          </label>
                        )
                      })
                    )}

                    <span className="text-[12px] text-[#5F6368]">{t.sameTenant}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddStudents}
                        disabled={nPicked === 0 || adding}
                        className="h-11 px-[18px] rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer hover:bg-[#0a3880] disabled:opacity-60 transition"
                      >
                        {adding ? t.saving : `${t.add} (${nPicked} ${t.selected})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPicker(false)}
                        className="h-11 px-4 rounded-[10px] border border-[#C7C7CF] bg-white text-[#1F2937] font-semibold text-sm cursor-pointer hover:bg-[#F3F6FA] transition"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                )}

                {/* Members table */}
                {membersLoading ? (
                  <Spinner />
                ) : members.length === 0 ? (
                  <p className="text-[14px] text-[#5F6368] m-0">{t.noMembers}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-sm">
                      <thead>
                        <tr className="text-left text-[#5F6368] text-[12px] uppercase tracking-widest">
                          <th className="py-2.5 pr-3 font-bold">{t.colName}</th>
                          <th className="py-2.5 px-3 font-bold">{t.colEmail}</th>
                          <th className="py-2.5 px-3 font-bold">{t.colStatus}</th>
                          <th className="py-2.5 pl-3 font-bold text-right">{t.colAction}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m) => {
                          const isActive = m.active ?? m.is_active ?? true
                          return (
                            <tr key={m.id} className="border-t border-[#F2F2F5]">
                              <td className="py-3 pr-3 font-semibold text-[#1F2937]">{m.name}</td>
                              <td className="py-3 px-3 text-[#4A4A55]">{m.email}</td>
                              <td className="py-3 px-3">
                                <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${
                                  isActive ? 'bg-[#E6F4EA] text-[#1E6B3A]' : 'bg-[#F2F2F5] text-[#4A4A55]'
                                }`}>
                                  {isActive ? t.active : t.inactive}
                                </span>
                              </td>
                              <td className="py-3 pl-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(m)}
                                  className="h-10 px-3 rounded-lg border border-[#C7C7CF] bg-white text-[#1F2937] font-semibold text-[13px] cursor-pointer hover:bg-[#F3F6FA] transition"
                                >
                                  {isActive ? t.deactivate : t.activate}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="px-3.5 py-3 rounded-[10px] bg-[#DBEAFE] text-[#1e40af] text-[13px] leading-relaxed">
                  {t.deactNote}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}
