import api from './api'

/**
 * Data ringkasan dashboard admin bimbel.
 * GET /api/admin/dashboard
 * Response: {
 *   plan: { name, billing_cycle, active_until, users_used, users_limit },
 *   kpis: { students, tutors, classes, avg_score },
 *   week: { range_label, days: [{ label, date, sessions: [{id, time_start, time_end, subject, class_name, tutor_name, color}] }] },
 *   performance: [{ class_id, class_name, tutor_name, student_count, exam_count, avg_score }]
 * }
 */
export const getDashboard = () => api.get('/admin/dashboard')

/**
 * Tambah sesi jadwal.
 * POST /api/admin/sessions
 * Body: { class_id, tutor_id, day_of_week, time_start, time_end }
 * Response: { success, session } | { success: false, clash: { message, suggestion_start } }
 */
export const createSession = (payload) => api.post('/admin/sessions', payload)

/**
 * Hapus sesi jadwal.
 * DELETE /api/admin/sessions/:sessionId
 */
export const deleteSession = (sessionId) => api.delete(`/admin/sessions/${sessionId}`)

/**
 * Daftar kelas untuk dropdown form tambah sesi.
 * GET /api/admin/classes
 * Response: [{ id, name }]
 */
export const getAdminClasses = () => api.get('/admin/classes')

/**
 * Daftar tutor untuk dropdown form tambah sesi.
 * GET /api/admin/tutors
 * Response: [{ id, name }]
 */
export const getAdminTutors = () => api.get('/admin/tutors')

/**
 * Export performa kelas ke CSV.
 * GET /api/admin/performance/export
 */
export const exportPerformance = () =>
  api.get('/admin/performance/export', { responseType: 'blob' })
