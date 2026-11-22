import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import OnboardingStepper from '../components/OnboardingStepper'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, setUser } = useAuth()

  const tokenParam = searchParams.get('token')
  const emailParam = searchParams.get('email')

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(tokenParam ? 'verifying' : 'idle') // 'verifying', 'success', 'error', 'idle'
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [checkMsg, setCheckMsg] = useState('')

  const activeEmail = emailParam || user?.email || localStorage.getItem('registered_email') || ''

  // 1. Auto-verify HANYA jika token & email tersedia di URL query params (berasal dari klik email asli)
  useEffect(() => {
    if (tokenParam && emailParam) {
      handleVerify(tokenParam, emailParam)
    } else if (user?.email_verified_at) {
      // Jika email sudah terverifikasi sebelumnya di database, lanjutkan ke pembayaran
      navigate('/payment', { replace: true })
    }
  }, [tokenParam, emailParam, user, navigate])

  const handleVerify = async (token, email) => {
    if (!token || !email) {
      setStatus('error')
      setMessage('Tautan verifikasi tidak lengkap. Pastikan Anda mengklik tautan resmi dari email Anda.')
      return
    }

    setLoading(true)
    setStatus('verifying')
    setMessage('Memvalidasi token verifikasi dari email Anda...')

    try {
      const res = await api.post('/verify-email', {
        token: token.trim(),
        email: email.trim(),
      })

      if (res.data?.success) {
        setStatus('success')
        setMessage(res.data.message || 'Email Anda berhasil diverifikasi!')

        if (res.data.data?.token) {
          localStorage.setItem('token', res.data.data.token)
        }
        if (res.data.data?.user) {
          localStorage.setItem('user', JSON.stringify(res.data.data.user))
          if (setUser) setUser(res.data.data.user)
        }

        // Otomatis arahkan ke langkah 3: Pembayaran
        setTimeout(() => {
          navigate('/payment', { replace: true })
        }, 1500)
      } else {
        setStatus('error')
        setMessage(res.data?.message || 'Verifikasi gagal. Token tidak valid atau telah kedaluwarsa.')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.message || 'Tautan verifikasi tidak valid atau telah kedaluwarsa.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!activeEmail) {
      setResendMsg('Alamat email tidak ditemukan. Silakan lakukan pendaftaran ulang.')
      return
    }
    setResending(true)
    setResendMsg('')
    setCheckMsg('')
    try {
      const res = await api.post('/resend-verification', { email: activeEmail })
      setResendMsg(res.data?.message || 'Tautan verifikasi baru berhasil dikirim ke kotak masuk email Anda!')
    } catch (err) {
      setResendMsg(err.response?.data?.message || 'Gagal mengirim ulang email verifikasi. Pastikan alamat email benar.')
    } finally {
      setResending(false)
    }
  }

  // Cek status verifikasi email via endpoint publik (tidak memerlukan Sanctum token sehingga aman dari 401 redirect)
  const handleCheckStatus = async () => {
    if (!activeEmail) {
      setCheckMsg('Alamat email tidak ditemukan. Silakan lakukan pendaftaran ulang.')
      return
    }
    setLoading(true)
    setCheckMsg('')
    try {
      const res = await api.post('/check-email-verified', { email: activeEmail })
      if (res.data?.verified && res.data?.data) {
        const { token, user: verifiedUser } = res.data.data
        if (token) localStorage.setItem('token', token)
        if (verifiedUser) {
          localStorage.setItem('user', JSON.stringify(verifiedUser))
          if (setUser) setUser(verifiedUser)
        }
        navigate('/payment', { replace: true })
      } else {
        setCheckMsg(res.data?.message || 'Email Anda belum terverifikasi di sistem kami. Silakan buka kotak masuk email Anda dan klik tombol "Verifikasi Email Saya".')
      }
    } catch {
      setCheckMsg('Gagal memeriksa status. Silakan periksa koneksi internet Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-[#1F2937] font-['Plus_Jakarta_Sans',system-ui,sans-serif] p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header Logo */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 no-underline text-inherit">
            <span className="w-8 h-8 rounded-lg bg-[#0D47A1] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              B
            </span>
            <span className="font-extrabold text-xl tracking-tight text-[#0D47A1]">BIMS</span>
          </Link>
          <span className="text-sm font-semibold text-[#71717A]">Langkah 2 dari 5</span>
        </div>

        {/* Stepper Progress */}
        <OnboardingStepper currentStep={2} />

        {/* Main Card */}
        <div className="bg-white border border-[#E6E6EA] rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          {/* Status: Sedang Memvalidasi Token dari Link Email */}
          {status === 'verifying' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#0D47A1] border-t-transparent rounded-full animate-spin" />
              <h2 className="text-xl font-bold text-[#1F2937]">Memverifikasi Email...</h2>
              <p className="text-sm text-[#71717A] max-w-md">{message}</p>
            </div>
          )}

          {/* Status: Sukses Terverifikasi */}
          {status === 'success' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#E8F5E9] text-[#1E6B3A] flex items-center justify-center text-3xl font-bold shadow-sm">
                ✓
              </div>
              <h2 className="text-2xl font-extrabold text-[#1E6B3A]">Verifikasi Berhasil!</h2>
              <p className="text-sm text-[#4A4A55] max-w-md">{message}</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#0D47A1] bg-[#EFF6FF] px-4 py-2.5 rounded-full">
                <span className="inline-block w-2 h-2 rounded-full bg-[#0D47A1] animate-ping" />
                Mengarahkan ke tahap pembayaran otomatis...
              </div>
            </div>
          )}

          {/* Status: Error Token Tidak Valid / Kedaluwarsa */}
          {status === 'error' && (
            <div className="py-6 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center text-2xl font-bold">
                ✕
              </div>
              <h2 className="text-xl font-extrabold text-[#DC2626]">Tautan Tidak Valid</h2>
              <p className="text-sm text-[#4A4A55] max-w-md">{message}</p>
              <div className="flex flex-wrap gap-3 justify-center mt-2 w-full max-w-md">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full py-3 px-4 bg-[#0D47A1] hover:bg-[#0A3880] text-white text-sm font-bold rounded-xl transition cursor-pointer shadow-sm disabled:opacity-60"
                >
                  {resending ? 'Mengirim...' : 'Kirim Ulang Tautan Verifikasi Baru'}
                </button>
              </div>
              {resendMsg && <p className="text-xs font-semibold text-[#1E6B3A] mt-2">{resendMsg}</p>}
            </div>
          )}

          {/* Status: Menunggu Pengguna Mengklik Link di Email (Idle) */}
          {status === 'idle' && (
            <div className="py-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#EFF6FF] text-[#0D47A1] flex items-center justify-center text-3xl mb-4 shadow-xs">
                ✉️
              </div>
              <h2 className="text-2xl font-extrabold text-[#1F2937] mb-2 tracking-tight">Periksa Kotak Masuk Email Anda</h2>
              <p className="text-sm text-[#4A4A55] max-w-md mb-2 leading-relaxed">
                Kami telah mengirimkan tautan verifikasi ke alamat email:
              </p>
              <strong className="text-[#0D47A1] text-base mb-4 break-all font-bold bg-[#EFF6FF] px-4 py-1.5 rounded-full border border-[#DBEAFE]">
                {activeEmail || 'email Anda'}
              </strong>
              <p className="text-xs text-[#71717A] max-w-md mb-6 leading-relaxed">
                Silakan buka kotak masuk (Inbox atau Spam) pada email Anda dan klik tombol <strong>"Verifikasi Email Saya"</strong> untuk melanjutkan ke pembayaran.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 px-4 bg-[#0D47A1] hover:bg-[#0A3880] text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2 no-underline cursor-pointer"
                >
                  Buka Gmail →
                </a>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="flex-1 py-3 px-4 bg-white border border-[#C7C7CF] hover:border-[#0D47A1] text-[#1F2937] font-semibold text-sm rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {resending ? 'Mengirim...' : 'Kirim Ulang Email'}
                </button>
              </div>

              {resendMsg && (
                <div className="mt-4 p-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-semibold rounded-xl max-w-md w-full text-center">
                  {resendMsg}
                </div>
              )}

              {checkMsg && (
                <div className="mt-4 p-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs font-semibold rounded-xl max-w-md w-full text-center">
                  ⚠️ {checkMsg}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[#F1F5F9] w-full max-w-md text-center">
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={loading}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#0D47A1] transition cursor-pointer underline bg-transparent border-0"
                >
                  {loading ? 'Memeriksa status akun...' : 'Sudah klik tautan di email? Klik di sini untuk segarkan'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-[#71717A]">
          Salah memasukkan email?{' '}
          <Link to="/register" className="text-[#0D47A1] font-bold hover:underline">
            Daftar ulang dengan email lain
          </Link>
        </div>
      </div>
    </div>
  )
}
