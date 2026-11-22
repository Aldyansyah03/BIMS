import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { getImageUrl } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import OnboardingStepper from '../components/OnboardingStepper'

const INDONESIA_CITIES = [
  'Ambon', 'Balikpapan', 'Banda Aceh', 'Bandar Lampung', 'Bandung', 'Banjar', 'Banjarbaru', 'Banjarmasin',
  'Batam', 'Batu', 'Bau-Bau', 'Bekasi', 'Bengkulu', 'Bima', 'Binjai', 'Bitung', 'Blitar', 'Bogor',
  'Bontang', 'Bukittinggi', 'Cilegon', 'Cimahi', 'Cirebon', 'Denpasar', 'Depok', 'Dumai', 'Gorontalo',
  'Gunungsitoli', 'Jakarta Barat', 'Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Timur', 'Jakarta Utara',
  'Jambi', 'Jayapura', 'Kediri', 'Kendari', 'Kotamobagu', 'Kupang', 'Langsa', 'Lhokseumawe',
  'Lubuklinggau', 'Madiun', 'Magelang', 'Makassar', 'Malang', 'Manado', 'Mataram', 'Medan', 'Metro',
  'Mojokerto', 'Padang', 'Padang Panjang', 'Padang Sidempuan', 'Pagar Alam', 'Palangka Raya', 'Palembang',
  'Palopo', 'Palu', 'Pangkalpinang', 'Parepare', 'Pariaman', 'Pasuruan', 'Payakumbuh', 'Pekalongan',
  'Pekanbaru', 'Pematangsiantar', 'Pontianak', 'Prabumulih', 'Probolinggo', 'Sabang', 'Salatiga',
  'Samarinda', 'Sawahlunto', 'Semarang', 'Serang', 'Sibolga', 'Singkawang', 'Solok', 'Sorong',
  'Subulussalam', 'Sukabumi', 'Sungai Penuh', 'Surabaya', 'Surakarta (Solo)', 'Tangerang',
  'Tangerang Selatan', 'Tanjungbalai', 'Tanjungpinang', 'Tarakan', 'Tasikmalaya', 'Tebing Tinggi',
  'Tegal', 'Ternate', 'Tidore Kepulauan', 'Tomohon', 'Tual', 'Yogyakarta'
]

const inputCls =
  'h-11 box-border border border-[#C7C7CF] rounded-[10px] px-3 text-[15px] font-medium text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition w-full bg-white'

export default function CompleteProfile() {
  const navigate = useNavigate()
  const { user, setUser, refreshUser } = useAuth()

  // Sinkronkan status akun dengan database saat halaman dibuka
  useEffect(() => {
    if (refreshUser) {
      refreshUser().then((latest) => {
        if (latest) {
          if (!latest.email_verified_at) {
            navigate('/verify-email', { replace: true })
          } else if (latest.onboarding_step === 'payment') {
            // Cek apakah invoice sudah dibayar di backend
            api.post('/payment/check-registration').then((res) => {
              if (res.data?.paid && res.data?.data?.user) {
                if (setUser) setUser(res.data.data.user)
              } else {
                navigate('/payment', { replace: true })
              }
            }).catch(() => navigate('/payment', { replace: true }))
          }
        }
      })
    }
  }, [refreshUser, setUser, navigate])

  const [form, setForm] = useState({
    bimbel_name: user?.tenant?.name || '',
    city: user?.tenant?.city || '',
    address: user?.tenant?.address || '',
    workspace_slug: user?.tenant?.slug || '',
    phone: user?.phone || user?.tenant?.phone || '',
    description: user?.tenant?.description || '',
  })

  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(getImageUrl(user?.tenant?.logo || user?.tenant?.logo_url) || null)

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran file logo maksimal 2MB.')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        setLogoPreview(ev.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Otomatis buat slug saat nama bimbel diisi (jika slug belum diubah manual)
  const handleNameChange = (e) => {
    const name = e.target.value
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setForm((f) => ({
      ...f,
      bimbel_name: name,
      workspace_slug: f.workspace_slug === '' || f.workspace_slug === f.bimbel_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        ? slug
        : f.workspace_slug,
    }))
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validasi frontend
    if (!form.bimbel_name.trim()) return setError('Nama bimbel wajib diisi.')
    if (!form.city) return setError('Kota / Kabupaten wajib dipilih.')
    if (!form.address.trim()) return setError('Alamat lengkap wajib diisi.')
    if (!form.workspace_slug.trim()) return setError('Alamat ruang kerja (slug) wajib diisi.')
    if (!form.phone.trim()) return setError('Nomor telepon / WhatsApp wajib diisi.')

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('bimbel_name', form.bimbel_name)
      formData.append('city', form.city)
      formData.append('address', form.address)
      formData.append('workspace_slug', form.workspace_slug)
      formData.append('phone', form.phone)
      if (form.description) formData.append('description', form.description)
      if (logoFile) {
        formData.append('logo', logoFile)
      }

      const res = await api.post('/complete-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (res.data?.success) {
        const updatedUser = res.data.data.user
        const slug = res.data.data.slug || updatedUser?.tenant?.slug

        // Simpan data user terbaru
        localStorage.setItem('user', JSON.stringify(updatedUser))
        if (setUser) setUser(updatedUser)

        // Langsung arahkan ke Dashboard Admin Bimbel dengan slug tanpa perlu login ulang!
        const targetUrl = slug ? `/${slug}/admin/dashboard` : '/admin/dashboard'
        navigate(targetUrl, { replace: true })
      } else {
        setError(res.data?.message || 'Gagal menyimpan profil.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan profil bimbel.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-[#1F2937] font-['Plus_Jakarta_Sans',system-ui,sans-serif] p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl">
        {/* Header Logo */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 no-underline text-inherit">
            <span className="w-8 h-8 rounded-lg bg-[#0D47A1] text-white flex items-center justify-center font-bold text-lg">
              B
            </span>
            <span className="font-extrabold text-xl tracking-tight text-[#0D47A1]">BIMS</span>
          </Link>
          <span className="text-sm text-[#71717A]">Langkah 4 dari 5</span>
        </div>

        {/* Stepper Progress */}
        <OnboardingStepper currentStep={4} />

        {/* Main Card */}
        <div className="bg-white border border-[#E6E6EA] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-[#1F2937] tracking-tight mb-2">
              Lengkapi Profil Bimbel Anda
            </h1>
            <p className="text-sm text-[#71717A]">
              Isi informasi lembaga bimbingan belajar Anda untuk menyiapkan ruang kerja dan portal pembelajaran.
            </p>
          </div>

          {error && (
            <div className="bg-[#FEE2E2] border border-[#F87171] text-[#B91C1C] text-sm p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Upload Logo Bimbel */}
            <div className="flex flex-col gap-2 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1F2937]">Logo Lembaga Bimbel (Opsional)</span>
                <span className="text-[11px] text-[#71717A]">PNG, JPG, SVG maks 2MB</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-[#CBD5E1] bg-white flex items-center justify-center overflow-hidden flex-none shadow-sm">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Preview Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-2xl text-[#94A3B8]">🏫</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <input
                    type="file"
                    id="complete-logo-upload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="complete-logo-upload"
                      className="px-3.5 py-2 bg-white border border-[#CBD5E1] hover:border-[#0D47A1] text-[#1F2937] text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                    >
                      {logoPreview ? 'Ganti File Logo' : 'Pilih Logo Bimbel'}
                    </label>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="px-3 py-2 text-xs text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition border-0 bg-transparent cursor-pointer font-semibold"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-[#64748B]">Logo akan digunakan pada dasbor, ruang kerja, dan portal siswa Anda.</span>
                </div>
              </div>
            </div>

            {/* Nama & Kota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1F2937]">Nama Bimbel *</label>
                <input
                  type="text"
                  value={form.bimbel_name}
                  onChange={handleNameChange}
                  className={inputCls}
                  placeholder="Contoh: Bimbel Pelita Nusantara"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1F2937]">Kota / Kabupaten *</label>
                <select
                  value={form.city}
                  onChange={set('city')}
                  className={`${inputCls} cursor-pointer`}
                  required
                >
                  <option value="">Pilih Kota / Kabupaten</option>
                  {INDONESIA_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Slug Workspace */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1F2937]">Alamat Ruang Kerja (Slug URL) *</label>
              <div className="flex items-center h-11 border border-[#C7C7CF] rounded-[10px] overflow-hidden bg-white focus-within:border-[#0D47A1] transition">
                <input
                  type="text"
                  value={form.workspace_slug}
                  onChange={set('workspace_slug')}
                  className="flex-1 min-w-0 h-full border-0 px-3 text-[15px] font-medium text-[#1F2937] focus:outline-none bg-transparent"
                  placeholder="pelita-nusantara"
                  required
                />
                <span className="font-mono text-xs text-[#5F6368] px-3 border-l border-[#ECECF0] h-full flex items-center bg-[#F3F6FA] select-none">
                  .bims.id
                </span>
              </div>
              <span className="text-[11px] text-[#71717A]">
                URL portal Anda:{' '}
                <strong className="text-[#0D47A1]">
                  /{form.workspace_slug || 'nama-bimbel'}/admin/dashboard
                </strong>
              </span>
            </div>

            {/* Nomor Telepon & Alamat Lengkap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1F2937]">Nomor Telepon / WhatsApp Bimbel *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  className={inputCls}
                  placeholder="081234567890"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1F2937]">Alamat Lengkap *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={set('address')}
                  className={inputCls}
                  placeholder="Jl. Merdeka No. 45"
                  required
                />
              </div>
            </div>

            {/* Deskripsi Singkat */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1F2937]">Deskripsi Singkat (Opsional)</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={3}
                className="border border-[#C7C7CF] rounded-[10px] p-3 text-[14px] font-medium text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition w-full resize-none bg-white"
                placeholder="Deskripsi visi misi atau keunggulan program bimbingan belajar Anda..."
              />
            </div>

            {/* Tombol Simpan */}
            <div className="mt-4 pt-4 border-t border-[#ECECF0]">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-[#0D47A1] hover:bg-[#0A3880] text-white font-extrabold text-base rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan & Menyiapkan Ruang Kerja...</span>
                  </>
                ) : (
                  <span>Selesai & Masuk ke Dashboard Admin →</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
