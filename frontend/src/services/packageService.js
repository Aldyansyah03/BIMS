import api from './api'

// GET /api/packages — publik
export const getPackages = async () => {
  const response = await api.get('/packages')
  return response.data
}

// POST /api/checkout — perlu token
export const checkout = async (packageId) => {
  const response = await api.post('/checkout', { package_id: packageId })
  return response.data
}
