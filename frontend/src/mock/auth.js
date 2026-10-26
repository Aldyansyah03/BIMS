// Mock users sementara BE belum ready
// Nanti file ini tidak dipakai lagi setelah API BE jalan

export const MOCK_USERS = [
  {
    id: '1',
    name: 'Super Admin',
    email: 'superadmin@bims.id',
    password: 'password123',
    role: 'super_admin',
  },
  {
    id: '2',
    name: 'Hendra Wijaya',
    email: 'hendra@cahayailmu.id',
    password: 'password123',
    role: 'admin_bimbel',
    bimbel_name: 'Bimbel Cahaya Ilmu',
  },
  {
    id: '3',
    name: 'Rina S.',
    email: 'rina@cahayailmu.id',
    password: 'password123',
    role: 'tutor',
    bimbel_name: 'Bimbel Cahaya Ilmu',
  },
  {
    id: '4',
    name: 'Aditya Pratama',
    email: 'aditya@cahayailmu.id',
    password: 'password123',
    role: 'student',
    bimbel_name: 'Bimbel Cahaya Ilmu',
  },
]

// Simulasi POST /api/auth/login
export const mockLogin = (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find(
        (u) => u.email === email && u.password === password
      )
      if (user) {
        const { password: _, ...userWithoutPassword } = user
        resolve({
          token: 'mock-token-' + user.id,
          user: userWithoutPassword,
        })
      } else {
        reject(new Error('Email atau kata sandi salah.'))
      }
    }, 800) // simulasi delay network
  })
}
