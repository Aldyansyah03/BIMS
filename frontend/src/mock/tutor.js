// Mock data untuk Tutor
// Nanti diganti dengan API calls

export const MOCK_TUTOR_PROFILE = {
  name: 'Rina S.',
  bimbel_name: 'Bimbel Cahaya Ilmu',
}

export const MOCK_MATERIALS = {
  en: [
    { id: 1, kind: 'PDF', title: 'Limits — summary notes', meta: '2.4 MB · 12 Oct' },
    { id: 2, kind: 'Video', title: 'Derivatives explained', meta: 'YouTube · 10 Oct' },
    { id: 3, kind: 'PDF', title: 'Derivatives — practice set 1', meta: '1.1 MB · 08 Oct' },
    { id: 4, kind: 'PDF', title: 'Formula sheet, semester 1', meta: '640 KB · 01 Oct' },
    { id: 5, kind: 'Video', title: 'Tryout 1 discussion', meta: 'YouTube · 28 Sep' },
  ],
  id: [
    { id: 1, kind: 'PDF', title: 'Limit — ringkasan materi', meta: '2,4 MB · 12 Okt' },
    { id: 2, kind: 'Video', title: 'Penjelasan turunan', meta: 'YouTube · 10 Okt' },
    { id: 3, kind: 'PDF', title: 'Turunan — latihan 1', meta: '1,1 MB · 08 Okt' },
    { id: 4, kind: 'PDF', title: 'Lembar rumus semester 1', meta: '640 KB · 01 Okt' },
    { id: 5, kind: 'Video', title: 'Pembahasan Tryout 1', meta: 'YouTube · 28 Sep' },
  ],
}

export const MOCK_EXAMS = {
  en: [
    { id: 1, title: 'Integrals Quiz', meta: '20 questions · 45 min · 21 Oct, 13:00', status: 'Draft', statusKey: 'd' },
    { id: 2, title: 'Mathematics Tryout 1', meta: '20 questions · 60 min · 18 Oct, 08:00', status: 'Published', statusKey: 'p' },
    { id: 3, title: 'Derivatives Quiz', meta: '20 questions · 45 min · 07 Oct', status: 'Closed', statusKey: 'c' },
  ],
  id: [
    { id: 1, title: 'Kuis Integral', meta: '20 soal · 45 menit · 21 Okt, 13.00', status: 'Draf', statusKey: 'd' },
    { id: 2, title: 'Tryout Matematika 1', meta: '20 soal · 60 menit · 18 Okt, 08.00', status: 'Terbit', statusKey: 'p' },
    { id: 3, title: 'Kuis Turunan', meta: '20 soal · 45 menit · 07 Okt', status: 'Ditutup', statusKey: 'c' },
  ],
}

export const MOCK_EXAM_OPTS = {
  en: [
    { k: 'A', v: 'x³ + x² + C', key: true },
    { k: 'B', v: '6x + 2 + C', key: false },
    { k: 'C', v: 'x³ + 2x² + C', key: false },
    { k: 'D', v: '3x³ + x² + C', key: false },
  ],
  id: [
    { k: 'A', v: 'x³ + x² + C', key: true },
    { k: 'B', v: '6x + 2 + C', key: false },
    { k: 'C', v: 'x³ + 2x² + C', key: false },
    { k: 'D', v: '3x³ + x² + C', key: false },
  ],
}

export const MOCK_STUDENTS = {
  en: [
    { id: 1, name: 'Aditya Pratama', exam: 'Submitted', score: '88', done: true },
    { id: 2, name: 'Bunga Lestari', exam: 'Submitted', score: '92', done: true },
    { id: 3, name: 'Citra Ayuningtyas', exam: 'Submitted', score: '75', done: true },
    { id: 4, name: 'Dewa Saputra', exam: 'Not taken', score: '0', done: false },
    { id: 5, name: 'Eka Wulandari', exam: 'Submitted', score: '81', done: true },
    { id: 6, name: 'Farhan Hidayat', exam: 'Submitted', score: '70', done: true },
  ],
  id: [
    { id: 1, name: 'Aditya Pratama', exam: 'Dikumpulkan', score: '88', done: true },
    { id: 2, name: 'Bunga Lestari', exam: 'Dikumpulkan', score: '92', done: true },
    { id: 3, name: 'Citra Ayuningtyas', exam: 'Dikumpulkan', score: '75', done: true },
    { id: 4, name: 'Dewa Saputra', exam: 'Tidak mengerjakan', score: '0', done: false },
    { id: 5, name: 'Eka Wulandari', exam: 'Dikumpulkan', score: '81', done: true },
    { id: 6, name: 'Farhan Hidayat', exam: 'Dikumpulkan', score: '70', done: true },
  ],
}
