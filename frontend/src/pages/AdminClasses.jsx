import { useState } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import { MOCK_CLASSES, MOCK_MEMBERS } from '../mock/admin'

const TEXT = {
  en: {
    classes: 'Classes', newClass: 'New class', students: 'students',
    className: 'Class name', subject: 'Subject', math: 'Mathematics', save: 'Save',
    tutors: 'Assigned tutors', removeTutor: 'Remove tutor', addTutor: 'Add tutor',
    tutorRule: 'At least one tutor is required.',
    members: 'Students in this class', addStudents: 'Add students',
    search: 'Search students', searchPh: 'Name or email',
    sameTenant: 'Only students from your own bimbel appear here.',
    add: 'Add', selected: 'selected',
    colName: 'Name', colEmail: 'Email', colStatus: 'Status', colAction: 'Action',
    active: 'Active', inactive: 'Inactive', deactivate: 'Deactivate', activate: 'Reactivate',
    moreRows: 'Showing 6 of the class list · sorted by name',
    deactNote: 'Students with exam results cannot be deleted. Deactivating keeps their scores in reports and stops them from logging in.',
    notIn: 'not in a class', inOther: 'also in Class 11 IPA',
    nav: ['Dashboard', 'Students & tutors', 'Classes', 'Reports', 'Subscription'],
  },
  id: {
    classes: 'Kelas', newClass: 'Kelas baru', students: 'siswa',
    className: 'Nama kelas', subject: 'Mata pelajaran', math: 'Matematika', save: 'Simpan',
    tutors: 'Tutor pengampu', removeTutor: 'Hapus tutor', addTutor: 'Tambah tutor',
    tutorRule: 'Minimal satu tutor wajib dipilih.',
    members: 'Siswa di kelas ini', addStudents: 'Tambah siswa',
    search: 'Cari siswa', searchPh: 'Nama atau email',
    sameTenant: 'Hanya siswa dari bimbel Anda sendiri yang muncul di sini.',
    add: 'Tambahkan', selected: 'dipilih',
    colName: 'Nama', colEmail: 'Email', colStatus: 'Status', colAction: 'Tindakan',
    active: 'Aktif', inactive: 'Nonaktif', deactivate: 'Nonaktifkan', activate: 'Aktifkan lagi',
    moreRows: 'Menampilkan 6 dari daftar kelas · urut nama',
    deactNote: 'Siswa yang sudah memiliki nilai tidak dapat dihapus. Menonaktifkan akun menjaga nilainya di laporan dan mencegahnya login.',
    notIn: 'belum punya kelas', inOther: 'juga di Kelas 11 IPA',
    nav: ['Dasbor', 'Siswa & tutor', 'Kelas', 'Laporan', 'Langganan'],
  },
}

const CANDIDATES = [
  { id: 10, name: 'Galih Ramadhan', noteKey: 'notIn' },
  { id: 11, name: 'Hana Putri', noteKey: 'notIn' },
  { id: 12, name: 'Indra Kusuma', noteKey: 'inOther' },
]

export default function AdminClasses() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]

  const classes = MOCK_CLASSES[lang]
  const [selClass, setSelClass] = useState(0)
  const [members, setMembers] = useState(MOCK_MEMBERS)
  const [showPicker, setShowPicker] = useState(false)
  const [picked, setPicked] = useState({})
  const [search, setSearch] = useState('')

  const toggleActive = (id) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    )
  }

  const togglePick = (id) => {
    setPicked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const nPicked = Object.values(picked).filter(Boolean).length

  const addPicked = () => {
    setShowPicker(false)
    setPicked({})
  }

  const filtered = CANDIDATES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout lang={lang} setLang={setLang}>
      <div className="flex flex-wrap gap-6 items-start">

        {/* Kiri — list kelas */}
        <section aria-labelledby="cl-h" className="flex-1 min-w-[220px] max-w-[280px] flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h1 id="cl-h" className="m-0 text-[26px] font-extrabold tracking-[-0.02em]">
              {t.classes}
            </h1>
            <button
              type="button"
              className="h-11 px-3.5 rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer flex items-center gap-1.5 hover:bg-[#0a3880] transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                <path d="M12 5v14 M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.newClass}
            </button>
          </div>

          {classes.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelClass(i)}
              aria-current={i === selClass ? 'true' : 'false'}
              className={`flex flex-col items-start gap-1 p-4 rounded-[14px] cursor-pointer text-left font-['Plus_Jakarta_Sans',sans-serif] w-full transition ${
                i === selClass
                  ? 'border-2 border-[#0D47A1] bg-white'
                  : 'border border-[#E6E6EA] bg-white hover:border-[#0D47A1]/30'
              }`}
            >
              <span className="font-extrabold text-[15px] text-[#1F2937]">{c.name}</span>
              <span className="text-[13px] text-[#5F6368]">
                {c.tutor} · {c.students} {t.students}
              </span>
            </button>
          ))}
        </section>

        {/* Kanan — detail kelas */}
        <section
          aria-labelledby="cd-h"
          className="flex-[3_1_560px] min-w-0 bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-6"
        >
          {/* Edit nama & mapel */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
              <label className="text-[13px] font-bold">{t.className}</label>
              <input
                defaultValue={classes[selClass]?.name}
                className="h-11 border border-[#C7C7CF] rounded-[10px] px-3 text-[15px] font-semibold text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition"
              />
            </div>
            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
              <label className="text-[13px] font-bold">{t.subject}</label>
              <select className="h-11 border border-[#C7C7CF] rounded-[10px] px-2.5 text-[15px] font-semibold text-[#1F2937] bg-white focus:outline-none focus:border-[#0D47A1] transition">
                <option>{t.math}</option>
              </select>
            </div>
            <button
              type="button"
              className="h-11 px-[18px] rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer hover:bg-[#0a3880] transition"
            >
              {t.save}
            </button>
          </div>

          {/* Tutor */}
          <div className="flex flex-col gap-2.5">
            <h2 id="cd-h" className="m-0 text-[17px] font-extrabold">{t.tutors}</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="inline-flex items-center gap-2 h-10 pl-3.5 pr-1.5 rounded-full bg-[#EEF4FF] text-[#0D47A1] font-bold text-sm">
                {classes[selClass]?.tutor}
                <button
                  type="button"
                  aria-label={t.removeTutor}
                  className="w-8 h-8 rounded-full border-0 bg-transparent cursor-pointer flex items-center justify-center hover:bg-[#0D47A1]/10 transition"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="#0D47A1" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
              <button
                type="button"
                className="h-10 px-3.5 rounded-full border-[1.5px] border-dashed border-[#C7C7CF] bg-white text-[#1F2937] font-bold text-[13px] cursor-pointer flex items-center gap-1.5 hover:border-[#0D47A1] hover:text-[#0D47A1] transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M19 8v6 M22 11h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.addTutor}
              </button>
              <span className="text-[13px] text-[#5F6368]">{t.tutorRule}</span>
            </div>
          </div>

          {/* Members */}
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

            {/* Picker */}
            {showPicker && (
              <div className="flex flex-col gap-2.5 p-4 rounded-[14px] bg-[#F3F6FA] border border-[#E6E6EA]">
                <label className="text-[13px] font-bold">{t.search}</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchPh}
                  className="h-11 border border-[#C7C7CF] rounded-[10px] px-3 text-sm text-[#1F2937] bg-white focus:outline-none focus:border-[#0D47A1] transition"
                />
                {filtered.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 min-h-[44px] text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!picked[c.id]}
                      onChange={() => togglePick(c.id)}
                      className="w-5 h-5 accent-[#0D47A1]"
                    />
                    <span className="font-semibold text-[#1F2937]">{c.name}</span>
                    <span className="text-[#5F6368]">{t[c.noteKey]}</span>
                  </label>
                ))}
                <span className="text-[12px] text-[#5F6368]">{t.sameTenant}</span>
                <button
                  type="button"
                  onClick={addPicked}
                  className="self-start h-11 px-[18px] rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer hover:bg-[#0a3880] transition"
                >
                  {t.add} ({nPicked} {t.selected})
                </button>
              </div>
            )}

            {/* Members table */}
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
                  {members.map((m) => (
                    <tr key={m.id} className="border-t border-[#F2F2F5]">
                      <td className="py-3 pr-3 font-semibold text-[#1F2937]">{m.name}</td>
                      <td className="py-3 px-3 text-[#4A4A55]">{m.email}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${
                          m.active
                            ? 'bg-[#E6F4EA] text-[#1E6B3A]'
                            : 'bg-[#F2F2F5] text-[#4A4A55]'
                        }`}>
                          {m.active ? t.active : t.inactive}
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleActive(m.id)}
                          className="h-10 px-3 rounded-lg border border-[#C7C7CF] bg-white text-[#1F2937] font-semibold text-[13px] cursor-pointer hover:bg-[#F3F6FA] transition"
                        >
                          {m.active ? t.deactivate : t.activate}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <span className="text-[13px] text-[#5F6368]">{t.moreRows}</span>

            <div className="px-3.5 py-3 rounded-[10px] bg-[#DBEAFE] text-[#1e40af] text-[13px] leading-relaxed">
              {t.deactNote}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
