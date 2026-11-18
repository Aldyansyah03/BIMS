// Simulasi POST /api/auth/register
// Nanti diganti dengan: api.post('/auth/register', payload)

export const mockRegister = (payload) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulasi workspace sudah dipakai
      if (payload.workspace === 'cahaya-ilmu') {
        reject(new Error('Workspace address sudah digunakan.'))
        return
      }
      resolve({
        message: 'Pendaftaran berhasil. Menunggu persetujuan Super Admin.',
        data: {
          bimbel_name: payload.bimbel_name,
          email: payload.email,
          workspace: payload.workspace,
          plan: payload.plan,
        },
      })
    }, 1000)
  })
}
