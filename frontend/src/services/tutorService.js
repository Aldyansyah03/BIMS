import api from './api'

/**
 * Daftar kelas yang diampu tutor.
 * GET /api/tutor/classes
 * Response: [{ id, name, subject, student_count, schedule_label }]
 */
export const getTutorClasses = () => api.get('/tutor/classes')

/**
 * Daftar materi di sebuah kelas.
 * GET /api/tutor/classes/:classId/materials
 * Response: [{ id, type: 'pdf'|'video', title, file_size_label?, url, created_at }]
 */
export const getMaterials = (classId) =>
  api.get(`/tutor/classes/${classId}/materials`)

/**
 * Upload materi PDF.
 * POST /api/tutor/classes/:classId/materials   (multipart/form-data)
 * Body: { title, file } | { title, video_url }
 */
export const publishMaterial = (classId, formData) =>
  api.post(`/tutor/classes/${classId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

/**
 * Hapus materi.
 * DELETE /api/tutor/materials/:materialId
 */
export const deleteMaterial = (materialId) =>
  api.delete(`/tutor/materials/${materialId}`)

/**
 * Daftar ujian di kelas.
 * GET /api/tutor/classes/:classId/exams
 * Response: [{ id, title, question_count, duration_minutes, opens_at, closes_at, status: 'draft'|'published'|'closed' }]
 */
export const getExams = (classId) =>
  api.get(`/tutor/classes/${classId}/exams`)

/**
 * Buat ujian baru (draft).
 * POST /api/tutor/classes/:classId/exams
 * Body: { title, duration_minutes, opens_at, closes_at, max_attempts }
 */
export const createExam = (classId, body) =>
  api.post(`/tutor/classes/${classId}/exams`, body)

/**
 * Update metadata ujian.
 * PUT /api/tutor/exams/:examId
 */
export const updateExam = (examId, body) =>
  api.put(`/tutor/exams/${examId}`, body)

/**
 * Terbitkan ujian (draft → published).
 * POST /api/tutor/exams/:examId/publish
 */
export const publishExam = (examId) =>
  api.post(`/tutor/exams/${examId}/publish`)

/**
 * Daftar siswa + hasil ujian di kelas, filter per exam.
 * GET /api/tutor/classes/:classId/results?exam_id=:examId
 * Response: [{ id, name, status: 'submitted'|'not_taken', score }]
 */
export const getClassResults = (classId, examId) =>
  api.get(`/tutor/classes/${classId}/results`, { params: { exam_id: examId } })

/**
 * Export nilai kelas ke CSV.
 * GET /api/tutor/classes/:classId/results/export?exam_id=:examId
 */
export const exportResults = (classId, examId) =>
  api.get(`/tutor/classes/${classId}/results/export`, {
    params: { exam_id: examId },
    responseType: 'blob',
  })
