import api from './api'

/**
 * Ambil daftar exam yang tersedia untuk student yang sedang login.
 * GET /api/student/exams
 */
export const getStudentExams = () => api.get('/student/exams')

/**
 * Mulai atau lanjutkan sebuah exam session.
 * POST /api/student/exams/:examId/start
 * Response: { session_id, exam_id, title, subject, class, duration_seconds,
 *             deadline_at (ISO), questions: [{id, number, text, options: [{key,text}]}],
 *             existing_answers: {[question_id]: key} }
 */
export const startExam = (examId) =>
  api.post(`/student/exams/${examId}/start`)

/**
 * Auto-save jawaban sementara (tidak mengumpulkan).
 * PUT /api/student/exam-sessions/:sessionId/answers
 * Body: { answers: { [question_id]: key } }
 */
export const saveAnswers = (sessionId, answers) =>
  api.put(`/student/exam-sessions/${sessionId}/answers`, { answers })

/**
 * Submit / kumpulkan ujian.
 * POST /api/student/exam-sessions/:sessionId/submit
 * Body: { answers: { [question_id]: key } }
 * Response: { result_id } — lalu redirect ke /student/result/:resultId
 */
export const submitExam = (sessionId, answers) =>
  api.post(`/student/exam-sessions/${sessionId}/submit`, { answers })

/**
 * Ambil hasil ujian setelah submit.
 * GET /api/student/exam-results/:resultId
 * Response: { exam_title, subject, submitted_at, duration_used_seconds,
 *             duration_seconds, score, correct, wrong, blank, total,
 *             question_results: [{number, status: 'correct'|'wrong'|'blank'}],
 *             history: [{name, score}] }
 */
export const getExamResult = (resultId) =>
  api.get(`/student/exam-results/${resultId}`)
