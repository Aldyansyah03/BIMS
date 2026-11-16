import api from './api'

// GET /api/my-invoices — Admin Bimbel
export const getMyInvoices = () => api.get('/my-invoices')

// GET /api/admin/invoices — Super Admin
export const getAllInvoices = () => api.get('/admin/invoices')
