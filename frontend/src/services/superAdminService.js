import api from './api'

/**
 * Ringkasan dashboard super admin.
 * GET /api/super-admin/overview
 * Response: {
 *   kpis: [{ label, value, note, icon }],
 *   service_status: { all_ok: bool, services: [{name, status}] }
 * }
 */
export const getOverview = () => api.get('/super-admin/overview')

/**
 * Daftar pendaftaran bimbel yang masih pending.
 * GET /api/super-admin/registrations?status=pending
 * Response: [{ id, tenant_name, city, owner_name, plan_name, registered_at, status }]
 */
export const getPendingRegistrations = () =>
  api.get('/super-admin/registrations', { params: { status: 'pending' } })

/**
 * Setujui pendaftaran.
 * POST /api/super-admin/registrations/:id/approve
 */
export const approveRegistration = (id) =>
  api.post(`/super-admin/registrations/${id}/approve`)

/**
 * Tolak pendaftaran.
 * POST /api/super-admin/registrations/:id/reject
 * Body: { reason? }
 */
export const rejectRegistration = (id, reason = '') =>
  api.post(`/super-admin/registrations/${id}/reject`, { reason })

/**
 * Daftar semua tenant aktif + billing info.
 * GET /api/super-admin/tenants
 * Response: [{
 *   id, name, plan_name, plan_price, users_used, users_limit,
 *   period_start, period_end, status: 'active'|'expired'|'inactive',
 *   billing_status: 'paid'|'due'|'expired'
 * }]
 */
export const getTenants = () => api.get('/super-admin/tenants')

/**
 * Catat pembayaran manual.
 * POST /api/super-admin/tenants/:id/record-payment
 * Body: { amount, note? }
 */
export const recordPayment = (tenantId, body) =>
  api.post(`/super-admin/tenants/${tenantId}/record-payment`, body)

/**
 * Perpanjang langganan tenant.
 * POST /api/super-admin/tenants/:id/renew
 * Body: { months: number }
 */
export const renewTenant = (tenantId, months = 1) =>
  api.post(`/super-admin/tenants/${tenantId}/renew`, { months })

/**
 * Info backup terakhir.
 * GET /api/super-admin/backups/status
 * Response: { last_backup_at, schedule, last_restore_test }
 */
export const getBackupStatus = () => api.get('/super-admin/backups/status')

/**
 * Trigger backup manual.
 * POST /api/super-admin/backups/run
 */
export const runBackup = () => api.post('/super-admin/backups/run')
