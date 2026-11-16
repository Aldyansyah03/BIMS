import { useState, useEffect } from 'react'
import SuperAdminLayout from '../components/layout/SuperAdminLayout'
import { getPackages } from '../services/packageService'
import api from '../services/api'

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(price))

const EMPTY_FORM = {
  name: '',
  price: '',
  duration_days: '30',
  max_users: '',
  description: '',
}

export default function Packages() {
  const [lang, setLang] = useState('id')
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const fetchPackages = () => {
    setLoading(true)
    getPackages()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? []
        setPackages(Array.isArray(data) ? data : [])
      })
      .catch(() => setError('Gagal memuat paket.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPackages()
  }, [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    if (!form.name) return 'Nama paket wajib diisi.'
    if (!form.price || isNaN(form.price)) return 'Harga harus berupa angka.'
    if (!form.max_users || isNaN(form.max_users)) return 'Maks. pengguna harus berupa angka.'
    if (!form.duration_days || isNaN(form.duration_days)) return 'Durasi harus berupa angka.'
    return null
  }

  const handleSubmit = async () => {
    setFormError('')
    setFormSuccess('')
    const err = validate()
    if (err) { setFormError(err); return }

    setFormLoading(true)
    try {
      const response = await api.post('/admin/packages', {
        name: form.name,
        price: Number(form.price),
        duration_days: Number(form.duration_days),
        max_users: Number(form.max_users),
        description: form.description,
      })
      if (response.data.success) {
        setFormSuccess('Paket berhasil ditambahkan.')
        setForm(EMPTY_FORM)
        setShowForm(false)
        fetchPackages() // refresh list
      } else {
        setFormError(response.data.message || 'Gagal menambahkan paket.')
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Gagal menambahkan paket.')
    } finally {
      setFormLoading(false)
    }
  }

  const inputCls = 'h-11 border border-[#C7C7CF] rounded-[10px] px-3 text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition w-full bg-white'

  return (
    <SuperAdminLayout lang={lang} setLang={setLang}>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">
              Paket Langganan
            </h1>
            <span className="text-sm text-[#5F6368]">
              Kelola paket yang tersedia untuk bimbel
            </span>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setFormError(''); setFormSuccess('') }}
            className="h-11 px-5 rounded-xl border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer hover:bg-[#0a3880] transition flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M12 5v14 M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Tambah Paket
          </button>
        </div>

        {/* Form tambah paket */}
        {showForm && (
          <section className="bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-4">
            <h2 className="m-0 text-[19px] font-extrabold">Paket Baru</h2>

            {formError && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="px-4 py-3 rounded-xl bg-[#E6F4EA] border border-[#CEEAD6] text-[#1E6B3A] text-sm font-semibold">
                {formSuccess}
              </div>
            )}

            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold">Nama Paket *</label>
                <input
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Paket Bulanan Starter"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold">Harga (Rp) *</label>
                <input
                  value={form.price}
                  onChange={set('price')}
                  type="number"
                  placeholder="150000"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold">Durasi (hari) *</label>
                <input
                  value={form.duration_days}
                  onChange={set('duration_days')}
                  type="number"
                  placeholder="30"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold">Maks. Pengguna *</label>
                <input
                  value={form.max_users}
                  onChange={set('max_users')}
                  type="number"
                  placeholder="50"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-[13px] font-bold">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Deskripsi singkat paket ini..."
                  rows={3}
                  className="border border-[#C7C7CF] rounded-[10px] px-3 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:border-[#0D47A1] transition w-full bg-white resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={formLoading}
                className="h-11 px-5 rounded-xl border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer disabled:opacity-50 hover:bg-[#0a3880] transition flex items-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                  <path d="M22 2 11 13 M22 2l-7 20-4-9-9-4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {formLoading ? 'Menyimpan...' : 'Simpan Paket'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError('') }}
                className="h-11 px-5 rounded-xl border border-[#C7C7CF] bg-white text-[#1F2937] font-bold text-sm cursor-pointer hover:bg-[#F3F6FA] transition"
              >
                Batal
              </button>
            </div>
          </section>
        )}

        {/* List paket */}
        <section aria-labelledby="pkg-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
          <h2 id="pkg-h" className="m-0 px-6 py-5 text-[19px] font-extrabold border-b border-[#ECECF0]">
            Daftar Paket ({packages.length})
          </h2>

          {loading ? (
            <div className="px-6 py-12 text-center text-[#5F6368]">Memuat data...</div>
          ) : error ? (
            <div className="px-6 py-8 text-center text-red-600 text-sm">{error}</div>
          ) : packages.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#5F6368]">Belum ada paket.</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 p-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border border-[#E6E6EA] rounded-[16px] p-5 flex flex-col gap-3 hover:shadow-[0_4px_16px_rgba(13,71,161,0.08)] hover:border-[#BFDBFE] transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-[17px] text-[#1F2937]">{pkg.name}</span>
                    <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full flex-none ${
                      pkg.is_active
                        ? 'bg-[#E6F4EA] text-[#1E6B3A]'
                        : 'bg-[#F2F2F5] text-[#4A4A55]'
                    }`}>
                      {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-[26px] font-semibold text-[#0D47A1]">
                      {formatPrice(pkg.price)}
                    </span>
                    <span className="text-sm text-[#5F6368]">/ bulan</span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm text-[#4A4A55]">
                    <span className="flex items-center gap-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="flex-none text-[#0D47A1]">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Maks. {pkg.max_users} pengguna
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="flex-none text-[#0D47A1]">
                        <path d="M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {pkg.duration_days} hari
                    </span>
                  </div>

                  {pkg.description && (
                    <p className="m-0 text-[13px] text-[#5F6368] leading-relaxed">{pkg.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </SuperAdminLayout>
  )
}
