// Mock data untuk Super Admin
// Nanti diganti dengan API calls

export const MOCK_KPIS_SA = {
  en: [
    { label: 'Active bimbel', value: '24', note: '3 waiting for approval', icon: 'building' },
    { label: 'Users', value: '3,182', note: 'Across all bimbel', icon: 'users' },
    { label: 'App errors (24h)', value: '2', note: 'Both resolved', icon: 'alert' },
    { label: 'Service status', value: 'Up', note: 'API · database · storage', icon: 'server' },
  ],
  id: [
    { label: 'Bimbel aktif', value: '24', note: '3 menunggu persetujuan', icon: 'building' },
    { label: 'Pengguna', value: '3.182', note: 'Dari seluruh bimbel', icon: 'users' },
    { label: 'Error aplikasi (24 jam)', value: '2', note: 'Keduanya sudah selesai', icon: 'alert' },
    { label: 'Status layanan', value: 'Aktif', note: 'API · basis data · penyimpanan', icon: 'server' },
  ],
}

export const MOCK_PENDING = [
  { id: 'a', name: 'Bimbel Pelita Nusantara', city: 'Balikpapan', owner: 'Hendra W.', plan: 'Standard', date: '12 Oct 2026' },
  { id: 'b', name: 'Rumah Belajar Sinar', city: 'Makassar', owner: 'Nur A.', plan: 'Basic', date: '13 Oct 2026' },
  { id: 'c', name: 'Prima Edukasi', city: 'Bandung', owner: 'Yosef K.', plan: 'Pro', date: '14 Oct 2026' },
]

export const MOCK_TENANTS = {
  en: [
    { name: 'Bimbel Cahaya Ilmu', plan: 'Standard', users: '142 / 200', period: '01 Nov – 30 Nov 2026', status: 'Active', billing: 'Paid', billingKey: 'good', statusKey: 'good' },
    { name: 'Bimbel Mitra Prestasi', plan: 'Basic', users: '58 / 100', period: '16 Oct – 15 Nov 2026', status: 'Active', billing: 'Paid', billingKey: 'good', statusKey: 'good' },
    { name: 'Smart Kids Course', plan: 'Pro', users: '311 / 500', period: '21 Sep – 20 Oct 2026', status: 'Active', billing: 'Due', billingKey: 'warn', statusKey: 'good' },
    { name: 'LBB Tunas Mandiri', plan: 'Basic', users: '37 / 100', period: '11 Sep – 10 Oct 2026', status: 'Expired', billing: 'Expired', billingKey: 'bad', statusKey: 'bad' },
    { name: 'Akademi Bintang', plan: 'Standard', users: '96 / 200', period: '06 Aug – 05 Sep 2026', status: 'Inactive', billing: 'Expired', billingKey: 'bad', statusKey: 'gray' },
  ],
  id: [
    { name: 'Bimbel Cahaya Ilmu', plan: 'Standard', users: '142 / 200', period: '01 Nov – 30 Nov 2026', status: 'Aktif', billing: 'Lunas', billingKey: 'good', statusKey: 'good' },
    { name: 'Bimbel Mitra Prestasi', plan: 'Basic', users: '58 / 100', period: '16 Okt – 15 Nov 2026', status: 'Aktif', billing: 'Lunas', billingKey: 'good', statusKey: 'good' },
    { name: 'Smart Kids Course', plan: 'Pro', users: '311 / 500', period: '21 Sep – 20 Okt 2026', status: 'Aktif', billing: 'Jatuh tempo', billingKey: 'warn', statusKey: 'good' },
    { name: 'LBB Tunas Mandiri', plan: 'Basic', users: '37 / 100', period: '11 Sep – 10 Okt 2026', status: 'Kedaluwarsa', billing: 'Kedaluwarsa', billingKey: 'bad', statusKey: 'bad' },
    { name: 'Akademi Bintang', plan: 'Standard', users: '96 / 200', period: '06 Agt – 05 Sep 2026', status: 'Nonaktif', billing: 'Kedaluwarsa', billingKey: 'bad', statusKey: 'gray' },
  ],
}

export const MOCK_BACKUPS = {
  en: [
    { label: 'Last database + PDF backup', value: 'Today, 02:00 WIB' },
    { label: 'Schedule', value: 'Every 24 hours' },
    { label: 'Last restore test', value: 'Passed · 1 h 12 min' },
  ],
  id: [
    { label: 'Backup basis data + PDF terakhir', value: 'Hari ini, 02.00 WIB' },
    { label: 'Jadwal', value: 'Setiap 24 jam' },
    { label: 'Uji pemulihan terakhir', value: 'Berhasil · 1 j 12 mnt' },
  ],
}
