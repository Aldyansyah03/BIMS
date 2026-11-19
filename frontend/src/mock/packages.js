// Mock data packages
// Nanti diganti dengan GET /api/packages

export const MOCK_PACKAGES = [
  {
    id: 1,
    name: 'Starter',
    price: 150000,
    max_users: 50,
    description: 'Cocok untuk bimbel kecil yang baru mulai',
    features: [
      'Semua fitur belajar: kelas, jadwal, materi, CBT, laporan',
      'Ruang kerja terisolasi milik sendiri',
      'Backup harian',
    ],
    is_featured: false,
  },
  {
    id: 2,
    name: 'Standard',
    price: 300000,
    max_users: 200,
    description: 'Paling populer untuk bimbel menengah',
    features: [
      'Semua fitur belajar: kelas, jadwal, materi, CBT, laporan',
      'Ruang kerja terisolasi milik sendiri',
      'Backup harian',
      'Prioritas dukungan',
    ],
    is_featured: true,
  },
  {
    id: 3,
    name: 'Pro',
    price: 600000,
    max_users: 500,
    description: 'Untuk bimbel besar dengan banyak siswa',
    features: [
      'Semua fitur belajar: kelas, jadwal, materi, CBT, laporan',
      'Ruang kerja terisolasi milik sendiri',
      'Backup harian',
      'Prioritas dukungan',
      'Cukup untuk tryout peserta banyak',
    ],
    is_featured: false,
  },
]

// Simulasi GET /api/packages
export const mockGetPackages = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, data: MOCK_PACKAGES })
    }, 500)
  })
}

// Simulasi POST /api/register (return snap_token)
export const mockRegister = (payload) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (payload.workspace === 'cahaya-ilmu') {
        reject(new Error('Workspace address sudah digunakan.'))
        return
      }
      resolve({
        success: true,
        message: 'Pendaftaran berhasil.',
        data: {
          snap_token: 'mock-snap-token-' + Date.now(),
          tenant: {
            id: 99,
            name: payload.tenant_name,
            slug: payload.tenant_slug,
          },
          user: {
            id: 99,
            name: payload.name,
            email: payload.email,
            role: 'admin_bimbel',
          },
        },
      })
    }, 1000)
  })
}

// Simulasi POST /api/checkout (return snap_token)
export const mockCheckout = (packageId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          snap_token: 'mock-snap-token-checkout-' + packageId,
        },
      })
    }, 800)
  })
}
