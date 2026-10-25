# BIMS — Bimbel Management System

Multi-tenant Learning Management System (LMS) untuk bimbingan belajar (Bimbel).

## Fitur Utama
- **12 Layar Lengkap**: Landing page, Register bimbel, Workspace Status, Login multi-peran, Super Admin, Admin Bimbel (Dashboard, Jadwal, Kelas, Anggota), Tutor (Materi & Kelas), Siswa (Beranda, CBT Exam, Hasil Tryout), dan Matriks Akses Peran.
- **Terintegrasi Supabase**: Autentikasi pendaftaran akun bimbel & login pengguna riil terhubung ke Supabase (`assets/supabase.js`).
- **Dukungan Dua Bahasa**: Bahasa Indonesia (ID) & English (EN).

## Struktur File
```text
├── index.html            # Markup utama dengan template screens
├── README.md             # Dokumentasi proyek
├── README.txt            # Dokumentasi ringkas
└── assets/
    ├── app.js            # Runtime & interaksi layar
    ├── styles.css        # Gaya dan styling global
    ├── supabase.js       # Konfigurasi & client helper Supabase
    └── logo.jpg          # Logo BIMS
```

## Cara Menjalankan
1. **Langsung Buka**: Klik ganda file `index.html` pada browser.
2. **Via Web Server Lokal**:
   ```bash
   # Menggunakan Python
   python -m http.server 8000

   # Atau menggunakan Node.js
   npx serve .
   ```
   Lalu buka di browser: `http://localhost:8000`