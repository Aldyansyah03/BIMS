import { useState } from 'react'
import SuperAdminLayout from '../components/layout/SuperAdminLayout'
import {
  MOCK_KPIS_SA,
  MOCK_PENDING,
  MOCK_TENANTS,
  MOCK_BACKUPS,
} from '../mock/superadmin'

const ICONS = {
  building: 'M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16 M16 9h2a2 2 0 0 1 2 2v10 M2 21h20 M8 7h4 M8 11h4 M8 15h4',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01',
  server: 'M4 3h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M4 13h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z M7 7h.01 M7 17h.01',
}

const BADGE = {
  good: 'bg-[#E6F4EA] text-[#1E6B3A]',
  warn: 'bg-[#FCEFC9] text-[#6B4A00]',
  bad: 'bg-[#FDE7E5] text-[#8A1C12]',
  gray: 'bg-[#F2F2F5] text-[#4A4A55]',
  pending: 'bg-[#FCEFC9] text-[#6B4A00]',
}

const TEXT = {
  en: {
    title: 'Service overview', updated: 'Indicators refresh every 60 seconds', allOk: 'All services running',
    pendingTitle: 'Registrations waiting for approval', pendingHint: 'A workspace only switches on after you approve it.',
    approve: 'Approve', reject: 'Reject', undo: 'Undo',
    sPending: 'Pending', sActive: 'Active', sRejected: 'Rejected',
    tenantsTitle: 'Plans & billing',
    colPlan: 'Plan', colUsers: 'Users / limit', colPeriod: 'Start – end', colBilling: 'Billing', colAction: 'Action', perMonth: '/ mo',
    details: 'Details', recordPay: 'Record payment', renew: 'Renew', reactivate: 'Reactivate',
    backupTitle: 'Backups', runBackup: 'Run backup now',
    privacy: 'Student answers and passwords are never shown here.',
  },
  id: {
    title: 'Ringkasan layanan', updated: 'Indikator diperbarui setiap 60 detik', allOk: 'Semua layanan berjalan',
    pendingTitle: 'Pendaftaran menunggu persetujuan', pendingHint: 'Ruang kerja baru aktif setelah Anda setujui.',
    approve: 'Setujui', reject: 'Tolak', undo: 'Batalkan',
    sPending: 'Menunggu', sActive: 'Aktif', sRejected: 'Ditolak',
    tenantsTitle: 'Paket & tagihan',
    colPlan: 'Paket', colUsers: 'Pengguna / batas', colPeriod: 'Mulai – berakhir', colBilling: 'Tagihan', colAction: 'Tindakan', perMonth: '/ bln',
    details: 'Detail', recordPay: 'Catat pembayaran', renew: 'Perpanjang', reactivate: 'Aktifkan lagi',
    backupTitle: 'Backup', runBackup: 'Jalankan backup sekarang',
    privacy: 'Jawaban siswa dan kata sandi tidak pernah ditampilkan di sini.',
  },
}

export default function SuperAdmin() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]
  const kpis = MOCK_KPIS_SA[lang]
  const tenants = MOCK_TENANTS[lang]
  const backups = MOCK_BACKUPS[lang]

  const [decided, setDecided] = useState({})

  const decide = (id, val) => setDecided((d) => ({ ...d, [id]: val }))

  const pending = MOCK_PENDING.map((p) => ({
    ...p,
    status: decided[p.id] || 'pending',
  }))

  const getAction = (tenant) => {
    if (tenant.billingKey === 'warn') return t.recordPay
    if (tenant.statusKey === 'bad') return t.renew
    if (tenant.statusKey === 'gray') return t.reactivate
    return t.details
  }

  return (
    <SuperAdminLayout lang={lang} setLang={setLang}>
      {/* Title + status */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.02em]">{t.title}</h1>
          <span className="text-sm text-[#5F6368]">{t.updated}</span>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1E6B3A] bg-[#E6F4EA] px-3.5 py-2.5 rounded-full">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <circle cx="5" cy="5" r="5" fill="#1E8E3E" />
          </svg>
          {t.allOk}
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-[#E6E6EA] rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[#5F6368]">{k.label}</span>
              <span className="w-9 h-9 rounded-[10px] bg-[#EEF4FF] text-[#0D47A1] flex items-center justify-center flex-none">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={ICONS[k.icon]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <span className="font-mono text-[34px] font-semibold">{k.value}</span>
            <span className="text-[13px] text-[#5F6368]">{k.note}</span>
          </div>
        ))}
      </div>

      {/* Pending registrations */}
      <section aria-labelledby="pending-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden mb-6">
        <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#ECECF0]">
          <h2 id="pending-h" className="m-0 text-[19px] font-extrabold">{t.pendingTitle}</h2>
          <span className="text-[13px] text-[#5F6368]">{t.pendingHint}</span>
        </div>
        <div className="flex flex-col">
          {pending.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 gap-x-6 px-6 py-4 border-b border-[#F2F2F5]">
              <div className="flex-[2_1_200px] flex flex-col gap-0.5">
                <span className="font-bold text-base">{p.name}</span>
                <span className="text-[13px] text-[#5F6368]">{p.city} · {p.owner}</span>
              </div>
              <span className="flex-1 text-sm">{p.plan}</span>
              <span className="flex-1 font-mono text-[13px] text-[#5F6368]">{p.date}</span>
              <span className={`flex-none text-[12px] font-bold px-2.5 py-1.5 rounded-full ${
                p.status === 'pending' ? BADGE.pending : p.status === 'active' ? BADGE.good : BADGE.bad
              }`}>
                {p.status === 'pending' ? t.sPending : p.status === 'active' ? t.sActive : t.sRejected}
              </span>
              <div className="flex gap-2 flex-none">
                {p.status === 'pending' && (
                  <>
                    <button type="button" onClick={() => decide(p.id, 'rejected')}
                      className="h-11 px-4 rounded-[10px] border border-[#C7C7CF] bg-white text-[#1F2937] font-bold text-sm cursor-pointer flex items-center gap-1.5 hover:bg-[#F3F6FA] transition">
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                        <path d="M18 6 6 18 M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t.reject}
                    </button>
                    <button type="button" onClick={() => decide(p.id, 'active')}
                      className="h-11 px-4 rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer flex items-center gap-1.5 hover:bg-[#0a3880] transition">
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                        <path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t.approve}
                    </button>
                  </>
                )}
                {p.status !== 'pending' && (
                  <button type="button" onClick={() => decide(p.id, 'pending')}
                    className="h-11 px-4 rounded-[10px] border border-[#C7C7CF] bg-white text-[#1F2937] font-semibold text-sm cursor-pointer hover:bg-[#F3F6FA] transition">
                    {t.undo}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-5">
        {/* Tenants table */}
        <section aria-labelledby="tenants-h" className="flex-[2_1_520px] min-w-0 bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
          <h2 id="tenants-h" className="m-0 px-6 py-5 text-[19px] font-extrabold border-b border-[#ECECF0]">
            {t.tenantsTitle}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[#5F6368] text-[12px] uppercase tracking-widest">
                  <th className="px-6 py-3 font-bold">Bimbel</th>
                  <th className="px-3 py-3 font-bold">{t.colPlan}</th>
                  <th className="px-3 py-3 font-bold">{t.colUsers}</th>
                  <th className="px-3 py-3 font-bold">{t.colPeriod}</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">{t.colBilling}</th>
                  <th className="px-6 py-3 font-bold text-right">{t.colAction}</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((r) => (
                  <tr key={r.name} className="border-t border-[#F2F2F5]">
                    <td className="px-6 py-3.5 font-bold">{r.name}</td>
                    <td className="px-3 py-3.5">
                      <span className="block">{r.plan}</span>
                      <span className="font-mono text-[12px] text-[#5F6368]">[PRICE] {t.perMonth}</span>
                    </td>
                    <td className="px-3 py-3.5 font-mono">{r.users}</td>
                    <td className="px-3 py-3.5 font-mono text-[13px]">{r.period}</td>
                    <td className="px-3 py-3.5">
                      <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${BADGE[r.statusKey]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${BADGE[r.billingKey]}`}>
                        {r.billing}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button type="button" className="h-10 px-3 rounded-lg border border-[#C7C7CF] bg-white text-[#1F2937] font-bold text-[13px] cursor-pointer hover:bg-[#F3F6FA] transition">
                        {getAction(r)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Backup */}
        <section aria-labelledby="backup-h" className="flex-1 min-w-[260px] bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-4">
          <h2 id="backup-h" className="m-0 text-[19px] font-extrabold">{t.backupTitle}</h2>
          {backups.map((b) => (
            <div key={b.label} className="flex flex-col gap-1 pb-3.5 border-b border-[#F2F2F5]">
              <span className="text-[13px] text-[#5F6368]">{b.label}</span>
              <span className="font-bold text-[15px]">{b.value}</span>
            </div>
          ))}
          <button type="button" className="h-11 rounded-[10px] border border-[#1F2937] bg-white text-[#1F2937] font-bold text-sm cursor-pointer flex items-center justify-center gap-2 hover:bg-[#F3F6FA] transition">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M21 12a9 9 0 1 1-2.6-6.4L21 8 M21 3v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.runBackup}
          </button>
          <span className="text-[12px] leading-relaxed text-[#5F6368]">{t.privacy}</span>
        </section>
      </div>
    </SuperAdminLayout>
  )
}
