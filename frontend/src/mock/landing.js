export const LANDING_TEXT = {
  en: {
    // Navbar
    navFeatures: 'Features',
    navRoles: 'Roles',
    navHow: 'How it works',
    navPricing: 'Pricing',
    login: 'Log in',
    register: 'Register your bimbel',

    // Hero
    eyebrow: 'Multi-tenant LMS for tutoring centers',
    heroA: 'One platform.',
    heroB: 'Every bimbel gets its own classroom.',
    heroSub:
      'Schedules, PDF and video materials, and timed CBT exams with automatic scoring — all in one place, in a separate workspace for your bimbel. No servers to buy, no IT team needed.',
    ctaPrimary: 'Register your bimbel',
    ctaSecondary: 'See it in action',
    heroChecks: ['Separate data per bimbel', 'Monthly subscription', 'Works on phone and laptop'],
    mockTenant: 'Workspace',
    mockActive: 'Active',
    mockToday: "Today's schedule",
    mockExam: 'Mathematics Tryout 1',
    mockExamMeta: '20 questions · 60 minutes · 1 attempt',
    mockScore: 'Score calculated the moment the exam ends',

    // Problem
    problemTitle: 'From scattered WhatsApp groups to one organized place.',
    problems: [
      {
        before: 'Schedules typed up and shared in chat groups',
        after: 'One schedule per class, with clash checks for tutors and rooms',
      },
      {
        before: 'PDFs and videos buried under hundreds of messages',
        after: 'Materials filed by class, ready whenever students need them',
      },
      {
        before: 'Each tutor sends practice questions their own way',
        after: 'Timed CBT exams, scored automatically, results in one report',
      },
    ],

    // Features
    featEyebrow: 'What you get',
    featTitle: 'Everything a bimbel needs to run learning online',
    features: [
      {
        title: 'Your own workspace',
        body: "Each bimbel's students, classes, materials and scores are kept apart from every other bimbel on the platform.",
      },
      {
        title: 'Four clear roles',
        body: 'Super Admin, Admin Bimbel, Tutor and Student each see only what they are allowed to — checked on the server, not just hidden in the menu.',
      },
      {
        title: 'Classes and schedules',
        body: 'Add tutors and students, group them into classes, and set schedules. Overlapping sessions for the same tutor or class are blocked.',
      },
      {
        title: 'PDF and video materials',
        body: 'Tutors publish PDFs (up to 20 MB) or HTTPS video links to the classes they teach. Files are private to that class.',
      },
      {
        title: 'CBT with auto-scoring',
        body: 'Multiple-choice exams with a server timer, autosave every few seconds, one attempt per student, and an instant score out of 100.',
      },
      {
        title: 'Results and reports',
        body: 'Admins see the whole bimbel, tutors see their classes, students see their own scores. Export results to CSV.',
      },
    ],

    // Roles
    rolesEyebrow: 'Built for everyone involved',
    rolesTitle: 'The right view for each role',
    roles: [
      {
        name: 'Super Admin',
        can: [
          'Approves new bimbel registrations',
          'Manages plans, active periods and billing status',
          'Monitors service health and backups',
        ],
      },
      {
        name: 'Admin Bimbel',
        can: [
          'Manages students, tutors, subjects and classes',
          'Sets class schedules',
          'Sees performance reports for the whole bimbel',
        ],
      },
      {
        name: 'Tutor',
        can: [
          'Publishes PDF and video materials',
          'Creates and schedules CBT exams',
          'Sees results for the classes they teach',
        ],
      },
      {
        name: 'Student',
        can: ['Opens materials for their classes', 'Takes timed exams', 'Sees their own scores'],
      },
    ],

    // How it works
    howTitle: 'Up and running in three steps',
    steps: [
      {
        n: '1',
        title: 'Register your bimbel',
        body: "Fill in your bimbel's details and choose a plan. Your registration is saved as Pending.",
      },
      {
        n: '2',
        title: 'Get approved',
        body: 'The BIMS Super Admin reviews and approves it, and your private workspace is switched on.',
      },
      {
        n: '3',
        title: 'Set up and teach',
        body: 'Add tutors and students, create classes, and start sharing materials and exams.',
      },
    ],

    // Pricing
    priceTitle: 'Start monthly. Switch to yearly when it fits.',
    priceSub:
      'Plans differ by the number of users. Every plan includes all learning features and your own isolated workspace.',
    popular: 'Most chosen',
    perMonth: '/ month',
    choosePlan: 'Choose this plan',
    priceNote:
      'Prices and user limits are placeholders until the plan list is finalized. Billing is recorded manually by the Super Admin in this version.',
    planUsers: 'Up to [USER LIMIT] users',
    planItems: [
      [
        'All learning features: classes, schedules, materials, CBT, reports',
        'Your own isolated workspace',
        'Daily backups',
      ],
      [
        'All learning features: classes, schedules, materials, CBT, reports',
        'Your own isolated workspace',
        'Daily backups',
      ],
      [
        'All learning features: classes, schedules, materials, CBT, reports',
        'Your own isolated workspace',
        'Room for large tryout groups',
      ],
    ],

    // Trust
    trustTitle: 'Your data stays yours',
    trust: [
      {
        title: 'Isolated per bimbel',
        body: 'Every request is checked against your workspace, so another bimbel can never open your data.',
      },
      {
        title: 'Protected accounts',
        body: 'Passwords are stored hashed, sign-in runs over HTTPS, and sessions end at logout.',
      },
      {
        title: 'Daily backups',
        body: 'Your database and PDF materials are backed up at least every 24 hours.',
      },
      {
        title: 'Private materials',
        body: 'PDFs are only served to signed-in users of the class they belong to.',
      },
    ],

    // FAQ
    faqTitle: 'Questions bimbel owners ask',
    faq: [
      {
        q: 'Do we need our own server or IT staff?',
        a: 'No. BIMS is a hosted service. You sign in from a browser and we look after the servers, updates and backups.',
      },
      {
        q: 'Can other bimbel on BIMS see our students?',
        a: 'No. Each bimbel works in its own workspace, and every page and file request is checked against it.',
      },
      {
        q: 'What kind of exams are supported?',
        a: 'This version supports multiple-choice exams with four options and one correct answer, a time limit set by the tutor, and one attempt per student.',
      },
      {
        q: 'What happens if our subscription runs out?',
        a: 'Learning features pause, but your data is kept. Renew and everything is back as it was.',
      },
    ],

    // Final CTA & Footer
    finalTitle: 'Bring your schedules, materials and exams into one place.',
    footer: 'Built by Team CATALYST · Telkom University',
  },

  id: {
    navFeatures: 'Fitur',
    navRoles: 'Peran',
    navHow: 'Cara kerja',
    navPricing: 'Harga',
    login: 'Masuk',
    register: 'Daftarkan bimbel',

    eyebrow: 'LMS multi-tenant untuk bimbingan belajar',
    heroA: 'Satu platform.',
    heroB: 'Setiap bimbel punya ruang kelasnya sendiri.',
    heroSub:
      'Jadwal, materi PDF dan video, serta ujian CBT berbatas waktu dengan penilaian otomatis — semuanya di satu tempat, dalam ruang kerja khusus untuk bimbel Anda. Tanpa membeli server, tanpa tim IT.',
    ctaPrimary: 'Daftarkan bimbel',
    ctaSecondary: 'Lihat cara kerjanya',
    heroChecks: ['Data terpisah tiap bimbel', 'Langganan bulanan', 'Bisa di HP dan laptop'],
    mockTenant: 'Ruang kerja',
    mockActive: 'Aktif',
    mockToday: 'Jadwal hari ini',
    mockExam: 'Tryout Matematika 1',
    mockExamMeta: '20 soal · 60 menit · 1 percobaan',
    mockScore: 'Skor langsung dihitung saat ujian selesai',

    problemTitle: 'Dari grup WhatsApp yang berserakan ke satu tempat yang rapi.',
    problems: [
      {
        before: 'Jadwal diketik lalu dibagikan di grup',
        after: 'Satu jadwal per kelas, dengan cek bentrok tutor dan kelas',
      },
      {
        before: 'PDF dan video tenggelam di ratusan pesan',
        after: 'Materi tersusun per kelas, siap dibuka kapan saja',
      },
      {
        before: 'Setiap tutor membagikan soal dengan caranya sendiri',
        after: 'Ujian CBT berbatas waktu, dinilai otomatis, hasil dalam satu laporan',
      },
    ],

    featEyebrow: 'Yang Anda dapatkan',
    featTitle: 'Semua yang dibutuhkan bimbel untuk belajar online',
    features: [
      {
        title: 'Ruang kerja sendiri',
        body: 'Siswa, kelas, materi, dan nilai setiap bimbel terpisah dari bimbel lain di platform.',
      },
      {
        title: 'Empat peran yang jelas',
        body: 'Super Admin, Admin Bimbel, Tutor, dan Siswa hanya melihat yang menjadi haknya — diperiksa di server, bukan sekadar disembunyikan di menu.',
      },
      {
        title: 'Kelas dan jadwal',
        body: 'Tambahkan tutor dan siswa, kelompokkan ke kelas, lalu atur jadwal. Sesi yang bertumpang tindih untuk tutor atau kelas yang sama ditolak.',
      },
      {
        title: 'Materi PDF dan video',
        body: 'Tutor menerbitkan PDF (maks. 20 MB) atau tautan video HTTPS ke kelas yang diampunya. Berkas hanya untuk kelas tersebut.',
      },
      {
        title: 'CBT dengan nilai otomatis',
        body: 'Ujian pilihan ganda dengan timer server, simpan otomatis setiap beberapa detik, satu percobaan per siswa, dan skor 0–100 seketika.',
      },
      {
        title: 'Hasil dan laporan',
        body: 'Admin melihat seluruh bimbel, tutor melihat kelasnya, siswa melihat nilainya sendiri. Ekspor hasil ke CSV.',
      },
    ],

    rolesEyebrow: 'Untuk semua yang terlibat',
    rolesTitle: 'Tampilan yang tepat untuk setiap peran',
    roles: [
      {
        name: 'Super Admin',
        can: [
          'Menyetujui pendaftaran bimbel baru',
          'Mengelola paket, masa aktif, dan status tagihan',
          'Memantau kondisi layanan dan backup',
        ],
      },
      {
        name: 'Admin Bimbel',
        can: [
          'Mengelola siswa, tutor, mata pelajaran, dan kelas',
          'Mengatur jadwal kelas',
          'Melihat laporan performa seluruh bimbel',
        ],
      },
      {
        name: 'Tutor',
        can: [
          'Menerbitkan materi PDF dan video',
          'Membuat dan menjadwalkan ujian CBT',
          'Melihat hasil kelas yang diampu',
        ],
      },
      {
        name: 'Siswa',
        can: [
          'Membuka materi kelasnya',
          'Mengerjakan ujian berbatas waktu',
          'Melihat nilainya sendiri',
        ],
      },
    ],

    howTitle: 'Siap digunakan dalam tiga langkah',
    steps: [
      {
        n: '1',
        title: 'Daftarkan bimbel',
        body: 'Isi data bimbel dan pilih paket. Pendaftaran Anda tersimpan dengan status Menunggu.',
      },
      {
        n: '2',
        title: 'Tunggu persetujuan',
        body: 'Super Admin BIMS memeriksa dan menyetujui, lalu ruang kerja Anda diaktifkan.',
      },
      {
        n: '3',
        title: 'Atur dan mulai mengajar',
        body: 'Tambahkan tutor dan siswa, buat kelas, lalu bagikan materi dan ujian.',
      },
    ],

    priceTitle: 'Mulai bulanan. Beralih ke tahunan saat sudah cocok.',
    priceSub:
      'Paket dibedakan berdasarkan jumlah pengguna. Semua paket mencakup seluruh fitur belajar dan ruang kerja terisolasi.',
    popular: 'Paling dipilih',
    perMonth: '/ bulan',
    choosePlan: 'Pilih paket ini',
    priceNote:
      'Harga dan batas pengguna masih placeholder sampai daftar paket ditetapkan. Pada versi ini tagihan dicatat manual oleh Super Admin.',
    planUsers: 'Hingga [BATAS PENGGUNA] pengguna',
    planItems: [
      [
        'Semua fitur belajar: kelas, jadwal, materi, CBT, laporan',
        'Ruang kerja terisolasi milik sendiri',
        'Backup harian',
      ],
      [
        'Semua fitur belajar: kelas, jadwal, materi, CBT, laporan',
        'Ruang kerja terisolasi milik sendiri',
        'Backup harian',
      ],
      [
        'Semua fitur belajar: kelas, jadwal, materi, CBT, laporan',
        'Ruang kerja terisolasi milik sendiri',
        'Cukup untuk tryout peserta banyak',
      ],
    ],

    trustTitle: 'Data Anda tetap milik Anda',
    trust: [
      {
        title: 'Terisolasi per bimbel',
        body: 'Setiap permintaan diperiksa terhadap ruang kerja Anda, sehingga bimbel lain tidak bisa membuka data Anda.',
      },
      {
        title: 'Akun terlindungi',
        body: 'Kata sandi disimpan dalam bentuk hash, login melalui HTTPS, dan sesi berakhir saat logout.',
      },
      {
        title: 'Backup harian',
        body: 'Basis data dan materi PDF dicadangkan sedikitnya setiap 24 jam.',
      },
      {
        title: 'Materi privat',
        body: 'PDF hanya diberikan kepada pengguna yang login dan terdaftar di kelasnya.',
      },
    ],

    faqTitle: 'Pertanyaan dari pemilik bimbel',
    faq: [
      {
        q: 'Apakah kami perlu server atau staf IT sendiri?',
        a: 'Tidak. BIMS adalah layanan siap pakai. Anda cukup masuk lewat browser; server, pembaruan, dan backup kami yang urus.',
      },
      {
        q: 'Apakah bimbel lain di BIMS bisa melihat siswa kami?',
        a: 'Tidak. Setiap bimbel bekerja di ruang kerjanya sendiri, dan setiap permintaan halaman maupun berkas diperiksa.',
      },
      {
        q: 'Jenis ujian apa yang didukung?',
        a: 'Versi ini mendukung pilihan ganda dengan empat opsi dan satu jawaban benar, batas waktu dari tutor, dan satu percobaan per siswa.',
      },
      {
        q: 'Bagaimana jika langganan habis?',
        a: 'Fitur belajar dijeda, tetapi data tetap tersimpan. Setelah diperpanjang, semuanya kembali seperti semula.',
      },
    ],

    finalTitle: 'Satukan jadwal, materi, dan ujian bimbel Anda di satu tempat.',
    footer: 'Dibuat oleh Tim CATALYST · Telkom University',
  },
}
