import { useState, useEffect } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import { getMyInvoices } from '../services/invoiceService'

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

export default function Invoices() {
  const [lang, setLang] = useState('id')
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyInvoices()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? []
        setInvoices(Array.isArray(data) ? data : [])
      })
      .catch((err) => setError(err.response?.data?.message || err.message || 'Gagal memuat invoice.'))
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    unpaid: invoices.filter((i) => i.status === 'unpaid').length,
    totalAmount: invoices.reduce((sum, i) => sum + Number(i.amount), 0),
  }

  return (
    <AdminLayout lang={lang} setLang={setLang}>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">
              Riwayat Tagihan
            </h1>
            <span className="text-sm text-[#5F6368]">
              Riwayat invoice langganan bimbel Anda
            </span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          {[
            { label: 'Total Invoice', value: stats.total, color: 'text-[#1F2937]', bg: 'bg-white' },
            { label: 'Lunas', value: stats.paid, color: 'text-[#1E6B3A]', bg: 'bg-[#E6F4EA]' },
            { label: 'Belum Bayar', value: stats.unpaid, color: 'text-[#8A1C12]', bg: 'bg-[#FDE7E5]' },
            { label: 'Total Tagihan', value: formatAmount(stats.totalAmount), color: 'text-[#0D47A1]', bg: 'bg-[#EEF4FF]' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border border-[#E6E6EA] rounded-2xl p-5 flex flex-col gap-1.5`}>
              <span className="text-[13px] font-semibold text-[#5F6368]">{s.label}</span>
              <span className={`font-mono text-[28px] font-semibold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Invoice table */}
        <section aria-labelledby="inv-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
          <h2 id="inv-h" className="m-0 px-6 py-5 text-[19px] font-extrabold border-b border-[#ECECF0]">
            Daftar Invoice
          </h2>

          {loading ? (
            <div className="px-6 py-12 text-center text-[#5F6368]">Memuat data...</div>
          ) : error ? (
            <div className="px-6 py-8 text-center text-red-600 text-sm">{error}</div>
          ) : invoices.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#5F6368]">Belum ada invoice.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[#5F6368] text-[12px] uppercase tracking-widest">
                    <th className="px-6 py-3 font-bold">No. Invoice</th>
                    <th className="px-3 py-3 font-bold">Paket</th>
                    <th className="px-3 py-3 font-bold">Nominal</th>
                    <th className="px-3 py-3 font-bold">Jatuh Tempo</th>
                    <th className="px-3 py-3 font-bold">Dibayar</th>
                    <th className="px-6 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-[#F2F2F5]">
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
                      <td className="px-6 py-4">
                        <span className={`text-[12px] font-bold px-2.5 py-1.5 rounded-full ${
                          inv.status === 'paid'
                            ? 'bg-[#E6F4EA] text-[#1E6B3A]'
                            : 'bg-[#FDE7E5] text-[#8A1C12]'
                        }`}>
                          {inv.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </AdminLayout>
  )
}
