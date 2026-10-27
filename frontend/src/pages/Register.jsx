import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
// mock tidak dipakai lagi

const PLANS = ['Basic', 'Standard', 'Pro']

const TEXT = {
  en: {
    title: 'Register your bimbel',
    stepsAria: 'Registration steps',
    steps: ['Fill in details', 'Waiting for approval', 'Workspace active'],
    secBimbel: 'Bimbel details',
    fName: 'Bimbel name', fCity: 'City', fPhone: 'WhatsApp number', fWs: 'Workspace address',
    wsOk: 'Address available', wsErr: 'Workspace address is required.',
    secAdmin: 'Admin Bimbel account',
    fAdminName: 'Full name', fPass: 'Password', passHint: 'At least 8 characters.',
    secPlan: 'Plan', perMonth: '/ month', upTo: 'Up to [USER LIMIT] users',
    planNote: 'Monthly billing. All plans include every learning feature; they differ only in the user limit.',
    consent: 'I agree that student data, scores and materials are used only for learning by authorised people in my bimbel.',
    submitBtn: 'Submit registration', submitting: 'Submitting...',
    nextTitle: 'What happens next',
    next: [
      'Your registration is saved with status Pending.',
      'The BIMS Super Admin reviews it and approves or rejects it.',
      'Once approved, you get an email and can log in to set up classes.',
    ],
    statusPending: 'Status: Pending',
    doneTitle: 'Registration received',
    doneBody: 'Your workspace is not active yet. We will email you as soon as the Super Admin approves it.',
    labelBimbel: 'Bimbel', labelEmail: 'Email', labelWs: 'Workspace', labelPlan: 'Plan',
    backHome: 'Back to home', editAgain: 'Change details',
    login: 'Log in',
    errRequired: 'Please fill in all required fields.',
    errPass: 'Password must be at least 8 characters.',
    errEmail: 'Please enter a valid email.',
  },
  id: {
    title: 'Daftarkan bimbel Anda',
    stepsAria: 'Tahap pendaftaran',
    steps: ['Isi data', 'Menunggu persetujuan', 'Ruang kerja aktif'],
    secBimbel: 'Data bimbel',
    fName: 'Nama bimbel', fCity: 'Kota', fPhone: 'Nomor WhatsApp', fWs: 'Alamat ruang kerja',
    wsOk: 'Alamat tersedia', wsErr: 'Alamat ruang kerja wajib diisi.',
    secAdmin: 'Akun Admin Bimbel',
    fAdminName: 'Nama lengkap', fPass: 'Kata sandi', passHint: 'Minimal 8 karakter.',
    secPlan: 'Paket', perMonth: '/ bulan', upTo: 'Hingga [BATAS PENGGUNA] pengguna',
    planNote: 'Tagihan bulanan. Semua paket berisi seluruh fitur belajar; yang berbeda hanya batas pengguna.',
    consent: 'Saya setuju data siswa, nilai, dan materi hanya digunakan untuk pembelajaran oleh pihak berwenang di bimbel saya.',
    submitBtn: 'Kirim pendaftaran', submitting: 'Mendaftarkan...',
    nextTitle: 'Langkah berikutnya',
    next: [
      'Pendaftaran tersimpan dengan status Menunggu.',
      'Super Admin BIMS memeriksa lalu menyetujui atau menolak.',
      'Setelah disetujui, Anda menerima email dan bisa login untuk mengatur kelas.',
    ],
    statusPending: 'Status: Menunggu',
    doneTitle: 'Pendaftaran diterima',
    doneBody: 'Ruang kerja Anda belum aktif. Kami akan mengirim email begitu Super Admin menyetujuinya.',
    labelBimbel: 'Bimbel', labelEmail: 'Email', labelWs: 'Alamat ruang kerja', labelPlan: 'Paket',
    backHome: 'Kembali ke beranda', editAgain: 'Ubah data',
    login: 'Masuk',
    errRequired: 'Mohon lengkapi semua kolom yang wajib diisi.',
    errPass: 'Kata sandi minimal 8 karakter.',
    errEmail: 'Masukkan email yang valid.',
  },
}

const inputCls = 'h-11 box-border border border-[#C7C7CF] rounded-[10px] px-3 text-[15px] font-medium text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition w-full bg-white'

export default function Register() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]

  const [form, setForm] = useState({
    bimbel_name: '', city: '', phone: '', workspace: '',
    admin_name: '', email: '', password: '',
  })
  const [plan, setPlan] = useState('Standard')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    if (!form.bimbel_name || !form.workspace || !form.admin_name || !form.email || !form.password) {
      return t.errRequired
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) return t.errEmail
    if (form.password.length < 8) return t.errPass
    return null
  }

  const handleSubmit = async () => {
    setError('')
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    try {
      const response = await api.post('/register', {
        name: form.admin_name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password,
        tenant_name: form.bimbel_name,
        tenant_slug: form.workspace,
      })
      const result = response.data
      if (!result.success) throw new Error(result.message || 'Pendaftaran gagal.')
      setResult({
        bimbel_name: result.data.tenant.name,
        email: result.data.user.email,
        workspace: result.data.tenant.slug,
        plan,
      })
      setDone(true)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Pendaftaran gagal.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const btnOn = 'h-9 min-w-[40px] px-3 rounded-full bg-[#0D47A1] text-white text-sm font-bold border-0 cursor-pointer'
  const btnOff = 'h-9 min-w-[40px] px-3 rounded-full bg-transparent text-[#1F2937] text-sm font-bold border-0 cursor-pointer'

  const curStep = done ? 1 : 0

  return (
    <div className="min-h-screen bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#1F2937]">
      {/* Header */}
      <header className="bg-[#F3F6FA] border-b border-[#E6E6EA]">
        <div className="max-w-[1100px] mx-auto px-6 py-3.5 flex flex-wrap items-center gap-3 gap-x-5">
          <Link to="/" className="flex items-center no-underline">
            <img src="/logo.png" alt="BIMS" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex-1" />
          {/* Language toggle */}
          <div className="flex gap-0.5 p-[3px] border border-[#1F2937] rounded-full items-center">
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? btnOn : btnOff}>EN</button>
            <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? btnOn : btnOff}>ID</button>
          </div>
          <Link to="/login" className="inline-flex items-center h-11 px-4 text-[#1F2937] no-underline font-semibold text-[15px]">
            {t.login}
          </Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-9 pb-14 flex flex-col gap-6">
        {/* Step indicator */}
        <ol aria-label={t.stepsAria} className="m-0 p-0 list-none flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {t.steps.map((text, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-[13px] ${i <= curStep ? 'bg-[#0D47A1] text-white' : 'bg-[#ECECF0] text-[#4A4A55]'}`}>
                {i + 1}
              </span>
              <span className={i === curStep ? 'font-bold' : 'text-[#5F6368]'}>{text}</span>
            </li>
          ))}
        </ol>

        {/* Form state */}
        {!done && (
          <div className="flex flex-wrap gap-6 items-start">
            {/* Form */}
            <form className="flex-[2_1_560px] min-w-0 flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
              <h1 className="m-0 text-[34px] font-extrabold tracking-[-0.02em]">{t.title}</h1>

              {/* Fieldset: Bimbel */}
              <fieldset className="m-0 border border-[#E6E6EA] rounded-[18px] bg-white px-6 py-5 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
                <legend className="font-extrabold text-base px-1.5">{t.secBimbel}</legend>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold">{t.fName} *</label>
                  <input value={form.bimbel_name} onChange={set('bimbel_name')} className={inputCls} placeholder="Bimbel Pelita Nusantara" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold">{t.fCity}</label>
                  <input value={form.city} onChange={set('city')} className={inputCls} placeholder="Balikpapan" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold">{t.fPhone}</label>
                  <input value={form.phone} onChange={set('phone')} type="tel" className={inputCls} placeholder="08xx xxxx xxxx" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold">{t.fWs} *</label>
                  <div className="flex items-center h-11 border border-[#C7C7CF] rounded-[10px] overflow-hidden bg-white focus-within:border-[#0D47A1] transition">
                    <input value={form.workspace} onChange={set('workspace')} className="flex-1 min-w-0 h-full border-0 px-3 text-[15px] font-medium text-[#1F2937] focus:outline-none bg-transparent" placeholder="pelita-nusantara" />
                    <span className="font-mono text-[13px] text-[#5F6368] px-3 border-l border-[#ECECF0] h-full flex items-center bg-[#F3F6FA]">.bims.id</span>
                  </div>
                  {form.workspace && (
                    <span className="text-[12px] font-semibold text-[#1E6B3A]">{t.wsOk}</span>
                  )}
                </div>
              </fieldset>

              {/* Fieldset: Admin */}
              <fieldset className="m-0 border border-[#E6E6EA] rounded-[18px] bg-white px-6 py-5 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
                <legend className="font-extrabold text-base px-1.5">{t.secAdmin}</legend>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold">{t.fAdminName} *</label>
                  <input value={form.admin_name} onChange={set('admin_name')} className={inputCls} placeholder="Hendra Wijaya" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold">Email *</label>
                  <input value={form.email} onChange={set('email')} type="email" className={inputCls} placeholder="hendra@pelita.id" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold">{t.fPass} *</label>
                  <input value={form.password} onChange={set('password')} type="password" className={inputCls} placeholder="••••••••" />
                  <span className="text-[12px] text-[#5F6368]">{t.passHint}</span>
                </div>
              </fieldset>

              {/* Fieldset: Plan */}
              <fieldset className="m-0 border border-[#E6E6EA] rounded-[18px] bg-white px-6 py-5 flex flex-col gap-3">
                <legend className="font-extrabold text-base px-1.5">{t.secPlan}</legend>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                  {PLANS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setPlan(name)}
                      aria-pressed={plan === name}
                      className={`flex flex-col items-start gap-1.5 p-4 rounded-[14px] cursor-pointer text-left font-['Plus_Jakarta_Sans',sans-serif] transition ${plan === name ? 'border-2 border-[#0D47A1] bg-[#EEF4FF]' : 'border border-[#D6D6DC] bg-white'}`}
                    >
                      <span className="font-extrabold text-base text-[#1F2937]">{name}</span>
                      <span className="font-mono text-sm text-[#0D47A1]">[PRICE] {t.perMonth}</span>
                      <span className="text-[13px] text-[#5F6368]">{t.upTo}</span>
                    </button>
                  ))}
                </div>
                <span className="text-[13px] text-[#5F6368]">{t.planNote}</span>
              </fieldset>

              {/* Consent */}
              <label className="flex gap-3 items-start text-sm leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-[#0D47A1]"
                />
                {t.consent}
              </label>

              {/* Error — tepat di atas tombol submit */}
              {error && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none mt-0.5">
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !consent}
                title={!consent ? (lang === 'id' ? 'Centang persetujuan terlebih dahulu' : 'Please check the consent box first') : ''}
                className="h-[52px] rounded-xl border-0 bg-[#0D47A1] text-white font-extrabold text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0a3880] transition flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                  <path d="M22 2 11 13 M22 2l-7 20-4-9-9-4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {loading ? t.submitting : t.submitBtn}
              </button>
            </form>

            {/* Sidebar */}
            <aside className="flex-1 min-w-0 basis-[280px] bg-[#0D47A1] text-white rounded-[18px] p-6 flex flex-col gap-3.5">
              <h2 className="m-0 text-[18px] font-extrabold">{t.nextTitle}</h2>
              <ol className="m-0 pl-5 flex flex-col gap-2.5 text-sm leading-relaxed text-[#93C5FD]">
                {t.next.map((n, i) => <li key={i}>{n}</li>)}
              </ol>
            </aside>
          </div>
        )}

        {/* Done state */}
        {done && result && (
          <section role="status" className="max-w-[640px] mx-auto mt-6 bg-white border border-[#E6E6EA] rounded-[22px] p-9 flex flex-col gap-4 items-start">
            <span className="text-[13px] font-bold bg-[#DBEAFE] text-[#1e40af] px-3 py-1.5 rounded-full">
              {t.statusPending}
            </span>
            <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.02em]">{t.doneTitle}</h1>
            <p className="m-0 text-base leading-relaxed text-[#4A4A55]">{t.doneBody}</p>

            <dl className="m-0 grid grid-cols-[max-content_1fr] gap-x-5 gap-y-2 text-sm">
              <dt className="text-[#5F6368]">{t.labelBimbel}</dt>
              <dd className="m-0 font-bold">{result.bimbel_name}</dd>
              <dt className="text-[#5F6368]">{t.labelEmail}</dt>
              <dd className="m-0 font-bold">{result.email}</dd>
              <dt className="text-[#5F6368]">{t.labelWs}</dt>
              <dd className="m-0 font-mono">{result.workspace}.bims.id</dd>
              <dt className="text-[#5F6368]">{t.labelPlan}</dt>
              <dd className="m-0 font-bold">{result.plan}</dd>
            </dl>

            <div className="flex flex-wrap gap-2.5">
              <Link to="/" className="inline-flex items-center h-12 px-5 rounded-xl bg-[#0D47A1] text-white no-underline font-bold hover:bg-[#0a3880] transition">
                {t.backHome}
              </Link>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="h-12 px-[18px] rounded-xl border border-[#1F2937] bg-white text-[#1F2937] font-bold text-[15px] cursor-pointer hover:bg-[#F3F6FA] transition"
              >
                {t.editAgain}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
