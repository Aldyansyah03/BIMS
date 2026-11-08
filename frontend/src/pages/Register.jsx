import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { usePackages } from '../hooks/usePackages'


const T = {
  title: 'Daftarkan bimbel Anda',
  stepsAria: 'Tahap pendaftaran',
  steps: ['Isi data', 'Pembayaran', 'Menunggu persetujuan', 'Ruang kerja aktif'],
  secBimbel: 'Data bimbel',
  fName: 'Nama bimbel', fCity: 'Kota', fWs: 'Alamat ruang kerja',
  wsOk: 'Alamat tersedia',
  secAdmin: 'Akun Admin Bimbel',
  fAdminName: 'Nama lengkap', fPass: 'Kata sandi', passHint: 'Minimal 8 karakter.',
  secPlan: 'Paket', perMonth: '/ bulan', upTo: (n) => `Hingga ${n} pengguna`,
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
}

const inputCls = 'h-11 box-border border border-[#C7C7CF] rounded-[10px] px-3 text-[15px] font-medium text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition w-full bg-white'

const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

export default function Register() {
  const t = T
  const [searchParams] = useSearchParams()
  const { packages, loading: pkgLoading } = usePackages()

  const [form, setForm] = useState({
    bimbel_name: '', city: '', workspace: '',
    admin_name: '', email: '', password: '',
  })
  const [selectedPkgId, setSelectedPkgId] = useState(null)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState(null)
  const [snapToken, setSnapToken] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null) // null | success | pending | error | closed

  useEffect(() => {
    const pkgId = searchParams.get('package')
    if (pkgId) setSelectedPkgId(Number(pkgId))
  }, [searchParams])

  useEffect(() => {
    if (packages.length > 0 && !selectedPkgId) {
      const featured = packages.find((p) => p.is_featured) || packages[0]
      setSelectedPkgId(featured.id)
    }
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [packages.length])

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
        package_id: selectedPkgId,
      })
      const res = response.data

      if (!res.success) throw new Error(res.message || 'Pendaftaran gagal.')

      setResult({
        bimbel_name: res.data.tenant.name,
        email: res.data.user.email,
        workspace: res.data.tenant.slug,
        plan: packages.find((p) => p.id === selectedPkgId)?.name || '',
      })

      if (res.data.snap_token) setSnapToken(res.data.snap_token)
      setDone(true)

      // Auto buka Midtrans Snap setelah register berhasil
      if (res.data.snap_token) {
        setTimeout(() => {
          if (window.snap) {
            window.snap.pay(res.data.snap_token, {
              onSuccess: () => {
                setPaymentStatus('success')
              },
              onPending: () => {
                setPaymentStatus('pending')
              },
              onError: () => {
                setPaymentStatus('error')
              },
              onClose: () => {
                // User tutup popup tanpa bayar
                setPaymentStatus('closed')
              },
            })
          }
        }, 300)
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Pendaftaran gagal.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Trigger Midtrans Snap popup
  const openSnap = () => {
    if (!snapToken) return
    if (window.snap) {
      window.snap.pay(snapToken, {
        onSuccess: () => alert('Pembayaran berhasil! Bimbel Anda akan segera diaktifkan.'),
        onPending: () => alert('Pembayaran pending. Silakan selesaikan pembayaran.'),
        onError: () => alert('Pembayaran gagal. Silakan coba lagi.'),
        onClose: () => console.log('Snap ditutup.'),
      })
    } else {
      alert('Midtrans Snap belum dimuat. Pastikan koneksi internet aktif.')
    }
  }

  const curStep = done
    ? paymentStatus === 'success' ? 2
    : 1
    : 0

  return (
    <div className="min-h-screen bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#1F2937]">
      {/* Header */}
      <header className="bg-[#F3F6FA] border-b border-[#E6E6EA]">
        <div className="max-w-[1100px] mx-auto px-6 py-3.5 flex flex-wrap items-center gap-3 gap-x-5">
          <Link to="/" className="flex items-center no-underline">
            <img src="/logo.png" alt="BIMS" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex-1" />
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
                  {pkgLoading ? (
                    <div className="col-span-3 h-24 bg-[#F3F6FA] rounded-[14px] animate-pulse" />
                  ) : (
                    packages.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPkgId(pkg.id)}
                        aria-pressed={selectedPkgId === pkg.id}
                        className={`flex flex-col items-start gap-1.5 p-4 rounded-[14px] cursor-pointer text-left font-['Plus_Jakarta_Sans',sans-serif] transition ${selectedPkgId === pkg.id ? 'border-2 border-[#0D47A1] bg-[#EEF4FF]' : 'border border-[#D6D6DC] bg-white'}`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="font-extrabold text-base text-[#1F2937]">{pkg.name}</span>
                          {pkg.is_featured && (
                            <span className="text-[11px] font-bold bg-[#3EB6FF] text-[#0a3880] px-2 py-0.5 rounded-full">Populer</span>
                          )}
                        </div>
                        <span className="font-mono text-sm text-[#0D47A1] font-semibold">{formatPrice(pkg.price)} {t.perMonth}</span>
                        <span className="text-[13px] text-[#5F6368]">Hingga {pkg.max_users} pengguna</span>
                      </button>
                    ))
                  )}
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
                title={!consent ? 'Centang persetujuan terlebih dahulu' : ''}
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

            {/* Status badge */}
            {paymentStatus === 'success' ? (
              <span className="text-[13px] font-bold bg-[#E6F4EA] text-[#1E6B3A] px-3 py-1.5 rounded-full">
                ✓ Pembayaran Berhasil
              </span>
            ) : paymentStatus === 'pending' ? (
              <span className="text-[13px] font-bold bg-[#FCEFC9] text-[#6B4A00] px-3 py-1.5 rounded-full">
                ⏳ Menunggu Pembayaran
              </span>
            ) : paymentStatus === 'error' ? (
              <span className="text-[13px] font-bold bg-[#FDE7E5] text-[#8A1C12] px-3 py-1.5 rounded-full">
                ✕ Pembayaran Gagal
              </span>
            ) : (
              <span className="text-[13px] font-bold bg-[#DBEAFE] text-[#1e40af] px-3 py-1.5 rounded-full">
                {t.statusPending}
              </span>
            )}

            <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.02em]">
              {paymentStatus === 'success' ? 'Pendaftaran & Pembayaran Selesai' : t.doneTitle}
            </h1>
            <p className="m-0 text-base leading-relaxed text-[#4A4A55]">
              {paymentStatus === 'success'
                ? 'Pembayaran berhasil! Bimbel Anda sedang diproses dan akan segera aktif.'
                : paymentStatus === 'pending'
                ? 'Pembayaran Anda sedang diproses. Setelah konfirmasi, bimbel akan aktif otomatis.'
                : t.doneBody}
            </p>

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
              {/* Tombol bayar sekarang kalau ada snap_token */}
              {snapToken && !paymentStatus && (
                <button
                  type="button"
                  onClick={openSnap}
                  className="h-12 px-5 rounded-xl border-0 bg-[#3EB6FF] text-[#0a3880] font-extrabold text-[15px] cursor-pointer hover:bg-[#60c8ff] transition flex items-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                    <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Bayar Sekarang
                </button>
              )}
              {/* Tombol bayar ulang kalau ditutup atau error */}
              {snapToken && (paymentStatus === 'closed' || paymentStatus === 'error') && (
                <button
                  type="button"
                  onClick={openSnap}
                  className="h-12 px-5 rounded-xl border-0 bg-[#0D47A1] text-white font-extrabold text-[15px] cursor-pointer hover:bg-[#0a3880] transition flex items-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                    <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Coba Bayar Lagi
                </button>
              )}
              <Link to="/" className="inline-flex items-center h-12 px-5 rounded-xl bg-[#0D47A1] text-white no-underline font-bold hover:bg-[#0a3880] transition">
                {t.backHome}
              </Link>
              <button
                type="button"
                onClick={() => { setDone(false); setPaymentStatus(null); setSnapToken(null) }}
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
