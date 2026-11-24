import { useState, useEffect } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import { useAuth } from '../hooks/useAuth'
import api, { getImageUrl } from '../services/api'

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
  'h-11 box-border border border-[#C7C7CF] rounded-[10px] px-3 text-[14px] font-medium text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition w-full bg-white'

export default function AdminProfile() {
  const [lang, setLang] = useState('id')
  const { user, setUser, refreshUser } = useAuth()

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bimbel_name: user?.tenant?.name || '',
    city: user?.tenant?.city || '',
    address: user?.tenant?.address || '',
    description: user?.tenant?.description || '',
    password: '',
    password_confirmation: '',
  })

  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(getImageUrl(user?.tenant?.logo || user?.tenant?.logo_url) || null)

  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || user.tenant?.phone || '',
        bimbel_name: user.tenant?.name || '',
        city: user.tenant?.city || '',
        address: user.tenant?.address || '',
        description: user.tenant?.description || '',
      }))
      if (user.tenant?.logo || user.tenant?.logo_url) {
        setLogoPreview(getImageUrl(user.tenant.logo || user.tenant.logo_url))
      }
    }
  }, [user])

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Ukuran file logo maksimal 2MB.')
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

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('_method', 'PUT')
      formData.append('name', form.name)
      if (form.phone) formData.append('phone', form.phone)
      if (form.bimbel_name) formData.append('bimbel_name', form.bimbel_name)
      if (form.city) formData.append('city', form.city)
      if (form.address) formData.append('address', form.address)
      if (form.description) formData.append('description', form.description)
      if (form.password) {
        formData.append('password', form.password)
        formData.append('password_confirmation', form.password_confirmation)
      }
      if (logoFile) {
        formData.append('logo', logoFile)
      }

      const res = await api.post('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Profil berhasil diperbarui!')
        const updatedUser = res.data.data
        if (updatedUser) {
          localStorage.setItem('user', JSON.stringify(updatedUser))
          if (setUser) setUser(updatedUser)
        } else if (refreshUser) {
          await refreshUser()
        }
        setForm((f) => ({ ...f, password: '', password_confirmation: '' }))
      } else {
        setErrorMsg(res.data?.message || 'Gagal menyimpan perubahan.')
      }
    } catch (err) {
      const resp = err.response?.data
      if (resp?.errors) {
        const first = Object.keys(resp.errors)[0]
        setErrorMsg(resp.errors[first][0])
      } else {
        setErrorMsg(resp?.message || 'Terjadi kesalahan saat memperbarui profil.')
      }
    } finally {
      setSaving(false)
    }
  }

  const slug = user?.tenant?.slug || 'bimbel'

  return (
    <AdminLayout lang={lang} setLang={setLang}>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6E6EA] pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1F2937] tracking-tight m-0">
              Profil Bimbel & Pengaturan Akun
            </h1>
            <p className="text-sm text-[#71717A] mt-1 m-0">
              Kelola informasi profil lembaga bimbel, identitas ruang kerja, dan akun administrator Anda.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#E8F5E9] text-[#1E6B3A] px-3 py-1.5 rounded-full text-xs font-bold self-start sm:self-auto">
            <span>●</span> Ruang Kerja Aktif
          </div>
        </div>

        {/* Notifikasi */}
        {successMsg && (
          <div className="bg-[#E8F5E9] border border-[#A5D6A7] text-[#1E6B3A] px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>✓</span> {successMsg}
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg('')}
              className="text-[#1E6B3A] hover:opacity-70 bg-transparent border-0 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="bg-[#FEE2E2] border border-[#F87171] text-[#B91C1C] px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span> {errorMsg}
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="text-[#B91C1C] hover:opacity-70 bg-transparent border-0 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Card 1: Data Lembaga Bimbel */}
          <div className="bg-white border border-[#E6E6EA] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#ECECF0] pb-3">
              <span className="w-8 h-8 rounded-lg bg-[#EEF4FF] text-[#0D47A1] flex items-center justify-center font-bold text-sm">
                🏢
              </span>
              <div>
                <h2 className="text-base font-bold text-[#1F2937] m-0">Data Lembaga Bimbingan Belajar</h2>
                <span className="text-xs text-[#71717A]">Informasi publik dan identitas lembaga Anda di platform BIMS</span>
              </div>
            </div>

            {/* Logo Bimbel Upload */}
            <div className="flex flex-col gap-2 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1F2937]">Logo Bimbel</span>
                <span className="text-[11px] text-[#71717A]">PNG, JPG, SVG maks 2MB</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-[#CBD5E1] bg-white flex items-center justify-center overflow-hidden flex-none shadow-sm">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Bimbel" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-2xl text-[#94A3B8]">🏢</span>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <input
                    type="file"
                    id="profile-logo-upload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="profile-logo-upload"
                      className="px-3.5 py-1.5 bg-white border border-[#CBD5E1] hover:border-[#0D47A1] text-[#1F2937] text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                    >
                      {logoPreview ? 'Ganti Logo' : 'Upload Logo'}
                    </label>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="px-2.5 py-1.5 text-xs text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition border-0 bg-transparent cursor-pointer font-semibold"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-[#64748B]">Logo akan tampil pada navigasi dashboard dan materi bimbingan belajar.</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1F2937]">Nama Bimbel *</label>
                <input
                  type="text"
                  value={form.bimbel_name}
                  onChange={set('bimbel_name')}
                  className={inputCls}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1F2937]">Kota / Kabupaten</label>
                <select
                  value={form.city}
                  onChange={set('city')}
                  className={`${inputCls} cursor-pointer`}
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

            {/* Slug URL Ruang Kerja (Read Only) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1F2937]">Alamat Ruang Kerja (Workspace Slug)</label>
              <div className="flex items-center h-11 border border-[#E6E6EA] rounded-[10px] overflow-hidden bg-[#F8FAFC]">
                <span className="px-3 text-xs text-[#64748B] select-none font-medium bg-[#F1F5F9] border-r border-[#E6E6EA] h-full flex items-center">
                  bims.id/
                </span>
                <input
                  type="text"
                  value={slug}
                  disabled
                  className="flex-1 min-w-0 h-full border-0 px-3 text-[14px] font-mono font-semibold text-[#0D47A1] bg-transparent cursor-not-allowed select-all"
                />
                <span className="px-3 text-xs text-[#1E6B3A] font-bold select-none">
                  ✓ Terdaftar
                </span>
              </div>
              <span className="text-[11px] text-[#71717A]">
                Slug ruang kerja digunakan sebagai identitas unik URL bimbingan belajar Anda.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1F2937]">Alamat Lengkap</label>
              <input
                type="text"
                value={form.address}
                onChange={set('address')}
                className={inputCls}
                placeholder="Jl. Sudirman No. 123"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1F2937]">Deskripsi Lembaga</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={3}
                className="border border-[#C7C7CF] rounded-[10px] p-3 text-[14px] font-medium text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition w-full resize-none bg-white"
                placeholder="Tuliskan deskripsi visi, misi, atau program bimbel Anda..."
              />
            </div>
          </div>

          {/* Card 2: Akun Administrator */}
          <div className="bg-white border border-[#E6E6EA] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#ECECF0] pb-3">
              <span className="w-8 h-8 rounded-lg bg-[#EEF4FF] text-[#0D47A1] flex items-center justify-center font-bold text-sm">
                👤
              </span>
              <div>
                <h2 className="text-base font-bold text-[#1F2937] m-0">Akun Administrator</h2>
                <span className="text-xs text-[#71717A]">Data akun login dan kontak penanggung jawab</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1F2937]">Nama Lengkap *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  className={inputCls}
                  required
                />
              </div>

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
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1F2937]">Alamat Email</label>
              <div className="flex items-center h-11 border border-[#E6E6EA] rounded-[10px] px-3 bg-[#F8FAFC] justify-between">
                <span className="text-sm font-medium text-[#4A4A55]">{form.email}</span>
                <span className="text-xs font-bold text-[#1E6B3A] bg-[#E8F5E9] px-2.5 py-1 rounded-full">
                  ✓ Terverifikasi
                </span>
              </div>
              <span className="text-[11px] text-[#71717A]">
                Alamat email terhubung dengan verifikasi akun dan penerimaan notifikasi tagihan.
              </span>
            </div>
          </div>

          {/* Card 3: Ubah Kata Sandi */}
          <div className="bg-white border border-[#E6E6EA] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#ECECF0] pb-3">
              <span className="w-8 h-8 rounded-lg bg-[#EEF4FF] text-[#0D47A1] flex items-center justify-center font-bold text-sm">
                🔒
              </span>
              <div>
                <h2 className="text-base font-bold text-[#1F2937] m-0">Keamanan & Ubah Kata Sandi</h2>
                <span className="text-xs text-[#71717A]">Kosongkan jika Anda tidak ingin mengganti kata sandi</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1F2937]">Kata Sandi Baru</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  className={inputCls}
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1F2937]">Konfirmasi Kata Sandi Baru</label>
                <input
                  type="password"
                  value={form.password_confirmation}
                  onChange={set('password_confirmation')}
                  className={inputCls}
                  placeholder="Ulangi kata sandi baru"
                />
              </div>
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#0D47A1] hover:bg-[#0A3880] text-white font-extrabold text-sm rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan Profil</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
