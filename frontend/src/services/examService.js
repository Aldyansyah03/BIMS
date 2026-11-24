import api from './api'

/**
 * Ambil daftar exam yang tersedia untuk student yang sedang login.
 * GET /api/student/exams
 */
export const getStudentExams = () => api.get('/student/exams')

/**
 * Mulai atau lanjutkan sebuah exam session.
 * POST /api/student/exams/:examId/start
 */
export const startExam = (examId) =>
  api.post(`/student/exams/${examId}/start`)

/**
 * Auto-save satu jawaban.
 * POST /api/student/exams/:examId/answer
 * Body: { question_id, option_id }
 */
export const saveAnswers = (examId, payload) =>
  api.post(`/student/exams/${examId}/answer`, payload)

/**
 * Submit / kumpulkan ujian.
 * POST /api/student/exams/:examId/submit
 * Response: { result_id }
 */
export const submitExam = (examId) =>
  api.post(`/student/exams/${examId}/submit`)

/**
 * Ambil hasil ujian setelah submit.
 * GET /api/student/exam-results/:resultId
 */
export const getExamResult = (resultId) =>
  api.get(`/student/exam-results/${resultId}`)
