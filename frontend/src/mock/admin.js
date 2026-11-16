// Mock data untuk Admin Bimbel
// Nanti diganti dengan API calls

export const MOCK_ADMIN_PROFILE = {
  bimbel_name: 'Bimbel Cahaya Ilmu',
  plan: 'Standard',
  plan_until: '30 Nov 2026',
  users_used: 142,
  users_limit: 200,
}

export const MOCK_KPIS = {
  en: [
    { label: 'Students', value: '128', icon: 'grad' },
    { label: 'Tutors', value: '14', icon: 'present' },
    { label: 'Classes', value: '9', icon: 'layers' },
    { label: 'Avg. CBT score (Oct)', value: '78', icon: 'trend' },
  ],
  id: [
    { label: 'Siswa', value: '128', icon: 'grad' },
    { label: 'Tutor', value: '14', icon: 'present' },
    { label: 'Kelas', value: '9', icon: 'layers' },
    { label: 'Rata-rata nilai CBT (Okt)', value: '78', icon: 'trend' },
  ],
}

export const MOCK_WEEK = {
  en: {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    sessions: [
      [
        { time: '13:00–14:30', subject: 'Mathematics · 12 IPA', tutor: 'Rina S.', color: 'blue' },
        { time: '16:00–17:30', subject: 'English · 9 SMP', tutor: 'Ayu L.', color: 'gray' },
      ],
      [{ time: '14:30–16:00', subject: 'Physics · 12 IPA', tutor: 'Dimas P.', color: 'yellow' }],
      [
        { time: '13:00–14:30', subject: 'Chemistry · 11 IPA', tutor: 'Fajar R.', color: 'gray' },
        { time: '15:00–16:30', subject: 'Mathematics · 9 SMP', tutor: 'Rina S.', color: 'blue' },
      ],
      [{ time: '14:30–16:00', subject: 'Biology · 12 IPA', tutor: 'Sari M.', color: 'yellow' }],
      [{ time: '13:00–14:30', subject: 'English · 12 IPA', tutor: 'Ayu L.', color: 'gray' }],
      [{ time: '08:00–10:00', subject: 'Tryout · 12 IPA', tutor: 'Rina S.', color: 'blue' }],
    ],
  },
  id: {
    days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
    sessions: [
      [
        { time: '13:00–14:30', subject: 'Matematika · 12 IPA', tutor: 'Rina S.', color: 'blue' },
        { time: '16:00–17:30', subject: 'Bhs. Inggris · 9 SMP', tutor: 'Ayu L.', color: 'gray' },
      ],
      [{ time: '14:30–16:00', subject: 'Fisika · 12 IPA', tutor: 'Dimas P.', color: 'yellow' }],
      [
        { time: '13:00–14:30', subject: 'Kimia · 11 IPA', tutor: 'Fajar R.', color: 'gray' },
        { time: '15:00–16:30', subject: 'Matematika · 9 SMP', tutor: 'Rina S.', color: 'blue' },
      ],
      [{ time: '14:30–16:00', subject: 'Biologi · 12 IPA', tutor: 'Sari M.', color: 'yellow' }],
      [{ time: '13:00–14:30', subject: 'Bhs. Inggris · 12 IPA', tutor: 'Ayu L.', color: 'gray' }],
      [{ time: '08:00–10:00', subject: 'Tryout · 12 IPA', tutor: 'Rina S.', color: 'blue' }],
    ],
  },
}

export const MOCK_PERF = {
  en: [
    { cls: 'Class 12 IPA', tutor: 'Rina S.', students: 32, exams: 4, avg: 81 },
    { cls: 'Class 11 IPA', tutor: 'Fajar R.', students: 28, exams: 3, avg: 74 },
    { cls: 'Class 9 SMP', tutor: 'Ayu L.', students: 30, exams: 3, avg: 79 },
    { cls: 'Class 8 SMP', tutor: 'Dimas P.', students: 24, exams: 2, avg: 71 },
  ],
  id: [
    { cls: 'Kelas 12 IPA', tutor: 'Rina S.', students: 32, exams: 4, avg: 81 },
    { cls: 'Kelas 11 IPA', tutor: 'Fajar R.', students: 28, exams: 3, avg: 74 },
    { cls: 'Kelas 9 SMP', tutor: 'Ayu L.', students: 30, exams: 3, avg: 79 },
    { cls: 'Kelas 8 SMP', tutor: 'Dimas P.', students: 24, exams: 2, avg: 71 },
  ],
}

export const MOCK_CLASSES = {
  en: [
    { id: 1, name: 'Class 12 IPA', tutor: 'Rina S.', students: 32 },
    { id: 2, name: 'Class 11 IPA', tutor: 'Fajar R.', students: 28 },
    { id: 3, name: 'Class 9 SMP', tutor: 'Ayu L.', students: 30 },
    { id: 4, name: 'Class 8 SMP', tutor: 'Dimas P.', students: 24 },
  ],
  id: [
    { id: 1, name: 'Kelas 12 IPA', tutor: 'Rina S.', students: 32 },
    { id: 2, name: 'Kelas 11 IPA', tutor: 'Fajar R.', students: 28 },
    { id: 3, name: 'Kelas 9 SMP', tutor: 'Ayu L.', students: 30 },
    { id: 4, name: 'Kelas 8 SMP', tutor: 'Dimas P.', students: 24 },
  ],
}

export const MOCK_MEMBERS = [
  { id: 1, name: 'Aditya Pratama', email: 'aditya@siswa.id', active: true },
  { id: 2, name: 'Bunga Lestari', email: 'bunga@siswa.id', active: true },
  { id: 3, name: 'Citra Ayuningtyas', email: 'citra@siswa.id', active: true },
  { id: 4, name: 'Dewa Saputra', email: 'dewa@siswa.id', active: false },
  { id: 5, name: 'Eka Wulandari', email: 'eka@siswa.id', active: true },
  { id: 6, name: 'Farhan Hidayat', email: 'farhan@siswa.id', active: true },
]
