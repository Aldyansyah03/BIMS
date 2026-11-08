import api from './api'

/**
 * Kelas yang diikuti student yang sedang login.
 * GET /api/student/classes
 * Response: [{ id, name, subject, tutor_name, material_count, color? }]
 */
export const getMyClasses = () => api.get('/student/classes')

/**
 * Materi terbaru yang tersedia untuk student.
 * GET /api/student/materials?limit=10
 * Response: [{ id, type: 'pdf'|'video', title, subject, created_at, url? }]
 */
export const getMyMaterials = (limit = 10) =>
  api.get('/student/materials', { params: { limit } })

/**
 * Jadwal hari ini.
 * GET /api/student/schedule/today
 * Response: [{ id, start_time, end_time, subject, tutor_name, type: 'class'|'exam' }]
 */
export const getTodaySchedule = () => api.get('/student/schedule/today')

/**
 * Nilai/skor ujian terbaru.
 * GET /api/student/scores?limit=5
 * Response: [{ id, result_id, exam_title, submitted_at, score }]
 */
export const getMyScores = (limit = 5) =>
  api.get('/student/scores', { params: { limit } })
