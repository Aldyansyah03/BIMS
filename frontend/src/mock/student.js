// Mock data untuk Student
// Nanti diganti dengan API calls

export const MOCK_STUDENT_PROFILE = {
  name: 'Aditya Pratama',
  initials: 'AP',
  bimbel_name: 'Bimbel Cahaya Ilmu',
  class: { en: 'Class 12 IPA', id: 'Kelas 12 IPA' },
}

export const MOCK_CLASSES = {
  en: [
    { id: 1, name: 'Mathematics', tutor: 'Tutor: Rina S.', count: 12, color: '#0D47A1' },
    { id: 2, name: 'Physics', tutor: 'Tutor: Dimas P.', count: 9, color: '#E3B53B' },
    { id: 3, name: 'Chemistry', tutor: 'Tutor: Fajar R.', count: 7, color: '#1F2937' },
    { id: 4, name: 'English', tutor: 'Tutor: Ayu L.', count: 10, color: '#3EB6FF' },
  ],
  id: [
    { id: 1, name: 'Matematika', tutor: 'Tutor: Rina S.', count: 12, color: '#0D47A1' },
    { id: 2, name: 'Fisika', tutor: 'Tutor: Dimas P.', count: 9, color: '#E3B53B' },
    { id: 3, name: 'Kimia', tutor: 'Tutor: Fajar R.', count: 7, color: '#1F2937' },
    { id: 4, name: 'Bahasa Inggris', tutor: 'Tutor: Ayu L.', count: 10, color: '#3EB6FF' },
  ],
}

export const MOCK_EXAMS_STUDENT = {
  en: [
    { id: 1, name: 'Mathematics Tryout 1', meta: 'Today 08:00–10:00 · 60 min · 1 attempt', status: 'open', href: '/student/exam' },
    { id: 2, name: 'Integrals Quiz', meta: 'Opens 21 Oct, 13:00 · 45 min', status: 'soon', href: null },
    { id: 3, name: 'Derivatives Quiz', meta: '07 Oct · score 88', status: 'done', href: '/student/result' },
    { id: 4, name: 'Vectors Quiz', meta: '05 Oct · not taken, scored 0', status: 'closed', href: null },
  ],
  id: [
    { id: 1, name: 'Tryout Matematika 1', meta: 'Hari ini 08.00–10.00 · 60 menit · 1 percobaan', status: 'open', href: '/student/exam' },
    { id: 2, name: 'Kuis Integral', meta: 'Dibuka 21 Okt, 13.00 · 45 menit', status: 'soon', href: null },
    { id: 3, name: 'Kuis Turunan', meta: '07 Okt · skor 88', status: 'done', href: '/student/result' },
    { id: 4, name: 'Kuis Vektor', meta: '05 Okt · tidak dikerjakan, nilai 0', status: 'closed', href: null },
  ],
}

export const MOCK_MATERIALS_STUDENT = {
  en: [
    { id: 1, kind: 'PDF', title: 'Integrals — practice set 2', meta: 'Mathematics · today' },
    { id: 2, kind: 'Video', title: "Newton's laws, part 2", meta: 'Physics · yesterday' },
    { id: 3, kind: 'PDF', title: 'Reaction rates — notes', meta: 'Chemistry · 12 Oct' },
    { id: 4, kind: 'PDF', title: 'Reading comprehension pack', meta: 'English · 11 Oct' },
  ],
  id: [
    { id: 1, kind: 'PDF', title: 'Integral — latihan 2', meta: 'Matematika · hari ini' },
    { id: 2, kind: 'Video', title: 'Hukum Newton, bagian 2', meta: 'Fisika · kemarin' },
    { id: 3, kind: 'PDF', title: 'Laju reaksi — catatan', meta: 'Kimia · 12 Okt' },
    { id: 4, kind: 'PDF', title: 'Paket pemahaman bacaan', meta: 'Bahasa Inggris · 11 Okt' },
  ],
}

export const MOCK_TODAY = {
  en: [
    { time: '08:00–09:00', subject: 'Mathematics Tryout 1', tutor: 'CBT' },
    { time: '13:00–14:30', subject: 'Mathematics', tutor: 'Tutor: Rina S.' },
  ],
  id: [
    { time: '08:00–09:00', subject: 'Tryout Matematika 1', tutor: 'CBT' },
    { time: '13:00–14:30', subject: 'Matematika', tutor: 'Tutor: Rina S.' },
  ],
}

export const MOCK_SCORES = {
  en: [
    { name: 'Derivatives Quiz', date: '07 Oct', score: '88' },
    { name: 'Kinematics Quiz', date: '02 Oct', score: '79' },
    { name: 'Stoichiometry Quiz', date: '28 Sep', score: '83' },
  ],
  id: [
    { name: 'Kuis Turunan', date: '07 Okt', score: '88' },
    { name: 'Kuis Kinematika', date: '02 Okt', score: '79' },
    { name: 'Kuis Stoikiometri', date: '28 Sep', score: '83' },
  ],
}

// Mock data untuk Exam
export const MOCK_QUESTIONS = {
  en: [
    { text: 'If f(x) = 2x³ − 5x + 1, what is f′(2)?', options: ['19', '11', '24', '7'] },
    { text: 'The value of lim (x→3) of (x² − 9)/(x − 3) is …', options: ['0', '3', '6', 'Undefined'] },
    { text: '∫ from 0 to 2 of 3x² dx equals …', options: ['6', '8', '12', '4'] },
    { text: 'The gradient of the line through (1, 2) and (4, 11) is …', options: ['2', '3', '4', '9'] },
    { text: 'If log₂ x = 5, then x = …', options: ['10', '25', '32', '64'] },
  ],
  id: [
    { text: 'Jika f(x) = 2x³ − 5x + 1, maka f′(2) = …', options: ['19', '11', '24', '7'] },
    { text: 'Nilai lim (x→3) dari (x² − 9)/(x − 3) adalah …', options: ['0', '3', '6', 'Tidak terdefinisi'] },
    { text: '∫ dari 0 sampai 2 untuk 3x² dx sama dengan …', options: ['6', '8', '12', '4'] },
    { text: 'Gradien garis yang melalui (1, 2) dan (4, 11) adalah …', options: ['2', '3', '4', '9'] },
    { text: 'Jika log₂ x = 5, maka x = …', options: ['10', '25', '32', '64'] },
  ],
}

// Mock data untuk Result
export const MOCK_RESULT = {
  score: 85,
  correct: 17,
  wrong: 2,
  blank: 1,
  total: 20,
  wrong_indices: [6, 13],
  blank_indices: [17],
  history: [
    { name: { en: 'Mathematics Tryout 1', id: 'Tryout Matematika 1' }, score: 85 },
    { name: { en: 'Derivatives Quiz', id: 'Kuis Turunan' }, score: 88 },
    { name: { en: 'Limits Quiz', id: 'Kuis Limit' }, score: 76 },
    { name: { en: 'Functions Quiz', id: 'Kuis Fungsi' }, score: 70 },
  ],
}
