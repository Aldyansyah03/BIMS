import { useState, useEffect } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import { getMyInvoices } from '../services/invoiceService'
import api from '../services/api'

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

const formatAmount = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(amount))
}

// Minta snap_token untuk invoice tertentu
const getSnapToken = (invoiceId) => api.post(`/invoices/${invoiceId}/pay`)

export default function Invoices() {
  const [lang, setLang] = useState('id')
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payingId, setPayingId] = useState(null) // invoice id yang sedang diproses

  const loadInvoices = () => {
    setLoading(true)
    setError('')
    getMyInvoices()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? []
        setInvoices(Array.isArray(data) ? data : [])
      })
      .catch((err) => setError(err.response?.data?.message || err.message || 'Gagal memuat invoice.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadInvoices() }, [])

  // Buka Midtrans Snap untuk bayar invoice
  const handlePay = async (inv) => {
    setPayingId(inv.id)
    try {
      // Kalau invoice sudah punya snap_token, pakai langsung
      // Kalau tidak, minta token baru dari BE
      const token = inv.snap_token || await getSnapToken(inv.id).then((r) => r.data?.data?.snap_token ?? r.data?.snap_token)

      if (!token) {
        alert('Gagal mendapatkan token pembayaran. Hubungi admin.')
        return
      }

      if (!window.snap) {
        alert('Midtrans Snap belum dimuat. Pastikan koneksi internet aktif.')
        return
      }

      window.snap.pay(token, {
        onSuccess: () => {
          loadInvoices() // refresh setelah bayar berhasil
        },
        onPending: () => {
          loadInvoices() // refresh untuk update status pending
        },
        onError: () => {
          alert(lang === 'id' ? 'Pembayaran gagal. Silakan coba lagi.' : 'Payment failed. Please try again.')
        },
        onClose: () => {
          // User tutup popup, tidak perlu refresh
        },
      })
    } catch {
      alert(lang === 'id' ? 'Gagal memproses pembayaran.' : 'Failed to process payment.')
    } finally {
      setPayingId(null)
    }
  }

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    unpaid: invoices.filter((i) => i.status === 'unpaid').length,
    totalAmount: invoices.reduce((sum, i) => sum + Number(i.amount), 0),
  }

  return (
    <AdminLayout lang={lang} setLang={setLang}>
      <div className="p-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">
            Riwayat Tagihan
          </h1>
          <span className="text-sm text-[#5F6368]">
            Riwayat invoice langganan bimbel Anda
          </span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
          {[
            { label: 'Total Invoice',  value: stats.total,                    color: 'text-[#1F2937]',  bg: 'bg-white' },
            { label: 'Lunas',          value: stats.paid,                     color: 'text-[#1E6B3A]',  bg: 'bg-[#E6F4EA]' },
            { label: 'Belum Bayar',    value: stats.unpaid,                   color: 'text-[#8A1C12]',  bg: 'bg-[#FDE7E5]' },
            { label: 'Total Tagihan',  value: formatAmount(stats.totalAmount), color: 'text-[#0D47A1]',  bg: 'bg-[#EEF4FF]' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border border-[#E6E6EA] rounded-[18px] p-5 flex flex-col gap-2 hover:shadow-[0_8px_24px_rgba(13,71,161,0.08)] hover:border-[#BFDBFE] transition-all`}>
              <span className="text-[12px] font-semibold text-[#5F6368] uppercase tracking-wide">{s.label}</span>
              <span className={`font-mono text-[26px] font-semibold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Invoice table */}
        <section aria-labelledby="inv-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#ECECF0] flex items-center justify-between gap-3">
            <h2 id="inv-h" className="m-0 text-[19px] font-extrabold">Daftar Invoice</h2>
            {stats.unpaid > 0 && (
              <span className="text-[13px] font-semibold text-[#8A1C12] bg-[#FDE7E5] px-3 py-1.5 rounded-full">
                {stats.unpaid} {lang === 'id' ? 'belum dibayar' : 'unpaid'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="px-6 py-12 flex items-center justify-center gap-3 text-[#5F6368]">
              <div className="w-5 h-5 border-2 border-[#0D47A1] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Memuat data...</span>
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-center">
              <p className="text-[#8A1C12] text-sm font-semibold mb-3">{error}</p>
              <button
                type="button"
                onClick={loadInvoices}
                className="h-10 px-4 rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer hover:bg-[#0a3880] transition"
              >
                Coba lagi
              </button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#5F6368]">Belum ada invoice.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[#5F6368] text-[12px] uppercase tracking-widest">
                    <th className="px-6 py-3 font-bold">No. Invoice</th>
                    <th className="px-3 py-3 font-bold">Paket</th>
                    <th className="px-3 py-3 font-bold">Nominal</th>
                    <th className="px-3 py-3 font-bold">Jatuh Tempo</th>
                    <th className="px-3 py-3 font-bold">Dibayar</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-6 py-3 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const isUnpaid = inv.status === 'unpaid' || inv.status === 'pending'
                    const isPaying = payingId === inv.id
                    return (
                      <tr key={inv.id} className="border-t border-[#F2F2F5] hover:bg-[#FAFAFB] transition">
                        <td className="px-6 py-4 font-mono text-[13px] font-semibold text-[#0D47A1]">
                          {inv.invoice_number}
                        </td>
                        <td className="px-3 py-4 text-[#1F2937]">
                          {inv.subscription?.package?.name || '—'}
                        </td>
                        <td className="px-3 py-4 font-mono font-semibold">
                          {formatAmount(inv.amount)}
                        </td>
                        <td className="px-3 py-4 text-[#5F6368]">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="px-3 py-4 text-[#5F6368]">
                          {formatDate(inv.paid_at)}
                        </td>
                        <td className="px-3 py-4">
                          <span className={`text-[12px] font-bold px-2.5 py-1.5 rounded-full ${
                            inv.status === 'paid'
                              ? 'bg-[#E6F4EA] text-[#1E6B3A]'
                              : 'bg-[#FDE7E5] text-[#8A1C12]'
                          }`}>
                            {inv.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          {isUnpaid && (
                            <button
                              type="button"
                              onClick={() => handlePay(inv)}
                              disabled={isPaying}
                              className="h-10 px-4 rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-[13px] cursor-pointer hover:bg-[#0a3880] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 ml-auto"
                            >
                              {isPaying ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin flex-none" />
                                  Memproses...
                                </>
                              ) : (
                                <>
                                  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                                    <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  Bayar
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>  {/* end p-6 wrapper */}
    </AdminLayout>
  )
}
