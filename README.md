# BIMS - Bimbel Integrated Management System

Repositori ini memuat seluruh sistem BIMS yang mencakup:
- **Backend**: Laravel 12 API (PHP 8.3) dengan Supabase PostgreSQL & Midtrans Payment Gateway.
- **Frontend**: React 19 + Vite + Tailwind CSS (di dalam direktori `frontend/`).

---

## Struktur Folder

```
├── app/                  # Controller, Models, Middleware Laravel
├── bootstrap/            # Konfigurasi bootstrap Laravel
├── config/               # File konfigurasi Laravel
├── database/             # Migrasi & Seeder database
├── routes/               # Routing API & Web
├── api/                  # Serverless entrypoint untuk Vercel
├── vercel.json           # Konfigurasi deployment Vercel
├── frontend/             # Aplikasi Front End (React + Vite)
│   ├── src/              # Komponen, Halaman, Services
│   ├── public/           # Aset statis frontend
│   └── package.json      # Dependensi frontend
└── README.md
```

---

## Menjalankan Proyek Secara Lokal

### 1. Menjalankan Backend (Laravel)
```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```
Backend berjalan di: `http://localhost:8000`

### 2. Menjalankan Frontend (React Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend berjalan di: `http://localhost:5173`
