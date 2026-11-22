import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { usePackages } from '../hooks/usePackages'
import { useAuth } from '../hooks/useAuth'
import OnboardingStepper from '../components/OnboardingStepper'

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

const DOMAIN_TYPOS = {
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmai.co': 'gmail.com',
  'gmaul.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yaho.co.id': 'yahoo.co.id',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
}

const DISPOSABLE_DOMAINS = [
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'throwawaymail.com',
  'yopmail.com',
  'trashmail.com',
  'dispostable.com',
]

const inputCls =
  'h-11 box-border border border-[#C7C7CF] rounded-[10px] px-3 text-[15px] font-medium text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition w-full bg-white'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { packages, loading: pkgLoading } = usePackages()
  const { setUser } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })

  const [selectedPkgId, setSelectedPkgId] = useState(null)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSuggestion, setEmailSuggestion] = useState('')

  // Cek parameter URL package jika ada
  useEffect(() => {
    const pkgId = searchParams.get('package')
    if (pkgId) setSelectedPkgId(Number(pkgId))
  }, [searchParams])

  // Pilih paket default jika belum dipilih
  useEffect(() => {
    if (packages.length > 0 && !selectedPkgId) {
      const featured = packages.find((p) => p.is_featured) || packages[0]
      setSelectedPkgId(featured.id)
    }
  }, [packages, selectedPkgId])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleEmailChange = (e) => {
    const val = e.target.value
    setForm((f) => ({ ...f, email: val }))

    if (val.includes('@')) {
      const parts = val.split('@')
      const domain = parts[1]?.toLowerCase().trim()
      if (domain && DOMAIN_TYPOS[domain]) {
        setEmailSuggestion(`${parts[0]}@${DOMAIN_TYPOS[domain]}`)
      } else {
        setEmailSuggestion('')
      }
    } else {
      setEmailSuggestion('')
    }
  }

  const validate = () => {
    if (!form.name.trim()) return 'Nama lengkap wajib diisi.'
    if (!form.email.trim()) return 'Alamat email wajib diisi.'

    const emailTrim = form.email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrim)) {
      return 'Format alamat email tidak valid. Pastikan menyertakan @ dan domain yang benar (contoh: nama@gmail.com).'
    }

    const domain = emailTrim.split('@')[1]?.toLowerCase()
    if (domain && DOMAIN_TYPOS[domain]) {
      return `Domain email '@${domain}' sepertinya salah ketik. Apakah maksud Anda '@${DOMAIN_TYPOS[domain]}'?'`
    }

    if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
      return 'Alamat email sementara (disposable/temp email) tidak diizinkan. Silakan gunakan email aktif Anda.'
    }

    if (!form.password) return 'Kata sandi wajib diisi.'
    if (form.password.length < 6) return 'Kata sandi minimal 6 karakter.'
    if (form.password !== form.password_confirmation) return 'Konfirmasi kata sandi tidak cocok.'
    if (!selectedPkgId) return 'Silakan pilih salah satu paket langganan.'
    if (!consent) return 'Anda harus menyetujui ketentuan layanan dan privasi data.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const res = await api.post('/register', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password_confirmation: form.password_confirmation,
        package_id: selectedPkgId,
      })

      if (res.data?.success) {
        localStorage.setItem('registered_email', form.email)
        if (selectedPkgId) {
          localStorage.setItem('selected_package_id', selectedPkgId.toString())
        }
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('last_verification_token')

        // Arahkan ke Langkah 2: Verifikasi Email
        navigate('/verify-email')
      } else {
        setError(res.data?.message || 'Pendaftaran gagal. Silakan periksa kembali data Anda.')
      }
    } catch (err) {
      const resp = err.response?.data
      if (resp?.errors) {
        const firstErrorKey = Object.keys(resp.errors)[0]
        setError(resp.errors[firstErrorKey][0])
      } else {
        setError(resp?.message || 'Terjadi kesalahan pada server saat pendaftaran.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-[#1F2937] font-['Plus_Jakarta_Sans',system-ui,sans-serif] p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 no-underline text-inherit">
            <span className="w-8 h-8 rounded-lg bg-[#0D47A1] text-white flex items-center justify-center font-bold text-lg">
              B
            </span>
            <span className="font-extrabold text-xl tracking-tight text-[#0D47A1]">BIMS</span>
          </Link>
          <div className="text-sm">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-[#0D47A1] font-bold hover:underline">
              Masuk
            </Link>
          </div>
        </div>

        {/* Stepper Progress */}
        <OnboardingStepper currentStep={1} />

        {/* Main Card */}
        <div className="bg-white border border-[#E6E6EA] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight mb-2">
              Registrasi Akun Admin Bimbel
            </h1>
            <p className="text-sm text-[#71717A]">
              Buat akun pengelola bimbingan belajar Anda. Setelah mendaftar, kami akan mengirimkan tautan verifikasi ke email Anda.
            </p>
          </div>

          {error && (
            <div className="bg-[#FEE2E2] border border-[#F87171] text-[#B91C1C] text-sm p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Informasi Akun */}
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-bold text-[#1F2937] border-b border-[#ECECF0] pb-2">
                Informasi Akun Pribadi
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1F2937]">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={set('name')}
                    className={inputCls}
                    placeholder="Nama Admin Bimbel"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1F2937]">Alamat Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleEmailChange}
                    className={inputCls}
                    placeholder="admin@bimbel.id"
                    required
                  />
                  {emailSuggestion && (
                    <div className="text-xs bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] p-2 rounded-lg flex items-center justify-between mt-0.5">
                      <span>
                        Maksud Anda: <strong>{emailSuggestion}</strong>?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, email: emailSuggestion }))
                          setEmailSuggestion('')
                        }}
                        className="text-xs font-bold text-[#0D47A1] underline hover:text-[#0A3880] cursor-pointer ml-2"
                      >
                        Gunakan
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1F2937]">Nomor Telepon / WhatsApp</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    className={inputCls}
                    placeholder="081234567890"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1F2937]">Kata Sandi *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={set('password')}
                    className={inputCls}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1F2937]">Konfirmasi Kata Sandi *</label>
                  <input
                    type="password"
                    value={form.password_confirmation}
                    onChange={set('password_confirmation')}
                    className={inputCls}
                    placeholder="Ulangi kata sandi"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pilihan Paket Langganan */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-bold text-[#1F2937] border-b border-[#ECECF0] pb-2">
                Pilih Paket Langganan
              </h2>
              {pkgLoading ? (
                <div className="h-28 bg-[#F3F6FA] rounded-xl animate-pulse" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {packages.map((pkg) => {
                    const isSelected = selectedPkgId === pkg.id
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={`cursor-pointer rounded-xl p-4 border transition flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0D47A1] bg-[#EFF6FF] ring-2 ring-[#0D47A1]/20'
                            : 'border-[#E6E6EA] hover:border-[#0D47A1]/50 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-[#1F2937]">{pkg.name}</span>
                            {pkg.is_featured && (
                              <span className="bg-[#0D47A1] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                Populer
                              </span>
                            )}
                          </div>
                          <div className="text-base font-extrabold text-[#0D47A1] mb-1">
                            {formatPrice(pkg.price)}
                          </div>
                          <div className="text-xs text-[#71717A]">
                            Hingga {pkg.max_users} pengguna · {pkg.duration_days} hari
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Consent & Persetujuan */}
            <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-[#4A4A55] leading-relaxed">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#0D47A1] rounded border-[#C7C7CF] focus:ring-[#0D47A1]"
              />
              <span>
                Saya setuju data bimbingan belajar, siswa, dan materi akan dikelola sesuai standar keamanan dan ketentuan layanan sistem BIMS.
              </span>
            </label>

            {/* Tombol Registrasi */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#0D47A1] hover:bg-[#0A3880] text-white font-extrabold text-base rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mendaftarkan Akun...</span>
                  </>
                ) : (
                  <span>Daftar & Lanjut ke Verifikasi Email →</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
