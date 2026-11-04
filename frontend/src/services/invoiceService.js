import api from './api'

// GET /api/my-invoices — Admin Bimbel
export const getMyInvoices = async () => {
  const response = await api.get('/my-invoices')
  return response.data
}

// GET /api/admin/invoices — Super Admin
export const getAllInvoices = async () => {
  const response = await api.get('/admin/invoices')
  return response.data
}
