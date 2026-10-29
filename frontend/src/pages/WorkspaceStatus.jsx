import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const TEXT = {
  en: {
    logout: 'Log out',
    statesAria: 'Workspace states',
    prototype: 'Prototype state',
    contact: 'Contact BIMS support',
    renewTitle: 'Renewal information',
    plan: 'Plan', perMonth: '/ month', ended: 'Ended on', billing: 'Billing', unpaid: 'Due',
    renewHow: 'Transfer the monthly fee using the payment details in your invoice email. The Super Admin records it and your workspace reopens straight away.',
    tabs: {
      pending: 'Pending',
      expired: 'Expired',
      rejected: 'Rejected',
      denied: 'Access denied',
    },
    states: {
      pending: {
        status: 'Pending',
        title: 'Your registration is being reviewed',
        body: 'Bimbel Pelita Nusantara was registered on 12 Oct 2026. The workspace switches on once the BIMS Super Admin approves it, and we will email you.',
        cta: 'Back to home', href: '/',
        foot: 'No classes, materials or users can be created yet.',
      },
      expired: {
        status: 'Subscription ended',
        title: 'Learning features are paused',
        body: "Your bimbel's subscription has ended. All your data is kept safe. Admin Bimbel can still open the profile and renewal information.",
        cta: 'Open subscription', href: '#',
        foot: 'Everything returns exactly as it was after renewal.',
      },
      rejected: {
        status: 'Rejected',
        title: 'Registration was not approved',
        body: 'Reason from the Super Admin: the workspace address and the bimbel name did not match the supporting details. You can register again with corrected details.',
        cta: 'Register again', href: '/register',
        foot: 'No data was created for this registration.',
      },
      denied: {
        status: '403',
        title: "You don't have access to this page",
        body: "This page belongs to another bimbel or to a role you don't have. Nothing was shown or changed.",
        cta: 'Back to my home', href: '/student',
        foot: 'This attempt is recorded in the access log.',
      },
    },
  },
  id: {
    logout: 'Keluar',
    statesAria: 'Status ruang kerja',
    prototype: 'Status prototipe',
    contact: 'Hubungi tim BIMS',
    renewTitle: 'Informasi perpanjangan',
    plan: 'Paket', perMonth: '/ bulan', ended: 'Berakhir pada', billing: 'Tagihan', unpaid: 'Jatuh tempo',
    renewHow: 'Transfer biaya bulanan sesuai rincian pembayaran di email tagihan. Super Admin mencatatnya dan ruang kerja langsung dibuka kembali.',
    tabs: {
      pending: 'Menunggu',
      expired: 'Kedaluwarsa',
      rejected: 'Ditolak',
      denied: 'Akses ditolak',
    },
    states: {
      pending: {
        status: 'Menunggu',
        title: 'Pendaftaran sedang ditinjau',
        body: 'Bimbel Pelita Nusantara terdaftar pada 12 Okt 2026. Ruang kerja aktif setelah Super Admin BIMS menyetujuinya, dan kami akan mengirim email.',
        cta: 'Kembali ke beranda', href: '/',
        foot: 'Belum bisa membuat kelas, materi, atau pengguna.',
      },
      expired: {
        status: 'Langganan berakhir',
        title: 'Fitur belajar sedang dijeda',
        body: 'Langganan bimbel Anda sudah berakhir. Semua data tetap tersimpan aman. Admin Bimbel masih bisa membuka profil dan informasi perpanjangan.',
        cta: 'Buka langganan', href: '#',
        foot: 'Semua kembali seperti semula setelah diperpanjang.',
      },
      rejected: {
        status: 'Ditolak',
        title: 'Pendaftaran tidak disetujui',
        body: 'Alasan dari Super Admin: alamat ruang kerja dan nama bimbel tidak sesuai dengan data pendukung. Anda dapat mendaftar ulang dengan data yang diperbaiki.',
        cta: 'Daftar ulang', href: '/register',
        foot: 'Tidak ada data yang dibuat dari pendaftaran ini.',
      },
      denied: {
        status: '403',
        title: 'Anda tidak memiliki akses ke halaman ini',
        body: 'Halaman ini milik bimbel lain atau peran yang bukan milik Anda. Tidak ada data yang ditampilkan atau diubah.',
        cta: 'Kembali ke beranda saya', href: '/student',
        foot: 'Percobaan ini tercatat di log akses.',
      },
    },
  },
}

const STATE_CONFIG = {
  pending: {
    badge: 'bg-[#FCEFC9] text-[#6B4A00]',
    iconWrap: 'bg-[#FCEFC9] text-[#6B4A00]',
    icon: 'M6 2h12 M6 22h12 M7 2v4a5 5 0 0 0 10 0V2 M7 22v-4a5 5 0 0 1 10 0v4',
  },
  expired: {
    badge: 'bg-[#FDE7E5] text-[#8A1C12]',
    iconWrap: 'bg-[#FDE7E5] text-[#8A1C12]',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M10 9v6 M14 9v6',
  },
  rejected: {
    badge: 'bg-[#FDE7E5] text-[#8A1C12]',
    iconWrap: 'bg-[#FDE7E5] text-[#8A1C12]',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M15 9l-6 6 M9 9l6 6',
  },
  denied: {
    badge: 'bg-[#F1F1F4] text-[#1F2937]',
    iconWrap: 'bg-[#F1F1F4] text-[#1F2937]',
    icon: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
  },
}

export default function WorkspaceStatus() {
  const [lang, setLang] = useState('id')
  const [s, setS] = useState('pending')
  const { logout } = useAuth()
  const navigate = useNavigate()

  const t = TEXT[lang]
  const cur = t.states[s]
  const cfg = STATE_CONFIG[s]

  const btnOn = 'h-8 min-w-[40px] px-3 rounded-full bg-[#0D47A1] text-white text-sm font-bold border-0 cursor-pointer'
  const btnOff = 'h-8 min-w-[40px] px-3 rounded-full bg-transparent text-[#1F2937] text-sm font-bold border-0 cursor-pointer'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#1F2937]">
      {/* Header */}
      <header className="bg-white border-b border-[#E6E6EA] sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex flex-wrap items-center gap-3 gap-x-5">
          <Link to="/" className="flex items-center no-underline flex-none">
            <img src="/logo.png" alt="BIMS" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex-1" />
          <div className="flex gap-0.5 p-[3px] border border-[#E6E6EA] rounded-full items-center bg-[#F3F6FA]">
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? btnOn : btnOff}>EN</button>
            <button type="button" onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? btnOn : btnOff}>ID</button>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center h-10 px-4 text-[#1F2937] font-semibold text-sm gap-2 rounded-xl hover:bg-[#F3F6FA] transition cursor-pointer border-0 bg-transparent"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.logout}
          </button>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-8 pb-14 flex flex-col gap-7">
        {/* Tab switcher — untuk prototype */}
        <div role="tablist" aria-label={t.statesAria} className="flex flex-wrap gap-2 items-center">
          <span className="font-mono text-[12px] tracking-widest uppercase text-[#5F6368] mr-2">{t.prototype}</span>
          {Object.keys(t.tabs).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={s === key}
              onClick={() => setS(key)}
              className={`h-11 px-4 rounded-full font-bold text-sm cursor-pointer transition ${
                s === key
                  ? 'bg-[#0D47A1] text-white border-[1.5px] border-[#0D47A1]'
                  : 'bg-white text-[#1F2937] border-[1.5px] border-[#C7C7CF] hover:border-[#0D47A1]'
              }`}
            >
              {t.tabs[key]}
            </button>
          ))}
        </div>

        {/* Status card */}
        <section className="max-w-[680px] mx-auto w-full bg-white border border-[#E6E6EA] rounded-[22px] p-10 flex flex-col gap-5 items-start">
          {/* Icon */}
          <span className={`w-16 h-16 rounded-[18px] flex items-center justify-center ${cfg.iconWrap}`}>
            <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
              <path d={cfg.icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          {/* Badge */}
          <span className={`text-[13px] font-bold px-3 py-1.5 rounded-full ${cfg.badge}`}>
            {cur.status}
          </span>

          <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.02em] leading-snug">{cur.title}</h1>
          <p className="m-0 text-base leading-relaxed text-[#4A4A55]">{cur.body}</p>

          {/* Renewal info — hanya untuk expired */}
          {s === 'expired' && (
            <div className="w-full flex flex-col gap-2.5 p-5 rounded-[14px] bg-[#F3F6FA]">
              <span className="font-extrabold text-[15px]">{t.renewTitle}</span>
              <dl className="m-0 grid grid-cols-[max-content_1fr] gap-x-5 gap-y-1.5 text-sm">
                <dt className="text-[#5F6368]">{t.plan}</dt>
                <dd className="m-0 font-bold">Standard · [PRICE] {t.perMonth}</dd>
                <dt className="text-[#5F6368]">{t.ended}</dt>
                <dd className="m-0 font-mono">10 Oct 2026</dd>
                <dt className="text-[#5F6368]">{t.billing}</dt>
                <dd className="m-0 font-bold text-[#8A1C12]">{t.unpaid}</dd>
              </dl>
              <span className="text-[13px] leading-relaxed text-[#4A4A55]">{t.renewHow}</span>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-2.5">
            <Link
              to={cur.href}
              className="inline-flex items-center h-12 px-5 rounded-xl bg-[#0D47A1] text-white no-underline font-bold hover:bg-[#0a3880] transition"
            >
              {cur.cta}
            </Link>
            <button
              type="button"
              className="h-12 px-[18px] rounded-xl border border-[#1F2937] bg-white text-[#1F2937] font-bold text-[15px] cursor-pointer hover:bg-[#F3F6FA] transition"
            >
              {t.contact}
            </button>
          </div>

          <span className="text-[13px] text-[#5F6368]">{cur.foot}</span>
        </section>
      </main>
    </div>
  )
}
