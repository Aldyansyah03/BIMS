import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Redirect sesuai role setelah login berhasil
const ROLE_REDIRECT = {
  super_admin: '/super-admin',
  admin_bimbel: '/admin/dashboard',
  tutor: '/tutor',
  student: '/student',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email dan kata sandi wajib diisi.')
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
    <div className="min-h-screen flex">

      {/* Sisi kiri — merah */}
      <aside className="flex-1 bg-[#C8102E] text-white p-10 flex flex-col gap-10 hidden md:flex">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold tracking-widest">BIMS</span>
        </div>
        <div className="mt-auto flex flex-col gap-4">
          <h1 className="text-4xl font-extrabold leading-tight">
            Selamat datang kembali di ruang kelas Anda.
          </h1>
          <p className="text-[#FFE3E7] text-lg">
            Admin, tutor, dan siswa masuk dari sini. Anda akan langsung
            diarahkan ke tampilan sesuai peran.
          </p>
        </div>

        {/* Quick login untuk development — hapus saat production */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFE3E7]">
            Dev · Login cepat
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Super Admin', email: 'superadmin@bims.id' },
              { label: 'Admin Bimbel', email: 'hendra@cahayailmu.id' },
              { label: 'Tutor', email: 'rina@cahayailmu.id' },
              { label: 'Siswa', email: 'aditya@cahayailmu.id' },
            ].map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => {
                  setEmail(u.email)
                  setPassword('password123')
                }}
                className="text-left px-4 py-3 rounded-xl border border-[#E86A7C] text-white text-sm font-semibold hover:bg-[#E86A7C]/20 transition"
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Sisi kanan — form */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-extrabold">Masuk</h2>
            <p className="text-[#4A4A55] text-sm">
              Gunakan akun yang dibuat oleh admin bimbel Anda.
            </p>
          </div>

          {/* Alert error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-[#FDECEE] border border-[#F6B4BC] text-[#9B0D23] text-sm font-semibold">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-bold">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@bimbel.id"
              className="h-12 px-4 rounded-xl border border-[#C7C7CF] text-sm focus:outline-none focus:border-[#C8102E] transition"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-bold">
              Kata sandi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 px-4 rounded-xl border border-[#C7C7CF] text-sm focus:outline-none focus:border-[#C8102E] transition"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-[#C8102E] text-white font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#a50d26] transition"
          >
            {loading ? 'Memeriksa akun...' : 'Masuk'}
          </button>
        </form>
      </main>

    </div>
  )
}
