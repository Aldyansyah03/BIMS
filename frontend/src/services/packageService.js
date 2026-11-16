import api from './api'

// GET /api/packages — publik
export const getPackages = () => api.get('/packages')

// POST /api/checkout — perlu token
export const checkout = (packageId) =>
  api.post('/checkout', { package_id: packageId })
