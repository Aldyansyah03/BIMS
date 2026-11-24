import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { usePackages } from '../hooks/usePackages'
import OnboardingStepper from '../components/OnboardingStepper'

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

export default function Payment() {
  const navigate = useNavigate()
  const { user, setUser, refreshUser } = useAuth()
  const { packages, loading: pkgLoading } = usePackages()

  const [selectedPkg, setSelectedPkg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [, setSnapToken] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null) // 'success', 'pending', 'error', null
  const [errorMessage, setErrorMessage] = useState('')

  const pollingRef = useRef(null)

  // Pastikan user sudah verifikasi email
  useEffect(() => {
    if (user && !user.email_verified_at) {
      navigate('/verify-email', { replace: true })
    }
  }, [user, navigate])

  // Muat Midtrans Snap script jika belum terpasang
  useEffect(() => {
    const snapScript = 'https://app.sandbox.midtrans.com/snap/snap.js'
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'Mid-client-MGwYn96vhavRomEQ'
    if (!document.querySelector(`script[src="${snapScript}"]`)) {
      const script = document.createElement('script')
      script.src = snapScript
      script.setAttribute('data-client-key', clientKey)
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  // Sinkronkan paket yang sudah dipilih sejak registrasi
  useEffect(() => {
    if (packages.length > 0 && !selectedPkg) {
      // 1. Cek dari subscription user di state/API
      const userSubPkg = user?.subscriptions?.[0]?.package
      if (userSubPkg) {
        setSelectedPkg(userSubPkg)
        return
      }

      // 2. Cek dari ID paket yang tersimpan di localStorage saat registrasi
      const storedPkgId = localStorage.getItem('selected_package_id')
      if (storedPkgId) {
        const found = packages.find((p) => String(p.id) === String(storedPkgId))
        if (found) {
          setSelectedPkg(found)
          return
        }
      }

      // 3. Fallback ke paket unggulan atau paket pertama yang tersedia
      const featured = packages.find((p) => p.is_featured) || packages[0]
      setSelectedPkg(featured)
    }
  }, [packages, selectedPkg, user])

  // Auto-polling memeriksa webhook notifikasi Midtrans di backend secara berkala
  useEffect(() => {
    if (paymentStatus === 'success') {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }

    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.post('/payment/check-registration', {
          ...(orderId ? { order_id: orderId } : {}),
        })

        if (res.data?.paid || res.data?.data?.user?.onboarding_step === 'complete_profile') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setPaymentStatus('success')
          const updatedUser = res.data?.data?.user || (refreshUser ? await refreshUser() : null)
          if (updatedUser) {
            localStorage.setItem('user', JSON.stringify(updatedUser))
            if (setUser) setUser(updatedUser)
          }
          navigate('/complete-profile', { replace: true })
        }
      } catch {
        // Silent poll
      }
    }, 2000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [orderId, paymentStatus, navigate, refreshUser, setUser])

  // Inisiasi checkout dan buka jendela pembayaran Midtrans Snap
  const handlePay = async () => {
    if (!selectedPkg) return
    setPaying(true)
    setErrorMessage('')

    try {
      const res = await api.post('/payment/checkout-registration', {
        package_id: selectedPkg.id,
      })

      if (res.data?.success) {
        const token = res.data.data.snap_token
        const newOrderId = res.data.data.order_id
        setSnapToken(token)
        setOrderId(newOrderId)

        if (window.snap && token) {
          window.snap.pay(token, {
            onSuccess: (result) => handlePaymentDone(result?.order_id || newOrderId, result),
            onPending: (result) => {
              setPaymentStatus('pending')
              handlePaymentDone(newOrderId, { status: 'pending', ...result })
            },
            onError: () => {
              setPaymentStatus('error')
              setErrorMessage('Pembayaran gagal atau dibatalkan oleh pengguna.')
            },
            onClose: () => {
              // Cek status terkini saat jendela pembayaran ditutup
              handlePaymentDone(newOrderId)
            },
          })
        }
      } else {
        setErrorMessage(res.data?.message || 'Gagal memulai transaksi pembayaran.')
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Terjadi kendala saat menghubungi server pembayaran.')
    } finally {
      setPaying(false)
    }
  }

  // Konfirmasi status pembayaran ke backend
  const handlePaymentDone = async (targetOrderId, extraData = {}) => {
    setLoading(true)
    try {
      const res = await api.post('/payment/check-registration', {
        order_id: targetOrderId || orderId,
        status: 'success',
        ...extraData,
      })

      if (res.data?.paid || res.data?.success) {
        setPaymentStatus('success')
        const updatedUser = res.data?.data?.user || (refreshUser ? await refreshUser() : null)
        if (updatedUser) {
          localStorage.setItem('user', JSON.stringify(updatedUser))
          if (setUser) setUser(updatedUser)
        }
        navigate('/complete-profile', { replace: true })
      } else if (extraData?.status === 'pending') {
        setPaymentStatus('pending')
      }
    } catch (err) {
      if (refreshUser) {
        const refreshed = await refreshUser()
        if (refreshed?.onboarding_step === 'complete_profile') {
          navigate('/complete-profile', { replace: true })
          return
        }
      }
      setErrorMessage(err.response?.data?.message || 'Gagal memeriksa status pembayaran.')
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
            <span className="w-8 h-8 rounded-lg bg-[#0D47A1] text-white flex items-center justify-center font-bold text-lg">
              B
            </span>
            <span className="font-extrabold text-xl tracking-tight text-[#0D47A1]">BIMS</span>
          </Link>
          <span className="text-sm font-semibold text-[#71717A]">Langkah 3 dari 5</span>
        </div>

        {/* Stepper Progress */}
        <OnboardingStepper currentStep={3} />

        {/* Main Payment Card */}
        <div className="bg-white border border-[#E6E6EA] rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Status Sukses */}
          {paymentStatus === 'success' ? (
            <div className="py-8 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#E8F5E9] text-[#1E6B3A] flex items-center justify-center text-3xl font-bold shadow-sm">
                ✓
              </div>
              <h2 className="text-2xl font-extrabold text-[#1E6B3A]">Pembayaran Berhasil!</h2>
              <p className="text-sm text-[#4A4A55] max-w-md">
                Pembayaran biaya registrasi telah diverifikasi. Akun Anda telah aktif untuk melanjutkan ke pengisian profil bimbel.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#0D47A1] bg-[#EFF6FF] px-4 py-2 rounded-full">
                <span className="inline-block w-2 h-2 rounded-full bg-[#0D47A1] animate-ping" />
                Mengarahkan ke halaman lengkapi profil...
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-[#1F2937] tracking-tight mb-2">Pembayaran Registrasi</h1>
                <p className="text-sm text-[#71717A]">
                  Selesaikan pembayaran biaya registrasi resmi melalui Midtrans Payment Gateway untuk mengaktifkan akun bimbel Anda secara otomatis.
                </p>
              </div>

              {errorMessage && (
                <div className="bg-[#FEE2E2] border border-[#F87171] text-[#B91C1C] text-sm p-4 rounded-xl mb-6">
                  {errorMessage}
                </div>
              )}

              {/* Status Pending Banner */}
              {paymentStatus === 'pending' && (
                <div className="bg-[#FFF8E1] border border-[#FFE082] text-[#856404] p-4 rounded-xl mb-6 text-sm">
                  <div className="font-bold flex items-center gap-2 mb-1">
                    <span>⏳</span> Menunggu Penyelesaian Pembayaran...
                  </div>
                  <p className="text-xs mb-3">
                    Transaksi Anda sedang diproses oleh penyedia pembayaran. Halaman akan otomatis beralih begitu pembayaran selesai dikonfirmasi.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePaymentDone(orderId)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-[#856404] text-white text-xs font-bold rounded-lg hover:bg-[#6d5102] transition cursor-pointer"
                    >
                      {loading ? 'Memeriksa...' : 'Cek Status Sekarang'}
                    </button>
                    <button
                      type="button"
                      onClick={handlePay}
                      className="px-3 py-1.5 bg-white border border-[#FFE082] text-[#856404] text-xs font-bold rounded-lg hover:bg-[#fff3cd] transition cursor-pointer"
                    >
                      Buka Jendela Pembayaran
                    </button>
                  </div>
                </div>
              )}

              {/* Ringkasan Paket Terpilih */}
              <div className="mb-6">
                <label className="text-xs font-bold uppercase tracking-wider text-[#71717A] block mb-3">
                  Ringkasan Paket & Tagihan
                </label>
                {pkgLoading || !selectedPkg ? (
                  <div className="h-32 bg-[#F3F6FA] rounded-2xl animate-pulse" />
                ) : (
                  <div className="bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DBEAFE]">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-extrabold text-lg text-[#1F2937]">{selectedPkg.name}</span>
                          <span className="bg-[#0D47A1] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                            Pilihan Anda
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B]">
                          Dipilih saat registrasi akun bimbel
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-[#64748B] block">Total Tagihan</span>
                        <span className="text-2xl font-extrabold text-[#0D47A1] tracking-tight">
                          {formatPrice(selectedPkg.price)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs">
                      <div className="bg-white/80 border border-[#E2E8F0] p-3 rounded-xl">
                        <span className="text-[#64748B] block mb-1">Kapasitas Pengguna</span>
                        <span className="font-bold text-[#1E293B] text-sm">Hingga {selectedPkg.max_users} Akun</span>
                      </div>
                      <div className="bg-white/80 border border-[#E2E8F0] p-3 rounded-xl">
                        <span className="text-[#64748B] block mb-1">Masa Aktif Layanan</span>
                        <span className="font-bold text-[#1E293B] text-sm">{selectedPkg.duration_days} Hari</span>
                      </div>
                      <div className="col-span-2 sm:col-span-1 bg-white/80 border border-[#E2E8F0] p-3 rounded-xl">
                        <span className="text-[#64748B] block mb-1">Status Tagihan</span>
                        <span className="font-bold text-[#D97706] text-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                          Menunggu Bayar
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tombol Utama Bayar via Midtrans */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={paying || loading || !selectedPkg}
                  className="w-full py-3.5 px-4 bg-[#0D47A1] hover:bg-[#0A3880] text-white font-extrabold text-base rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {paying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyiapkan Midtrans...</span>
                    </>
                  ) : (
                    <span>Bayar Sekarang via Midtrans</span>
                  )}
                </button>
              </div>

              {/* Informasi Keamanan Pembayaran */}
              <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-center gap-2 text-xs text-[#94A3B8]">
                <span>🔒</span>
                <span>Transaksi aman & terenkripsi oleh Midtrans Payment Gateway</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
