import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ROLE_REDIRECT = {
  super_admin: '/super-admin',
  admin_bimbel: '/admin/dashboard',
  tutor: '/tutor',
  student: '/student',
}

const TEXT = {
  en: {
    sideTitle: 'Welcome back to your classroom.',
    sideSub: 'Admins, tutors and students all sign in here. You will land on the view for your role.',
    previewAs: 'Dev · preview as',
    title: 'Log in',
    sub: 'Use the account your bimbel admin created for you.',
    email: 'Email',
    password: 'Password',
    submit: 'Log in',
    submitting: 'Checking account...',
    noAccount: 'Running a bimbel?',
    registerLink: 'Register it on BIMS',
    errRequired: 'Please enter email and password.',
    roles: ['Super Admin', 'Admin Bimbel', 'Tutor', 'Student'],
  },
  id: {
    sideTitle: 'Selamat datang kembali di ruang kelas Anda.',
    sideSub: 'Admin, tutor, dan siswa masuk dari sini. Anda akan langsung diarahkan ke tampilan sesuai peran.',
    previewAs: 'Dev · lihat sebagai',
    title: 'Masuk',
    sub: 'Gunakan akun yang dibuat oleh admin bimbel Anda.',
    email: 'Email',
    password: 'Kata sandi',
    submit: 'Masuk',
    submitting: 'Memeriksa akun...',
    noAccount: 'Mengelola bimbel?',
    registerLink: 'Daftarkan di BIMS',
    errRequired: 'Masukkan email dan kata sandi.',
    roles: ['Super Admin', 'Admin Bimbel', 'Tutor', 'Siswa'],
  },
}

const DEV_USERS = [
  { email: 'superadmin@bims.id' },
  { email: 'hendra@cahayailmu.id' },
  { email: 'rina@cahayailmu.id' },
  { email: 'aditya@cahayailmu.id' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [lang, setLang] = useState('id')
  const t = TEXT[lang]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const btnOn = 'h-8 min-w-[40px] px-3 rounded-full bg-white text-[#1F2937] text-sm font-bold border-0 cursor-pointer transition'
  const btnOff = 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-white text-sm font-bold border-0 cursor-pointer transition'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError(t.errRequired)
      return
    }
    setLoading(true)
    try {
      const user = await login(email, password)
      const redirect = ROLE_REDIRECT[user.role] || '/student'
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err.message || 'Login gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex font-['Plus_Jakarta_Sans',system-ui,sans-serif]">

      {/* Sisi kiri */}
      <aside className="flex-1 bg-[#0D47A1] text-white p-10 flex-col gap-10 hidden md:flex">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="no-underline">
            <img src="/logo.png" alt="BIMS" className="h-12 w-auto object-contain" />
          </Link>
          {/* Language toggle di kiri */}
          <div className="flex gap-0.5 p-[3px] border border-white/30 rounded-full items-center">
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? btnOn : btnOff}>EN</button>
            <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? btnOn : btnOff}>ID</button>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <h1 className="text-4xl font-extrabold leading-tight">{t.sideTitle}</h1>
          <p className="text-[#93C5FD] text-lg">{t.sideSub}</p>
        </div>

        {/* Dev quick login */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold tracking-widest uppercase text-[#93C5FD]">
            {t.previewAs}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {t.roles.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setEmail(DEV_USERS[i].email)
                  setPassword('password123')
                }}
                className="text-left px-4 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Sisi kanan — form */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
        {/* Language toggle mobile — hanya muncul di layar kecil */}
        <div className="md:hidden self-end mb-4 flex gap-0.5 p-[3px] border border-[#E6E6EA] rounded-full items-center bg-[#F3F6FA]">
          <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'}
            className={lang === 'en' ? 'h-8 min-w-[40px] px-3 rounded-full bg-[#0D47A1] text-white text-sm font-bold border-0 cursor-pointer' : 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-[#1F2937] text-sm font-bold border-0 cursor-pointer'}>
            EN
          </button>
          <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'}
            className={lang === 'id' ? 'h-8 min-w-[40px] px-3 rounded-full bg-[#0D47A1] text-white text-sm font-bold border-0 cursor-pointer' : 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-[#1F2937] text-sm font-bold border-0 cursor-pointer'}>
            ID
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-extrabold text-[#1F2937]">{t.title}</h2>
            <p className="text-[#4A4A55] text-sm">{t.sub}</p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-bold text-[#1F2937]">{t.email}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@bimbel.id"
              className="h-12 px-4 rounded-xl border border-[#C7C7CF] text-sm focus:outline-none focus:border-[#0D47A1] transition"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-bold text-[#1F2937]">{t.password}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 px-4 rounded-xl border border-[#C7C7CF] text-sm focus:outline-none focus:border-[#0D47A1] transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-[#0D47A1] text-white font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#0a3880] transition"
          >
            {loading ? t.submitting : t.submit}
          </button>

          <p className="text-center text-sm text-[#4A4A55]">
            {t.noAccount}{' '}
            <Link to="/register" className="font-bold text-[#0D47A1] no-underline hover:underline">
              {t.registerLink}
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}
