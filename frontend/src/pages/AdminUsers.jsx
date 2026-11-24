import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import api from '../services/api'

// ── API helpers ───────────────────────────────────────────────────────────────
const getUsers       = (role)        => api.get('/admin/users', { params: { role } })
const createUser     = (body)        => api.post('/admin/users', body)
const toggleUser     = (id)          => api.patch(`/admin/users/${id}/toggle-active`)
const resetPassword  = (id, pwd)     => api.patch(`/admin/users/${id}/reset-password`, { password: pwd, password_confirmation: pwd })

// ── Text strings ──────────────────────────────────────────────────────────────
const TEXT = {
  en: {
    title: 'Students & Tutors',
    subtitle: 'Manage accounts for your bimbel',
    tabTutor: 'Tutors', tabStudent: 'Students',
    newTutor: 'New tutor', newStudent: 'New student',
    formTitleTutor: 'Add tutor account', formTitleStudent: 'Add student account',
    fName: 'Full name', fEmail: 'Email', fPhone: 'Phone number', fPassword: 'Password',
    passHint: 'Min. 8 characters. Share this with the user.',
    save: 'Create account', saving: 'Creating…', cancel: 'Cancel',
    colName: 'Name', colEmail: 'Email', colPhone: 'Phone', colStatus: 'Status', colAction: 'Action',
    active: 'Active', inactive: 'Inactive',
    deactivate: 'Deactivate', activate: 'Reactivate',
    resetPwd: 'Reset password',
    resetPwdTitle: 'Reset password for',
    newPwd: 'New password', resetBtn: 'Reset', resetting: 'Resetting…',
    resetDone: 'Password reset.',
    noUsers: 'No accounts yet. Create one using the button above.',
    loading: 'Loading…',
    errRequired: 'Please fill in all fields.',
    errEmail: 'Enter a valid email.',
    errPass: 'Password must be at least 8 characters.',
    errExists: 'This email is already registered.',
    created: (name) => `Account for ${name} created.`,
    deactNote: 'Deactivated accounts cannot log in but their data is kept.',
  },
  id: {
    title: 'Siswa & Tutor',
    subtitle: 'Kelola akun untuk bimbel Anda',
    tabTutor: 'Tutor', tabStudent: 'Siswa',
    newTutor: 'Tutor baru', newStudent: 'Siswa baru',
    formTitleTutor: 'Buat akun tutor', formTitleStudent: 'Buat akun siswa',
    fName: 'Nama lengkap', fEmail: 'Email', fPhone: 'No. telepon', fPassword: 'Kata sandi',
    passHint: 'Min. 8 karakter. Bagikan ke pengguna.',
    save: 'Buat akun', saving: 'Membuat…', cancel: 'Batal',
    colName: 'Nama', colEmail: 'Email', colPhone: 'No. Telepon', colStatus: 'Status', colAction: 'Tindakan',
    active: 'Aktif', inactive: 'Nonaktif',
    deactivate: 'Nonaktifkan', activate: 'Aktifkan',
    resetPwd: 'Reset kata sandi',
    resetPwdTitle: 'Reset kata sandi untuk',
    newPwd: 'Kata sandi baru', resetBtn: 'Reset', resetting: 'Mereset…',
    resetDone: 'Kata sandi berhasil direset.',
    noUsers: 'Belum ada akun. Buat akun menggunakan tombol di atas.',
    loading: 'Memuat…',
    errRequired: 'Mohon isi semua kolom.',
    errEmail: 'Masukkan email yang valid.',
    errPass: 'Kata sandi minimal 8 karakter.',
    errExists: 'Email ini sudah terdaftar.',
    created: (name) => `Akun untuk ${name} berhasil dibuat.`,
    deactNote: 'Akun nonaktif tidak bisa login tapi datanya tetap tersimpan.',
  },
}

function Spinner() {
  return (
    <div className="flex items-center gap-2 py-8 text-[#5F6368]">
      <div className="w-4 h-4 border-2 border-[#0D47A1] border-t-transparent rounded-full animate-spin flex-none" />
      <span className="text-sm">Memuat…</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]

  // ── Active tab: 'tutor' | 'student' ──────────────────────────────────────────
  const [tab, setTab] = useState('tutor')

  // ── User list ────────────────────────────────────────────────────────────────
  const [users, setUsers]       = useState([])
  const [usersLoading, setUsersLoading] = useState(true)

  const loadUsers = useCallback((role) => {
    setUsersLoading(true)
    getUsers(role)
      .then((r) => setUsers(r.data.data ?? r.data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false))
  }, [])

  useEffect(() => { loadUsers(tab) }, [tab, loadUsers])

  // ── Create form ──────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ name: '', email: '', phone: '', password: '' })
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [creating, setCreating] = useState(false)

  const setF = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', password: '' })
    setFormError('')
    setFormSuccess('')
  }

  const validateForm = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) return t.errRequired
    if (!/\S+@\S+\.\S+/.test(form.email)) return t.errEmail
    if (form.password.length < 8) return t.errPass
    return null
  }

  const handleCreate = async () => {
    setFormError('')
    setFormSuccess('')
    const err = validateForm()
    if (err) { setFormError(err); return }

    setCreating(true)
    try {
      await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        password: form.password,
        password_confirmation: form.password,
        role: tab,
      })
      setFormSuccess(t.created(form.name.trim()))
      resetForm()
      setShowForm(false)
      loadUsers(tab)
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? t.errRequired
      setFormError(msg.toLowerCase().includes('email') ? t.errExists : msg)
    } finally {
      setCreating(false)
    }
  }

  // ── Toggle active ────────────────────────────────────────────────────────────
  const handleToggle = async (u) => {
    try {
      await toggleUser(u.id)
      setUsers((prev) => prev.map((x) =>
        x.id === u.id ? { ...x, is_active: !x.is_active, active: !(x.active ?? x.is_active) } : x
      ))
    } catch { /* silent */ }
  }

  // ── Reset password modal ─────────────────────────────────────────────────────
  const [resetTarget, setResetTarget] = useState(null) // user object
  const [newPwd, setNewPwd]           = useState('')
  const [resetting, setResetting]     = useState(false)
  const [resetMsg, setResetMsg]       = useState('')

  const handleReset = async () => {
    if (!resetTarget || newPwd.length < 8) return
    setResetting(true)
    setResetMsg('')
    try {
      await resetPassword(resetTarget.id, newPwd)
      setResetMsg(t.resetDone)
      setNewPwd('')
      setTimeout(() => { setResetTarget(null); setResetMsg('') }, 1500)
    } catch { /* silent */ }
    finally { setResetting(false) }
  }

  const inputCls = 'h-11 border border-[#C7C7CF] rounded-[10px] px-3 text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition w-full'

  return (
    <AdminLayout lang={lang} setLang={setLang}>
      <div className="p-6 flex flex-col gap-6">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{t.title}</h1>
            <span className="text-sm text-[#5F6368]">{t.subtitle}</span>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(true); resetForm() }}
            className="h-11 px-5 rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer hover:bg-[#0a3880] transition flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M12 5v14 M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {tab === 'tutor' ? t.newTutor : t.newStudent}
          </button>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-[#E6E6EA]">
          {(['tutor', 'student'] ).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => { setTab(role); setShowForm(false); resetForm() }}
              className={`h-11 px-5 border-0 border-b-[3px] bg-transparent font-['Plus_Jakarta_Sans',sans-serif] text-[15px] cursor-pointer transition mb-[-1px] ${
                tab === role
                  ? 'border-[#0D47A1] text-[#1F2937] font-extrabold'
                  : 'border-transparent text-[#5F6368] font-semibold hover:text-[#1F2937]'
              }`}
            >
              {role === 'tutor' ? t.tabTutor : t.tabStudent}
            </button>
          ))}
        </div>

        {/* ── Create form ───────────────────────────────────────────────── */}
        {showForm && (
          <section className="bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-4 shadow-[0_4px_16px_rgba(13,71,161,0.06)]">
            <h2 className="m-0 text-[19px] font-extrabold">
              {tab === 'tutor' ? t.formTitleTutor : t.formTitleStudent}
            </h2>

            {formError && (
              <div role="alert" className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-[#FDE7E5] text-[#8A1C12] text-sm font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4 M12 16h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {formError}
              </div>
            )}

            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold" htmlFor="u-name">{t.fName} *</label>
                <input id="u-name" value={form.name} onChange={setF('name')} placeholder={tab === 'tutor' ? 'Rina Susanti' : 'Aditya Pratama'} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold" htmlFor="u-email">{t.fEmail} *</label>
                <input id="u-email" type="email" value={form.email} onChange={setF('email')} placeholder={tab === 'tutor' ? 'rina@bimbel.id' : 'aditya@bimbel.id'} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold" htmlFor="u-phone">
                  {t.fPhone}
                  <span className="ml-1 text-[11px] font-normal text-[#5F6368]">(opsional)</span>
                </label>
                <div className="flex h-11 border border-[#C7C7CF] rounded-[10px] overflow-hidden focus-within:border-[#0D47A1] transition bg-white">
                  <span className="flex items-center px-3 text-[14px] font-semibold text-[#1F2937] border-r border-[#ECECF0] bg-[#F3F6FA] select-none">
                    +62
                  </span>
                  <input
                    id="u-phone"
                    type="tel"
                    value={form.phone}
                    onChange={setF('phone')}
                    placeholder="812-3456-7890"
                    className="flex-1 min-w-0 h-full border-0 px-3 text-sm text-[#1F2937] focus:outline-none bg-transparent"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold" htmlFor="u-pass">{t.fPassword} *</label>
                <input id="u-pass" type="password" value={form.password} onChange={setF('password')} placeholder="••••••••" className={inputCls} />
                <span className="text-[12px] text-[#5F6368]">{t.passHint}</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="h-11 px-5 rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer hover:bg-[#0a3880] disabled:opacity-60 transition flex items-center gap-2"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M19 8v6 M22 11h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {creating ? t.saving : t.save}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm() }}
                className="h-11 px-4 rounded-[10px] border border-[#C7C7CF] bg-white text-[#1F2937] font-semibold text-sm cursor-pointer hover:bg-[#F3F6FA] transition"
              >
                {t.cancel}
              </button>
            </div>
          </section>
        )}

        {/* Success toast */}
        {formSuccess && (
          <div role="status" className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-[#E6F4EA] text-[#1E6B3A] text-sm font-bold">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {formSuccess}
          </div>
        )}

        {/* ── User table ────────────────────────────────────────────────── */}
        <section className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#ECECF0] flex items-center gap-3">
            <h2 className="m-0 text-[17px] font-extrabold flex-1">
              {tab === 'tutor' ? t.tabTutor : t.tabStudent}
              {!usersLoading && (
                <span className="ml-2 font-mono text-[14px] font-semibold text-[#0D47A1]">({users.length})</span>
              )}
            </h2>
          </div>

          {usersLoading ? (
            <div className="px-6"><Spinner /></div>
          ) : users.length === 0 ? (
            <p className="px-6 py-8 text-[14px] text-[#5F6368] text-center m-0">{t.noUsers}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[#5F6368] text-[12px] uppercase tracking-widest">
                    <th className="px-6 py-3 font-bold">{t.colName}</th>
                    <th className="px-3 py-3 font-bold">{t.colEmail}</th>
                    <th className="px-3 py-3 font-bold">{t.colPhone}</th>
                    <th className="px-3 py-3 font-bold">{t.colStatus}</th>
                    <th className="px-6 py-3 font-bold text-right">{t.colAction}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isActive = u.is_active ?? u.active ?? true
                    return (
                      <tr key={u.id} className="border-t border-[#F2F2F5] hover:bg-[#FAFAFB] transition">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EEF4FF] text-[#0D47A1] flex items-center justify-center font-bold text-[12px] flex-none select-none">
                              {u.name?.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') ?? '?'}
                            </div>
                            <span className="font-semibold text-[#1F2937]">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-[#5F6368]">{u.email}</td>
                        <td className="px-3 py-3.5 font-mono text-[13px] text-[#5F6368]">
                          {u.phone ? (u.phone.startsWith('+') ? u.phone : `+62 ${u.phone}`) : '—'}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${
                            isActive ? 'bg-[#E6F4EA] text-[#1E6B3A]' : 'bg-[#F2F2F5] text-[#4A4A55]'
                          }`}>
                            {isActive ? t.active : t.inactive}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => { setResetTarget(u); setNewPwd(''); setResetMsg('') }}
                              className="h-9 px-3 rounded-lg border border-[#C7C7CF] bg-white text-[#1F2937] font-semibold text-[13px] cursor-pointer hover:bg-[#F3F6FA] transition"
                            >
                              {t.resetPwd}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggle(u)}
                              className={`h-9 px-3 rounded-lg border font-semibold text-[13px] cursor-pointer transition ${
                                isActive
                                  ? 'border-[#C7C7CF] bg-white text-[#1F2937] hover:bg-[#FDE7E5] hover:border-[#B42318] hover:text-[#8A1C12]'
                                  : 'border-[#0D47A1]/30 bg-[#EEF4FF] text-[#0D47A1] hover:bg-[#DBEAFE]'
                              }`}
                            >
                              {isActive ? t.deactivate : t.activate}
                            </button>
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

        {/* Deact note */}
        <p className="text-[13px] text-[#5F6368] m-0">{t.deactNote}</p>

      </div>

      {/* ── Reset password modal ─────────────────────────────────────────── */}
      {resetTarget && (
        <div className="fixed inset-0 bg-[#1D1D1F]/50 flex items-start justify-center pt-24 px-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rp-h"
            className="w-full max-w-[420px] bg-white rounded-[20px] p-7 flex flex-col gap-4 shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
          >
            <h2 id="rp-h" className="m-0 text-[20px] font-extrabold">
              {t.resetPwdTitle}
            </h2>
            <p className="m-0 text-[15px] font-semibold text-[#0D47A1]">{resetTarget.name}</p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold" htmlFor="rp-pwd">{t.newPwd}</label>
              <input
                id="rp-pwd"
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="••••••••"
                className="h-11 border border-[#C7C7CF] rounded-[10px] px-3 text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition"
              />
            </div>

            {resetMsg && (
              <div role="status" className="px-3 py-2.5 rounded-[10px] bg-[#E6F4EA] text-[#1E6B3A] text-sm font-bold">
                {resetMsg}
              </div>
            )}

            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => { setResetTarget(null); setNewPwd(''); setResetMsg('') }}
                className="h-11 px-4 rounded-[10px] border border-[#C7C7CF] bg-white text-[#1F2937] font-semibold text-sm cursor-pointer hover:bg-[#F3F6FA] transition"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting || newPwd.length < 8}
                className="h-11 px-5 rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer hover:bg-[#0a3880] disabled:opacity-60 transition"
              >
                {resetting ? t.resetting : t.resetBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
