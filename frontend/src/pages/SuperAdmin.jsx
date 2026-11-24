import { useState, useEffect, useCallback } from 'react'
import SuperAdminLayout from '../components/layout/SuperAdminLayout'
import {
  getOverview, getPendingRegistrations, approveRegistration, rejectRegistration,
  getTenants, recordPayment, renewTenant, getBackupStatus, runBackup,
} from '../services/superAdminService'

// ── Icon paths ────────────────────────────────────────────────────────────────
const ICONS = {
  building: 'M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16 M16 9h2a2 2 0 0 1 2 2v10 M2 21h20 M8 7h4 M8 11h4 M8 15h4',
  users:    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  alert:    'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01',
  server:   'M4 3h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M4 13h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z M7 7h.01 M7 17h.01',
}

const BADGE = {
  good:    'bg-[#E6F4EA] text-[#1E6B3A]',
  warn:    'bg-[#FCEFC9] text-[#6B4A00]',
  bad:     'bg-[#FDE7E5] text-[#8A1C12]',
  gray:    'bg-[#F2F2F5] text-[#4A4A55]',
  pending: 'bg-[#FCEFC9] text-[#6B4A00]',
}

// Map billing_status / status dari BE ke badge key
function toBillingBadge(s) {
  if (!s) return 'gray'
  const v = s.toLowerCase()
  if (v === 'paid' || v === 'lunas') return 'good'
  if (v === 'due' || v === 'jatuh tempo') return 'warn'
  return 'bad'
}
function toStatusBadge(s) {
  if (!s) return 'gray'
  const v = s.toLowerCase()
  if (v === 'active' || v === 'aktif') return 'good'
  if (v === 'expired' || v === 'kedaluwarsa') return 'bad'
  return 'gray'
}

// ── Text strings ──────────────────────────────────────────────────────────────
const TEXT = {
  en: {
    title: 'Service overview', updated: 'Indicators refresh every 60 seconds', allOk: 'All services running',
    issue: 'Service issue detected',
    pendingTitle: 'Registrations waiting for approval',
    pendingHint: 'A workspace only switches on after you approve it.',
    approve: 'Approve', reject: 'Reject', undo: 'Undo',
    sPending: 'Pending', sActive: 'Active', sRejected: 'Rejected',
    tenantsTitle: 'Plans & billing',
    colPlan: 'Plan', colUsers: 'Users / limit', colPeriod: 'Start – end',
    colBilling: 'Billing', colAction: 'Action', perMonth: '/ mo',
    details: 'Details', recordPay: 'Record payment', renew: 'Renew', reactivate: 'Reactivate',
    backupTitle: 'Backups', runBackup: 'Run backup now', runningBackup: 'Running…',
    lastBackup: 'Last backup', schedule: 'Schedule', restoreTest: 'Last restore test',
    privacy: 'Student answers and passwords are never shown here.',
    noTenants: 'No tenants yet.', noPending: 'No pending registrations.',
    loading: 'Loading…', errorRetry: 'Retry',
  },
  id: {
    title: 'Ringkasan layanan', updated: 'Indikator diperbarui setiap 60 detik', allOk: 'Semua layanan berjalan',
    issue: 'Terdeteksi masalah layanan',
    pendingTitle: 'Pendaftaran menunggu persetujuan',
    pendingHint: 'Ruang kerja baru aktif setelah Anda setujui.',
    approve: 'Setujui', reject: 'Tolak', undo: 'Batalkan',
    sPending: 'Menunggu', sActive: 'Aktif', sRejected: 'Ditolak',
    tenantsTitle: 'Paket & tagihan',
    colPlan: 'Paket', colUsers: 'Pengguna / batas', colPeriod: 'Mulai – berakhir',
    colBilling: 'Tagihan', colAction: 'Tindakan', perMonth: '/ bln',
    details: 'Detail', recordPay: 'Catat pembayaran', renew: 'Perpanjang', reactivate: 'Aktifkan lagi',
    backupTitle: 'Backup', runBackup: 'Jalankan backup sekarang', runningBackup: 'Berjalan…',
    lastBackup: 'Backup terakhir', schedule: 'Jadwal', restoreTest: 'Uji pemulihan terakhir',
    privacy: 'Jawaban siswa dan kata sandi tidak pernah ditampilkan di sini.',
    noTenants: 'Belum ada tenant.', noPending: 'Tidak ada pendaftaran yang menunggu.',
    loading: 'Memuat…', errorRetry: 'Coba lagi',
  },
}

function Spinner({ label }) {
  return (
    <div className="flex items-center gap-3 py-6 text-[#5F6368]">
      <div className="w-4 h-4 border-2 border-[#0D47A1] border-t-transparent rounded-full animate-spin flex-none" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

function fmtDate(iso, lang) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return iso }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SuperAdmin() {
  const [lang, setLang] = useState('id')
  const t = TEXT[lang]

  // ── Overview (KPIs + service status) ────────────────────────────────────────
  const [overview, setOverview]   = useState(null)
  const [ovLoading, setOvLoading] = useState(true)

  useEffect(() => {
    getOverview()
      .then((r) => setOverview(r.data.data ?? r.data))
      .catch(() => {})
      .finally(() => setOvLoading(false))
  }, [])

  const kpis      = overview?.kpis ?? []
  const allOk     = overview?.service_status?.all_ok ?? true

  // ── Pending registrations ────────────────────────────────────────────────────
  const [pending, setPending]     = useState([])
  const [pendingLoading, setPendingLoading] = useState(true)
  // Local override for optimistic UI: { [id]: 'active' | 'rejected' | 'pending' }
  const [decided, setDecided]     = useState({})

  const loadPending = useCallback(() => {
    setPendingLoading(true)
    getPendingRegistrations()
      .then((r) => setPending(r.data.data ?? r.data ?? []))
      .catch(() => setPending([]))
      .finally(() => setPendingLoading(false))
  }, [])

  useEffect(() => { loadPending() }, [loadPending])

  const decide = async (id, action) => {
    // Optimistic update
    setDecided((d) => ({ ...d, [id]: action === 'approve' ? 'active' : 'rejected' }))
    try {
      if (action === 'approve') await approveRegistration(id)
      else await rejectRegistration(id)
    } catch {
      // Rollback on error
      setDecided((d) => ({ ...d, [id]: 'pending' }))
    }
  }

  const undoDecide = (id) => setDecided((d) => ({ ...d, [id]: undefined }))

  const pendingWithStatus = pending.map((p) => ({
    ...p,
    _status: decided[p.id] ?? p.status ?? 'pending',
  }))

  // ── Tenants ──────────────────────────────────────────────────────────────────
  const [tenants, setTenants]         = useState([])
  const [tenantsLoading, setTenantsLoading] = useState(true)
  const [actionLoading, setActionLoading]   = useState({}) // { [tenantId]: bool }

  useEffect(() => {
    getTenants()
      .then((r) => setTenants(r.data.data ?? r.data ?? []))
      .catch(() => setTenants([]))
      .finally(() => setTenantsLoading(false))
  }, [])

  const setTenantLoading = (id, val) =>
    setActionLoading((prev) => ({ ...prev, [id]: val }))

  const handleTenantAction = async (tenant) => {
    const status  = (tenant.status ?? '').toLowerCase()
    const billing = (tenant.billing_status ?? '').toLowerCase()
    setTenantLoading(tenant.id, true)
    try {
      if (billing === 'due' || billing === 'jatuh tempo') {
        await recordPayment(tenant.id, { amount: tenant.plan_price, note: 'Manual record' })
      } else if (status === 'expired' || status === 'kedaluwarsa') {
        await renewTenant(tenant.id, 1)
      } else if (status === 'inactive' || status === 'nonaktif') {
        await renewTenant(tenant.id, 1)
      }
      // Refresh tenant list
      getTenants()
        .then((r) => setTenants(r.data.data ?? r.data ?? []))
        .catch(() => {})
    } catch { /* silent */ }
    finally { setTenantLoading(tenant.id, false) }
  }

  const getTenantAction = (tenant) => {
    const s = (tenant.status ?? '').toLowerCase()
    const b = (tenant.billing_status ?? '').toLowerCase()
    if (b === 'due' || b === 'jatuh tempo') return t.recordPay
    if (s === 'expired' || s === 'kedaluwarsa') return t.renew
    if (s === 'inactive' || s === 'nonaktif') return t.reactivate
    return t.details
  }

  // ── Backup ───────────────────────────────────────────────────────────────────
  const [backup, setBackup]           = useState(null)
  const [backupRunning, setBackupRunning] = useState(false)

  useEffect(() => {
    getBackupStatus()
      .then((r) => setBackup(r.data.data ?? r.data))
      .catch(() => {})
  }, [])

  const handleRunBackup = async () => {
    setBackupRunning(true)
    try {
      await runBackup()
      // Refresh backup status
      const r = await getBackupStatus()
      setBackup(r.data.data ?? r.data)
    } catch { /* silent */ }
    finally { setBackupRunning(false) }
  }

  const backupItems = backup ? [
    { label: t.lastBackup,   value: backup.last_backup_at   ? fmtDate(backup.last_backup_at, lang) : '—' },
    { label: t.schedule,     value: backup.schedule         ?? '—' },
    { label: t.restoreTest,  value: backup.last_restore_test ?? '—' },
  ] : []

  return (
    <SuperAdminLayout lang={lang} setLang={setLang}>
      {/* ── Title + status indicator ──────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.02em]">{t.title}</h1>
          <span className="text-sm text-[#5F6368]">{t.updated}</span>
        </div>
        <span className={`inline-flex items-center gap-2 text-sm font-bold px-3.5 py-2.5 rounded-full ${
          allOk ? 'text-[#1E6B3A] bg-[#E6F4EA]' : 'text-[#8A1C12] bg-[#FDE7E5]'
        }`}>
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <circle cx="5" cy="5" r="5" fill={allOk ? '#1E8E3E' : '#B42318'} />
          </svg>
          {allOk ? t.allOk : t.issue}
        </span>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      {ovLoading ? (
        <Spinner label={t.loading} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white border border-[#E6E6EA] rounded-2xl p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[#5F6368]">{k.label}</span>
                <span className="w-9 h-9 rounded-[10px] bg-[#EEF4FF] text-[#0D47A1] flex items-center justify-center flex-none">
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={ICONS[k.icon] ?? ICONS.building} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <span className="font-mono text-[34px] font-semibold">{k.value}</span>
              {k.note && <span className="text-[13px] text-[#5F6368]">{k.note}</span>}
            </div>
          ))}
        </div>
      )}

      {/* ── Pending registrations ─────────────────────────────────────── */}
      <section aria-labelledby="pending-h" className="bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden mb-6">
        <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#ECECF0]">
          <h2 id="pending-h" className="m-0 text-[19px] font-extrabold">{t.pendingTitle}</h2>
          <span className="text-[13px] text-[#5F6368]">{t.pendingHint}</span>
        </div>

        {pendingLoading ? (
          <div className="px-6"><Spinner label={t.loading} /></div>
        ) : pendingWithStatus.length === 0 ? (
          <p className="px-6 py-5 text-[14px] text-[#5F6368] m-0">{t.noPending}</p>
        ) : (
          pendingWithStatus.map((p) => {
            const status = p._status
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-3 gap-x-6 px-6 py-4 border-b border-[#F2F2F5] last:border-0">
                <div className="flex-[2_1_200px] flex flex-col gap-0.5">
                  <span className="font-bold text-base">{p.tenant_name ?? p.name}</span>
                  <span className="text-[13px] text-[#5F6368]">
                    {[p.city, p.owner_name ?? p.owner].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <span className="flex-1 text-sm">{p.plan_name ?? p.plan}</span>
                <span className="flex-1 font-mono text-[13px] text-[#5F6368]">
                  {p.registered_at ? fmtDate(p.registered_at, lang) : p.date ?? ''}
                </span>
                <span className={`flex-none text-[12px] font-bold px-2.5 py-1.5 rounded-full ${
                  status === 'pending'  ? BADGE.pending :
                  status === 'active'   ? BADGE.good    : BADGE.bad
                }`}>
                  {status === 'pending' ? t.sPending : status === 'active' ? t.sActive : t.sRejected}
                </span>
                <div className="flex gap-2 flex-none">
                  {status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => decide(p.id, 'reject')}
                        className="h-11 px-4 rounded-[10px] border border-[#C7C7CF] bg-white text-[#1F2937] font-bold text-sm cursor-pointer flex items-center gap-1.5 hover:bg-[#F3F6FA] transition"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                          <path d="M18 6 6 18 M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t.reject}
                      </button>
                      <button
                        type="button"
                        onClick={() => decide(p.id, 'approve')}
                        className="h-11 px-4 rounded-[10px] border-0 bg-[#0D47A1] text-white font-bold text-sm cursor-pointer flex items-center gap-1.5 hover:bg-[#0a3880] transition"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
                          <path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t.approve}
                      </button>
                    </>
                  )}
                  {status !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => undoDecide(p.id)}
                      className="h-11 px-4 rounded-[10px] border border-[#C7C7CF] bg-white text-[#1F2937] font-semibold text-sm cursor-pointer hover:bg-[#F3F6FA] transition"
                    >
                      {t.undo}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </section>

      <div className="flex flex-wrap gap-5">
        {/* ── Tenants table ─────────────────────────────────────────────── */}
        <section aria-labelledby="tenants-h" className="flex-[2_1_520px] min-w-0 bg-white border border-[#E6E6EA] rounded-[18px] overflow-hidden">
          <h2 id="tenants-h" className="m-0 px-6 py-5 text-[19px] font-extrabold border-b border-[#ECECF0]">
            {t.tenantsTitle}
          </h2>
          {tenantsLoading ? (
            <div className="px-6"><Spinner label={t.loading} /></div>
          ) : tenants.length === 0 ? (
            <p className="px-6 py-5 text-[14px] text-[#5F6368] m-0">{t.noTenants}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
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
                  {tenants.map((r) => {
                    const statusBadge  = toStatusBadge(r.status)
                    const billingBadge = toBillingBadge(r.billing_status ?? r.billing)
                    const action       = getTenantAction(r)
                    const isLoading    = !!actionLoading[r.id]
                    const usersLabel   = r.users_used != null
                      ? `${r.users_used} / ${r.users_limit ?? '?'}`
                      : r.users ?? '—'
                    const periodLabel  = r.period_start && r.period_end
                      ? `${fmtDate(r.period_start, lang)} – ${fmtDate(r.period_end, lang)}`
                      : r.period ?? '—'
                    return (
                      <tr key={r.id ?? r.name} className="border-t border-[#F2F2F5]">
                        <td className="px-6 py-3.5 font-bold">{r.name}</td>
                        <td className="px-3 py-3.5">
                          <span className="block">{r.plan_name ?? r.plan}</span>
                          {r.plan_price && (
                            <span className="font-mono text-[12px] text-[#5F6368]">
                              {r.plan_price} {t.perMonth}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 font-mono">{usersLabel}</td>
                        <td className="px-3 py-3.5 font-mono text-[13px]">{periodLabel}</td>
                        <td className="px-3 py-3.5">
                          <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${BADGE[statusBadge]}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${BADGE[billingBadge]}`}>
                            {r.billing_status ?? r.billing ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleTenantAction(r)}
                            disabled={isLoading}
                            className="h-10 px-3 rounded-lg border border-[#C7C7CF] bg-white text-[#1F2937] font-bold text-[13px] cursor-pointer hover:bg-[#F3F6FA] transition disabled:opacity-50"
                          >
                            {isLoading ? '…' : action}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Backup ────────────────────────────────────────────────────── */}
        <section aria-labelledby="backup-h" className="flex-1 min-w-[260px] bg-white border border-[#E6E6EA] rounded-[18px] p-6 flex flex-col gap-4">
          <h2 id="backup-h" className="m-0 text-[19px] font-extrabold">{t.backupTitle}</h2>
          {backupItems.map((b) => (
            <div key={b.label} className="flex flex-col gap-1 pb-3.5 border-b border-[#F2F2F5]">
              <span className="text-[13px] text-[#5F6368]">{b.label}</span>
              <span className="font-bold text-[15px]">{b.value}</span>
            </div>
          ))}
          <button
            type="button"
            onClick={handleRunBackup}
            disabled={backupRunning}
            className="h-11 rounded-[10px] border border-[#1F2937] bg-white text-[#1F2937] font-bold text-sm cursor-pointer flex items-center justify-center gap-2 hover:bg-[#F3F6FA] transition disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M21 12a9 9 0 1 1-2.6-6.4L21 8 M21 3v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {backupRunning ? t.runningBackup : t.runBackup}
          </button>
          <span className="text-[12px] leading-relaxed text-[#5F6368]">{t.privacy}</span>
        </section>
      </div>
    </SuperAdminLayout>
  )
}
