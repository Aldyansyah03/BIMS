import { useState, useEffect } from 'react'
import SuperAdminLayout from '../components/layout/SuperAdminLayout'
import { getAllInvoices } from '../services/invoiceService'

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

export default function InvoicesAdmin() {
  const [lang, setLang] = useState('id')
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | paid | unpaid

  useEffect(() => {
    getAllInvoices()
      .then((res) => {
        if (res.success) setInvoices(res.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'
    ? invoices
    : invoices.filter((i) => i.status === filter)

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    unpaid: invoices.filter((i) => i.status === 'unpaid').length,
    totalPaid: invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.amount), 0),
  }

  return (
    <SuperAdminLayout lang={lang} setLang={setLang}>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">
              Semua Invoice
            </h1>
            <span className="text-sm text-[#5F6368]">
              Laporan pemasukan dari seluruh bimbel
            </span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          {[
            { label: 'Total Invoice', value: stats.total, color: 'text-[#1F2937]', bg: 'bg-white' },
            { label: 'Lunas', value: stats.paid, color: 'text-[#1E6B3A]', bg: 'bg-[#E6F4EA]' },
            { label: 'Belum Bayar', value: stats.unpaid, color: 'text-[#8A1C12]', bg: 'bg-[#FDE7E5]' },
            { label: 'Total Pemasukan', value: formatAmount(stats.totalPaid), color: 'text-[#0D47A1]', bg: 'bg-[#EEF4FF]' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border border-[#E6E6EA] rounded-2xl p-5 flex flex-col gap-1.5`}>
              <span className="text-[13px] font-semibold text-[#5F6368]">{s.label}</span>
              <span className={`font-mono text-[26px] font-semibold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Filter + Table */}
        <section aria-labelledby="inv-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
          <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#ECECF0]">
            <h2 id="inv-h" className="m-0 text-[19px] font-extrabold">Daftar Invoice</h2>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Semua' },
                { key: 'paid', label: 'Lunas' },
                { key: 'unpaid', label: 'Belum Bayar' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`h-9 px-4 rounded-full text-sm font-bold cursor-pointer border transition ${
                    filter === f.key
                      ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                      : 'bg-white text-[#1F2937] border-[#C7C7CF] hover:border-[#0D47A1]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-[#5F6368]">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#5F6368]">Tidak ada invoice.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[#5F6368] text-[12px] uppercase tracking-widest">
                    <th className="px-6 py-3 font-bold">No. Invoice</th>
                    <th className="px-3 py-3 font-bold">Bimbel</th>
                    <th className="px-3 py-3 font-bold">Paket</th>
                    <th className="px-3 py-3 font-bold">Nominal</th>
                    <th className="px-3 py-3 font-bold">Jatuh Tempo</th>
                    <th className="px-3 py-3 font-bold">Dibayar</th>
                    <th className="px-6 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="border-t border-[#F2F2F5]">
                      <td className="px-6 py-4 font-mono text-[13px] font-semibold text-[#0D47A1]">
                        {inv.invoice_number}
                      </td>
                      <td className="px-3 py-4 font-semibold">
                        {inv.tenant?.name || '—'}
                      </td>
                      <td className="px-3 py-4 text-[#5F6368]">
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
    </SuperAdminLayout>
  )
}
