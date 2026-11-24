/* BIMS — runtime and screen logic (EN/ID text, data, interactions) */
const SCREENS = {};
const G = { lang: "en", current: null, inst: null };
class DCLogic {
  constructor(props) { this.props = props; this.state = null; }
  setState(partial) {
    const p = Object.assign({}, partial);
    if (Object.prototype.hasOwnProperty.call(p, "lang")) {
      G.lang = p.lang; this.props.lang = p.lang; delete p.lang;
      document.documentElement.lang = G.lang;
    }
    this.state = Object.assign({}, this.state || {}, p);
    renderCurrent();
  }
  forceUpdate() { renderCurrent(); }
}
const WHOLE = /^\{\{\s*([^{}]+?)\s*\}\}$/;
function resolve(path, scope) {
  path = path.trim();
  if (path === "true") return true;
  if (path === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
  const parts = path.split(".");
  let v = scope[parts[0]];
  for (let i = 1; i < parts.length && v != null; i++) v = v[parts[i]];
  return v;
}
function interp(str, scope) {
  return str.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_, p) => { const v = resolve(p, scope); return v == null ? "" : String(v); });
}
function build(nodes, scope, out) {
  nodes.forEach((node) => {
    if (node.nodeType === 3) { out.appendChild(document.createTextNode(interp(node.nodeValue, scope))); return; }
    if (node.nodeType !== 1) return;
    if (node.localName === "template" && node.hasAttribute("data-sc-for")) {
      const list = resolve(WHOLE.exec(node.getAttribute("list"))[1], scope) || [];
      const as = node.getAttribute("as") || "item";
      list.forEach((item, i) => { const s = Object.create(scope); s[as] = item; s.$index = i; build(Array.from(node.content.childNodes), s, out); });
      return;
    }
    if (node.localName === "template" && node.hasAttribute("data-sc-if")) {
      if (resolve(WHOLE.exec(node.getAttribute("value"))[1], scope)) build(Array.from(node.content.childNodes), scope, out);
      return;
    }
    const el = document.createElementNS(node.namespaceURI, node.localName);
    Array.from(node.attributes).forEach((a) => {
      const n = a.name, val = a.value;
      if (n.startsWith("hint-")) return;
      const whole = WHOLE.exec(val);
      if (whole) {
        const v = resolve(whole[1], scope);
        if (n.startsWith("on")) { if (typeof v === "function") el.addEventListener(n.slice(2).toLowerCase(), v); return; }
        if (n === "checked") { el.checked = !!v; if (v) el.setAttribute("checked", ""); return; }
        el.setAttribute(n, v == null ? "" : String(v));
        return;
      }
      if (n.startsWith("on")) return;
      if (val === "__LOGO__") { el.setAttribute(n, LOGO); return; }
      el.setAttribute(n, val.indexOf("{{") >= 0 ? interp(val, scope) : val);
    });
    build(Array.from(node.childNodes), scope, el);
    out.appendChild(el);
  });
}
function renderCurrent() {
  const inst = G.inst; if (!inst) return;
  const tpl = document.getElementById("tpl-" + G.current);
  const frag = document.createDocumentFragment();
  build(Array.from(tpl.content.childNodes), inst.renderVals(), frag);
  const root = document.getElementById("app");
  root.replaceChildren(frag);
  renderSwitcher();
}
function mount(name) {
  if (!SCREENS[name]) name = PAGES[0].id;
  G.current = name;
  G.inst = new SCREENS[name](Object.assign({}, DEFAULTS[name], { lang: G.lang }));
  document.title = "BIMS — " + PAGES.find((p) => p.id === name).title;
  renderCurrent();
  window.scrollTo(0, 0);
}
function go(name) { if (location.hash !== "#/" + name) location.hash = "#/" + name; else mount(name); }
window.addEventListener("hashchange", () => mount(location.hash.replace(/^#\//, "")));
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]"); if (!a || !document.getElementById("app").contains(a)) return;
  const h = a.getAttribute("href");
  if (/\.dc\.html$/.test(h)) {
    e.preventDefault();
    const targetScreen = h.replace(/^.*\//, "").replace(".dc.html", "");
    if (targetScreen === "Login" && window.BIMS_AUTH) {
      window.BIMS_AUTH.signOut();
    }
    go(targetScreen);
  }
  else if (h === "#") { e.preventDefault(); }
  else if (h.charAt(0) === "#") { e.preventDefault(); const t = document.getElementById(h.slice(1)); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }
});
function renderSwitcher() {
  const btn = document.getElementById("pg-toggle");
  btn.querySelector("span").textContent = G.lang === "id" ? "Halaman" : "Pages";
  const list = document.getElementById("pg-list");
  list.replaceChildren();
  PAGES.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = p.title;
    if (p.id === G.current) b.setAttribute("aria-current", "page");
    b.addEventListener("click", () => { list.hidden = true; btn.setAttribute("aria-expanded", "false"); go(p.id); });
    list.appendChild(b);
  });
}
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("pg-toggle"), list = document.getElementById("pg-list");
  btn.addEventListener("click", () => { list.hidden = !list.hidden; btn.setAttribute("aria-expanded", String(!list.hidden)); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !list.hidden) { list.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); } });
  mount(location.hash.replace(/^#\//, "") || PAGES[0].id);
});

const LOGO = document.querySelector('link[rel="icon"]').href;
const PAGES = [{"id": "Main", "title": "Landing page"}, {"id": "Register", "title": "Register a bimbel"}, {"id": "WorkspaceStatus", "title": "Workspace status & access denied"}, {"id": "Login", "title": "Login & role select"}, {"id": "SuperAdmin", "title": "Super Admin — tenants & service"}, {"id": "AdminDashboard", "title": "Admin Bimbel — dashboard & schedule"}, {"id": "AdminClasses", "title": "Admin Bimbel — classes & members"}, {"id": "TutorClass", "title": "Tutor — class & materials"}, {"id": "StudentHome", "title": "Student — home"}, {"id": "Exam", "title": "Student — CBT exam"}, {"id": "Result", "title": "Student — CBT result"}, {"id": "AccessMatrix", "title": "Role access & menus (SRS Tabel IVa)"}];
const DEFAULTS = {"Main": {"lang": "en"}, "Register": {"lang": "en"}, "WorkspaceStatus": {"lang": "en", "state": "expired"}, "Login": {"lang": "en"}, "SuperAdmin": {"lang": "en"}, "AdminDashboard": {"lang": "en"}, "AdminClasses": {"lang": "en"}, "TutorClass": {"lang": "en"}, "StudentHome": {"lang": "en"}, "Exam": {"lang": "en", "connection": "online"}, "Result": {"lang": "en"}, "AccessMatrix": {}};
SCREENS["Main"] = (function () {
class Component extends DCLogic {
  renderVals() {
    const lang = (this.state && this.state.lang) || this.props.lang || "en";
    const D = {
      en: {
        navFeatures: "Features", navRoles: "Roles", navHow: "How it works", navPricing: "Pricing",
        login: "Log in", register: "Register your bimbel",
        eyebrow: "Multi-tenant LMS for tutoring centers",
        heroA: "One platform.", heroB: "Every bimbel gets its own classroom.",
        heroSub: "Schedules, PDF and video materials, and timed CBT exams with automatic scoring — all in one place, in a separate workspace for your bimbel. No servers to buy, no IT team needed.",
        ctaPrimary: "Register your bimbel", ctaSecondary: "See it in action",
        heroChecks: ["Separate data per bimbel", "Monthly subscription", "Works on phone and laptop"],
        mockTenant: "Workspace", mockActive: "Active", mockToday: "Today's schedule",
        mockExam: "Mathematics Tryout 1", mockExamMeta: "20 questions · 60 minutes · 1 attempt",
        mockScore: "Score calculated the moment the exam ends",
        problemTitle: "From scattered WhatsApp groups to one organized place.",
        problems: [
          { before: "Schedules typed up and shared in chat groups", after: "One schedule per class, with clash checks for tutors and rooms" },
          { before: "PDFs and videos buried under hundreds of messages", after: "Materials filed by class, ready whenever students need them" },
          { before: "Each tutor sends practice questions their own way", after: "Timed CBT exams, scored automatically, results in one report" }
        ],
        featEyebrow: "What you get", featTitle: "Everything a bimbel needs to run learning online",
        features: [
          { n: "01", title: "Your own workspace", body: "Each bimbel's students, classes, materials and scores are kept apart from every other bimbel on the platform." },
          { n: "02", title: "Four clear roles", body: "Super Admin, Admin Bimbel, Tutor and Student each see only what they are allowed to — checked on the server, not just hidden in the menu." },
          { n: "03", title: "Classes and schedules", body: "Add tutors and students, group them into classes, and set schedules. Overlapping sessions for the same tutor or class are blocked." },
          { n: "04", title: "PDF and video materials", body: "Tutors publish PDFs (up to 20 MB) or HTTPS video links to the classes they teach. Files are private to that class." },
          { n: "05", title: "CBT with auto-scoring", body: "Multiple-choice exams with a server timer, autosave every few seconds, one attempt per student, and an instant score out of 100." },
          { n: "06", title: "Results and reports", body: "Admins see the whole bimbel, tutors see their classes, students see their own scores. Export results to CSV." }
        ],
        rolesEyebrow: "Built for everyone involved", rolesTitle: "The right view for each role",
        roles: [
          { name: "Super Admin", can: ["Approves new bimbel registrations", "Manages plans, active periods and billing status", "Monitors service health and backups"] },
          { name: "Admin Bimbel", can: ["Manages students, tutors, subjects and classes", "Sets class schedules", "Sees performance reports for the whole bimbel"] },
          { name: "Tutor", can: ["Publishes PDF and video materials", "Creates and schedules CBT exams", "Sees results for the classes they teach"] },
          { name: "Student", can: ["Opens materials for their classes", "Takes timed exams", "Sees their own scores"] }
        ],
        howTitle: "Up and running in three steps",
        steps: [
          { n: "1", title: "Register your bimbel", body: "Fill in your bimbel's details and choose a plan. Your registration is saved as Pending." },
          { n: "2", title: "Get approved", body: "The BIMS Super Admin reviews and approves it, and your private workspace is switched on." },
          { n: "3", title: "Set up and teach", body: "Add tutors and students, create classes, and start sharing materials and exams." }
        ],
        priceTitle: "Start monthly. Switch to yearly when it fits.",
        priceSub: "Plans differ by the number of users. Every plan includes all learning features and your own isolated workspace.",
        popular: "Most chosen", perMonth: "/ month", choosePlan: "Choose this plan",
        priceNote: "Prices and user limits are placeholders until the plan list is finalized. Billing is recorded manually by the Super Admin in this version.",
        planItems: [
          ["All learning features: classes, schedules, materials, CBT, reports", "Your own isolated workspace", "Daily backups"],
          ["All learning features: classes, schedules, materials, CBT, reports", "Your own isolated workspace", "Daily backups"],
          ["All learning features: classes, schedules, materials, CBT, reports", "Your own isolated workspace", "Room for large tryout groups"]
        ],
        planUsers: "Up to [USER LIMIT] users",
        trustTitle: "Your data stays yours",
        trust: [
          { title: "Isolated per bimbel", body: "Every request is checked against your workspace, so another bimbel can never open your data." },
          { title: "Protected accounts", body: "Passwords are stored hashed, sign-in runs over HTTPS, and sessions end at logout." },
          { title: "Daily backups", body: "Your database and PDF materials are backed up at least every 24 hours." },
          { title: "Private materials", body: "PDFs are only served to signed-in users of the class they belong to." }
        ],
        faqTitle: "Questions bimbel owners ask",
        faq: [
          { q: "Do we need our own server or IT staff?", a: "No. BIMS is a hosted service. You sign in from a browser and we look after the servers, updates and backups." },
          { q: "Can other bimbel on BIMS see our students?", a: "No. Each bimbel works in its own workspace, and every page and file request is checked against it." },
          { q: "What kind of exams are supported?", a: "This version supports multiple-choice exams with four options and one correct answer, a time limit set by the tutor, and one attempt per student." },
          { q: "What happens if our subscription runs out?", a: "Learning features pause, but your data is kept. Renew and everything is back as it was." }
        ],
        finalTitle: "Bring your schedules, materials and exams into one place.",
        footer: "Built by Team CATALYST · Telkom University"
      },
      id: {
        navFeatures: "Fitur", navRoles: "Peran", navHow: "Cara kerja", navPricing: "Harga",
        login: "Masuk", register: "Daftarkan bimbel",
        eyebrow: "LMS multi-tenant untuk bimbingan belajar",
        heroA: "Satu platform.", heroB: "Setiap bimbel punya ruang kelasnya sendiri.",
        heroSub: "Jadwal, materi PDF dan video, serta ujian CBT berbatas waktu dengan penilaian otomatis — semuanya di satu tempat, dalam ruang kerja khusus untuk bimbel Anda. Tanpa membeli server, tanpa tim IT.",
        ctaPrimary: "Daftarkan bimbel", ctaSecondary: "Lihat cara kerjanya",
        heroChecks: ["Data terpisah tiap bimbel", "Langganan bulanan", "Bisa di HP dan laptop"],
        mockTenant: "Ruang kerja", mockActive: "Aktif", mockToday: "Jadwal hari ini",
        mockExam: "Tryout Matematika 1", mockExamMeta: "20 soal · 60 menit · 1 percobaan",
        mockScore: "Skor langsung dihitung saat ujian selesai",
        problemTitle: "Dari grup WhatsApp yang berserakan ke satu tempat yang rapi.",
        problems: [
          { before: "Jadwal diketik lalu dibagikan di grup", after: "Satu jadwal per kelas, dengan cek bentrok tutor dan kelas" },
          { before: "PDF dan video tenggelam di ratusan pesan", after: "Materi tersusun per kelas, siap dibuka kapan saja" },
          { before: "Setiap tutor membagikan soal dengan caranya sendiri", after: "Ujian CBT berbatas waktu, dinilai otomatis, hasil dalam satu laporan" }
        ],
        featEyebrow: "Yang Anda dapatkan", featTitle: "Semua yang dibutuhkan bimbel untuk belajar online",
        features: [
          { n: "01", title: "Ruang kerja sendiri", body: "Siswa, kelas, materi, dan nilai setiap bimbel terpisah dari bimbel lain di platform." },
          { n: "02", title: "Empat peran yang jelas", body: "Super Admin, Admin Bimbel, Tutor, dan Siswa hanya melihat yang menjadi haknya — diperiksa di server, bukan sekadar disembunyikan di menu." },
          { n: "03", title: "Kelas dan jadwal", body: "Tambahkan tutor dan siswa, kelompokkan ke kelas, lalu atur jadwal. Sesi yang bertumpang tindih untuk tutor atau kelas yang sama ditolak." },
          { n: "04", title: "Materi PDF dan video", body: "Tutor menerbitkan PDF (maks. 20 MB) atau tautan video HTTPS ke kelas yang diampunya. Berkas hanya untuk kelas tersebut." },
          { n: "05", title: "CBT dengan nilai otomatis", body: "Ujian pilihan ganda dengan timer server, simpan otomatis setiap beberapa detik, satu percobaan per siswa, dan skor 0–100 seketika." },
          { n: "06", title: "Hasil dan laporan", body: "Admin melihat seluruh bimbel, tutor melihat kelasnya, siswa melihat nilainya sendiri. Ekspor hasil ke CSV." }
        ],
        rolesEyebrow: "Untuk semua yang terlibat", rolesTitle: "Tampilan yang tepat untuk setiap peran",
        roles: [
          { name: "Super Admin", can: ["Menyetujui pendaftaran bimbel baru", "Mengelola paket, masa aktif, dan status tagihan", "Memantau kondisi layanan dan backup"] },
          { name: "Admin Bimbel", can: ["Mengelola siswa, tutor, mata pelajaran, dan kelas", "Mengatur jadwal kelas", "Melihat laporan performa seluruh bimbel"] },
          { name: "Tutor", can: ["Menerbitkan materi PDF dan video", "Membuat dan menjadwalkan ujian CBT", "Melihat hasil kelas yang diampu"] },
          { name: "Siswa", can: ["Membuka materi kelasnya", "Mengerjakan ujian berbatas waktu", "Melihat nilainya sendiri"] }
        ],
        howTitle: "Siap digunakan dalam tiga langkah",
        steps: [
          { n: "1", title: "Daftarkan bimbel", body: "Isi data bimbel dan pilih paket. Pendaftaran Anda tersimpan dengan status Menunggu." },
          { n: "2", title: "Tunggu persetujuan", body: "Super Admin BIMS memeriksa dan menyetujui, lalu ruang kerja Anda diaktifkan." },
          { n: "3", title: "Atur dan mulai mengajar", body: "Tambahkan tutor dan siswa, buat kelas, lalu bagikan materi dan ujian." }
        ],
        priceTitle: "Mulai bulanan. Beralih ke tahunan saat sudah cocok.",
        priceSub: "Paket dibedakan berdasarkan jumlah pengguna. Semua paket mencakup seluruh fitur belajar dan ruang kerja terisolasi.",
        popular: "Paling dipilih", perMonth: "/ bulan", choosePlan: "Pilih paket ini",
        priceNote: "Harga dan batas pengguna masih placeholder sampai daftar paket ditetapkan. Pada versi ini tagihan dicatat manual oleh Super Admin.",
        planItems: [
          ["Semua fitur belajar: kelas, jadwal, materi, CBT, laporan", "Ruang kerja terisolasi milik sendiri", "Backup harian"],
          ["Semua fitur belajar: kelas, jadwal, materi, CBT, laporan", "Ruang kerja terisolasi milik sendiri", "Backup harian"],
          ["Semua fitur belajar: kelas, jadwal, materi, CBT, laporan", "Ruang kerja terisolasi milik sendiri", "Cukup untuk tryout peserta banyak"]
        ],
        planUsers: "Hingga [BATAS PENGGUNA] pengguna",
        trustTitle: "Data Anda tetap milik Anda",
        trust: [
          { title: "Terisolasi per bimbel", body: "Setiap permintaan diperiksa terhadap ruang kerja Anda, sehingga bimbel lain tidak bisa membuka data Anda." },
          { title: "Akun terlindungi", body: "Kata sandi disimpan dalam bentuk hash, login melalui HTTPS, dan sesi berakhir saat logout." },
          { title: "Backup harian", body: "Basis data dan materi PDF dicadangkan sedikitnya setiap 24 jam." },
          { title: "Materi privat", body: "PDF hanya diberikan kepada pengguna yang login dan terdaftar di kelasnya." }
        ],
        faqTitle: "Pertanyaan dari pemilik bimbel",
        faq: [
          { q: "Apakah kami perlu server atau staf IT sendiri?", a: "Tidak. BIMS adalah layanan siap pakai. Anda cukup masuk lewat browser; server, pembaruan, dan backup kami yang urus." },
          { q: "Apakah bimbel lain di BIMS bisa melihat siswa kami?", a: "Tidak. Setiap bimbel bekerja di ruang kerjanya sendiri, dan setiap permintaan halaman maupun berkas diperiksa." },
          { q: "Jenis ujian apa yang didukung?", a: "Versi ini mendukung pilihan ganda dengan empat opsi dan satu jawaban benar, batas waktu dari tutor, dan satu percobaan per siswa." },
          { q: "Bagaimana jika langganan habis?", a: "Fitur belajar dijeda, tetapi data tetap tersimpan. Setelah diperpanjang, semuanya kembali seperti semula." }
        ],
        finalTitle: "Satukan jadwal, materi, dan ujian bimbel Anda di satu tempat.",
        footer: "Dibuat oleh Tim CATALYST · Telkom University"
      }
    };
    const t = D[lang];
    const IC = {
      layers: "M12 2 2 7l10 5 10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
      users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
      cal: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
      bookopen: "M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z",
      clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
      chart: "M3 3v18h18 M7 16v-5 M12 16V8 M17 16V5",
      shield: "M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z",
      building: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16 M16 9h2a2 2 0 0 1 2 2v10 M2 21h20 M8 7h4 M8 11h4 M8 15h4",
      present: "M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8",
      grad: "M22 10 12 5 2 10l10 5z M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5",
      form: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5",
      badge: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M8.5 13.9 7 22l5-3 5 3-1.5-8.1",
      rocket: "M12 3c3 1.5 5 5 5 9l-2.5 3h-5L7 12c0-4 2-7.5 5-9z M12 9.5h.01 M9.5 15 7 20l3-1.5 M14.5 15 17 20l-3-1.5"
    };
    const features = t.features.map((f, i) => Object.assign({}, f, { icon: [IC.layers, IC.users, IC.cal, IC.bookopen, IC.clock, IC.chart][i] }));
    const roles = t.roles.map((r, i) => Object.assign({}, r, { icon: [IC.shield, IC.building, IC.present, IC.grad][i] }));
    const steps = t.steps.map((s, i) => Object.assign({}, s, { icon: [IC.form, IC.badge, IC.rocket][i] }));
    const on = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:#C8102E;color:#FFFFFF;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const off = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:#1D1D1F;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const names = ["Basic", "Standard", "Pro"];
    const plans = names.map((name, i) => {
      const featured = i === 1;
      return {
        name, featured, users: t.planUsers, items: t.planItems[i],
        card: featured
          ? "background:#C8102E;color:#FFFFFF;border-radius:20px;padding:28px;display:flex;flex-direction:column;gap:16px"
          : "background:#FFFFFF;color:#1D1D1F;border:1px solid #E6E6EA;border-radius:20px;padding:28px;display:flex;flex-direction:column;gap:16px",
        btn: featured
          ? "margin-top:auto;display:flex;align-items:center;justify-content:center;height:48px;border-radius:12px;background:#E3B53B;color:#1D1D1F;text-decoration:none;font-weight:800;font-size:15px"
          : "margin-top:auto;display:flex;align-items:center;justify-content:center;height:48px;border-radius:12px;border:1.5px solid #1D1D1F;color:#1D1D1F;text-decoration:none;font-weight:700;font-size:15px"
      };
    });
    const who = lang === "en" ? "Tutor" : "Tutor";
    const mockSchedule = [
      { time: "13:00–14:30", subject: lang === "en" ? "Mathematics · Class 12 IPA" : "Matematika · Kelas 12 IPA", who: who + ": Rina S." },
      { time: "14:30–16:00", subject: lang === "en" ? "Physics · Class 12 IPA" : "Fisika · Kelas 12 IPA", who: who + ": Dimas P." },
      { time: "16:00–17:30", subject: lang === "en" ? "English · Class 9 SMP" : "Bahasa Inggris · Kelas 9 SMP", who: who + ": Ayu L." }
    ];
    return {
      t, plans, mockSchedule, features, roles, steps,
      isEn: lang === "en", isId: lang === "id",
      enBtn: lang === "en" ? on : off, idBtn: lang === "id" ? on : off,
      setEn: () => this.setState({ lang: "en" }), setId: () => this.setState({ lang: "id" })
    };
  }
}
return Component;
})();
SCREENS["Register"] = (function () {
class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const lang = st.lang || this.props.lang || "en";
    const plan = st.plan || "Standard";
    const done = !!st.done;
    const isSubmitting = !!st.isSubmitting;
    const alertMsg = st.alertMsg || "";
    const alertType = st.alertType || "error";
    const D = {
      en: {
        login: "Log in", stepsAria: "Registration steps", steps: ["Fill in details", "Waiting for approval", "Workspace active"],
        title: "Register your bimbel", secBimbel: "Bimbel details", fName: "Bimbel name", fCity: "City", fPhone: "WhatsApp number", fWs: "Workspace address", wsOk: "Address available",
        secAdmin: "Admin Bimbel account", fAdminName: "Full name", fPass: "Password", passHint: "At least 8 characters.",
        secPlan: "Plan", perMonth: "/ month", upTo: "Up to [USER LIMIT] users", planNote: "Monthly billing. All plans include every learning feature; they differ only in the user limit.",
        consent: "I agree that student data, scores and materials are used only for learning by authorised people in my bimbel.",
        submitBtn: "Submit registration",
        nextTitle: "What happens next", next: ["Your registration is saved with status Pending.", "The BIMS Super Admin reviews it and approves or rejects it.", "Once approved, you get an email and can log in to set up classes."],
        statusPending: "Status: Pending", doneTitle: "Registration received", doneBody: "Your workspace is not active yet. We will email you as soon as the Super Admin approves it. Until then, logging in shows a review notice.",
        backHome: "Back to home", editAgain: "Change details"
      },
      id: {
        login: "Masuk", stepsAria: "Tahap pendaftaran", steps: ["Isi data", "Menunggu persetujuan", "Ruang kerja aktif"],
        title: "Daftarkan bimbel Anda", secBimbel: "Data bimbel", fName: "Nama bimbel", fCity: "Kota", fPhone: "Nomor WhatsApp", fWs: "Alamat ruang kerja", wsOk: "Alamat tersedia",
        secAdmin: "Akun Admin Bimbel", fAdminName: "Nama lengkap", fPass: "Kata sandi", passHint: "Minimal 8 karakter.",
        secPlan: "Paket", perMonth: "/ bulan", upTo: "Hingga [BATAS PENGGUNA] pengguna", planNote: "Tagihan bulanan. Semua paket berisi seluruh fitur belajar; yang berbeda hanya batas pengguna.",
        consent: "Saya setuju data siswa, nilai, dan materi hanya digunakan untuk pembelajaran oleh pihak berwenang di bimbel saya.",
        submitBtn: "Kirim pendaftaran",
        nextTitle: "Langkah berikutnya", next: ["Pendaftaran tersimpan dengan status Menunggu.", "Super Admin BIMS memeriksa lalu menyetujui atau menolak.", "Setelah disetujui, Anda menerima email dan bisa login untuk mengatur kelas."],
        statusPending: "Status: Menunggu", doneTitle: "Pendaftaran diterima", doneBody: "Ruang kerja Anda belum aktif. Kami akan mengirim email begitu Super Admin menyetujuinya. Sebelum itu, login akan menampilkan pemberitahuan peninjauan.",
        backHome: "Kembali ke beranda", editAgain: "Ubah data"
      }
    };
    const t = D[lang];
    const cur = done ? 1 : 0;
    const steps = t.steps.map((text, i) => ({
      n: String(i + 1), text,
      dot: "width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center;font:700 13px 'IBM Plex Mono',monospace;" + (i < cur ? "background:#C8102E;color:#FFFFFF" : i === cur ? "background:#C8102E;color:#FFFFFF" : "background:#ECECF0;color:#4A4A55"),
      label: i === cur ? "font-weight:800" : "font-weight:500;color:#5F6368"
    }));
    const plans = ["Basic", "Standard", "Pro"].map((name) => ({
      name, sel: plan === name, pick: () => this.setState({ plan: name }),
      style: "display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:16px;border-radius:14px;cursor:pointer;text-align:left;font-family:'Plus Jakarta Sans',sans-serif;color:#1D1D1F;" + (plan === name ? "border:2px solid #C8102E;background:#FDECEE" : "border:1.5px solid #D6D6DC;background:#FFFFFF")
    }));
    const on = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:#C8102E;color:#FFFFFF;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const off = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:#1D1D1F;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";

    const alertStyle = alertType === "error"
      ? "padding: 12px 16px; border-radius: 12px; background: #FDECEE; border: 1px solid #F6B4BC; color: #9B0D23; font-size: 14px; font-weight: 600; line-height: 1.5;"
      : "padding: 12px 16px; border-radius: 12px; background: #E6F4EA; border: 1px solid #CEEAD6; color: #137333; font-size: 14px; font-weight: 600; line-height: 1.5;";

    const submit = async () => {
      const bn = document.getElementById("bn") ? document.getElementById("bn").value.trim() : "";
      const ct = document.getElementById("ct") ? document.getElementById("ct").value.trim() : "";
      const wa = document.getElementById("wa") ? document.getElementById("wa").value.trim() : "";
      const sd = document.getElementById("sd") ? document.getElementById("sd").value.trim() : "";
      const an = document.getElementById("an") ? document.getElementById("an").value.trim() : "";
      const ae = document.getElementById("ae") ? document.getElementById("ae").value.trim() : "";
      const ap = document.getElementById("ap") ? document.getElementById("ap").value : "";

      if (!ae || !ap) {
        this.setState({
          alertMsg: lang === "id" ? "Mohon lengkapi email dan kata sandi." : "Please fill in email and password.",
          alertType: "error"
        });
        return;
      }
      if (ap.length < 6) {
        this.setState({
          alertMsg: lang === "id" ? "Kata sandi minimal 6 karakter." : "Password must be at least 6 characters.",
          alertType: "error"
        });
        return;
      }

      this.setState({ isSubmitting: true, alertMsg: "" });

      try {
        if (window.BIMS_AUTH) {
          await window.BIMS_AUTH.signUp(ae, ap, {
            bimbel_name: bn,
            city: ct,
            phone: wa,
            workspace: sd,
            full_name: an,
            plan: plan,
            role: "admin_bimbel"
          });
        }
        this.setState({
          done: true,
          isSubmitting: false,
          doneBimbelName: bn || "Bimbel Pelita Nusantara",
          doneEmail: ae,
          doneWs: sd || "pelita-nusantara",
          alertMsg: ""
        });
      } catch (err) {
        console.error("Registrasi error:", err);
        this.setState({
          isSubmitting: false,
          alertMsg: (lang === "id" ? "Pendaftaran gagal: " : "Registration failed: ") + (err.message || err),
          alertType: "error"
        });
      }
    };

    return {
      t, steps, plans, chosen: plan + " · " + (lang === "en" ? "Monthly" : "Bulanan"),
      editing: !done, done,
      hasAlert: !!alertMsg, alertMsg, alertStyle,
      submitBtnText: isSubmitting ? (lang === "id" ? "Mendaftarkan ke Supabase..." : "Registering...") : t.submitBtn,
      doneBimbelName: st.doneBimbelName || "Bimbel Pelita Nusantara",
      doneEmail: st.doneEmail || "hendra@pelita.id",
      doneWs: st.doneWs || "pelita-nusantara",
      submit, edit: () => this.setState({ done: false }),
      isEn: lang === "en", isId: lang === "id",
      enBtn: lang === "en" ? on : off, idBtn: lang === "id" ? on : off,
      setEn: () => this.setState({ lang: "en" }), setId: () => this.setState({ lang: "id" })
    };
  }
}
return Component;
})();
SCREENS["WorkspaceStatus"] = (function () {
class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const lang = st.lang || this.props.lang || "en";
    const s = st.s || this.props.state || "expired";
    const D = {
      en: {
        logout: "Log out", statesAria: "Workspace states", prototype: "Prototype state",
        tabs: { pending: "Pending", expired: "Expired", rejected: "Rejected", denied: "Access denied" },
        contact: "Contact BIMS support", renewTitle: "Renewal information", plan: "Plan", perMonth: "/ month", ended: "Ended on", billing: "Billing", unpaid: "Due",
        renewHow: "Transfer the monthly fee using the payment details in your invoice email. The Super Admin records it and your workspace reopens straight away.",
        states: {
          pending: { status: "Pending", title: "Your registration is being reviewed", body: "Bimbel Pelita Nusantara was registered on 12 Oct 2026. The workspace switches on once the BIMS Super Admin approves it, and we will email you.", cta: "Back to home", href: "Main.dc.html", foot: "No classes, materials or users can be created yet." },
          expired: { status: "Subscription ended", title: "Learning features are paused", body: "Your bimbel's subscription has ended. All your data is kept safe. Admin Bimbel can still open the profile and renewal information. Tutors and students see a notice asking them to contact the admin.", cta: "Open subscription", href: "#", foot: "Everything returns exactly as it was after renewal." },
          rejected: { status: "Rejected", title: "Registration was not approved", body: "Reason from the Super Admin: the workspace address and the bimbel name did not match the supporting details. You can register again with corrected details.", cta: "Register again", href: "Register.dc.html", foot: "No data was created for this registration." },
          denied: { status: "403", title: "You don't have access to this page", body: "This page belongs to another bimbel or to a role you don't have. Nothing was shown or changed. If you think this is a mistake, ask your Admin Bimbel.", cta: "Back to my home", href: "StudentHome.dc.html", foot: "This attempt is recorded in the access log." }
        }
      },
      id: {
        logout: "Keluar", statesAria: "Status ruang kerja", prototype: "Status prototipe",
        tabs: { pending: "Menunggu", expired: "Kedaluwarsa", rejected: "Ditolak", denied: "Akses ditolak" },
        contact: "Hubungi tim BIMS", renewTitle: "Informasi perpanjangan", plan: "Paket", perMonth: "/ bulan", ended: "Berakhir pada", billing: "Tagihan", unpaid: "Jatuh tempo",
        renewHow: "Transfer biaya bulanan sesuai rincian pembayaran di email tagihan. Super Admin mencatatnya dan ruang kerja langsung dibuka kembali.",
        states: {
          pending: { status: "Menunggu", title: "Pendaftaran sedang ditinjau", body: "Bimbel Pelita Nusantara terdaftar pada 12 Okt 2026. Ruang kerja aktif setelah Super Admin BIMS menyetujuinya, dan kami akan mengirim email.", cta: "Kembali ke beranda", href: "Main.dc.html", foot: "Belum bisa membuat kelas, materi, atau pengguna." },
          expired: { status: "Langganan berakhir", title: "Fitur belajar sedang dijeda", body: "Langganan bimbel Anda sudah berakhir. Semua data tetap tersimpan aman. Admin Bimbel masih bisa membuka profil dan informasi perpanjangan. Tutor dan siswa melihat pemberitahuan untuk menghubungi admin.", cta: "Buka langganan", href: "#", foot: "Semua kembali seperti semula setelah diperpanjang." },
          rejected: { status: "Ditolak", title: "Pendaftaran tidak disetujui", body: "Alasan dari Super Admin: alamat ruang kerja dan nama bimbel tidak sesuai dengan data pendukung. Anda dapat mendaftar ulang dengan data yang diperbaiki.", cta: "Daftar ulang", href: "Register.dc.html", foot: "Tidak ada data yang dibuat dari pendaftaran ini." },
          denied: { status: "403", title: "Anda tidak memiliki akses ke halaman ini", body: "Halaman ini milik bimbel lain atau peran yang bukan milik Anda. Tidak ada data yang ditampilkan atau diubah. Jika ini keliru, hubungi Admin Bimbel Anda.", cta: "Kembali ke beranda saya", href: "StudentHome.dc.html", foot: "Percobaan ini tercatat di log akses." }
        }
      }
    };
    const t = D[lang];
    const b = (bg, fg) => "font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;background:" + bg + ";color:" + fg;
    const badges = { pending: b("#FCEFC9", "#6B4A00"), expired: b("#FDE7E5", "#8A1C12"), rejected: b("#FDE7E5", "#8A1C12"), denied: b("#F1F1F4", "#1D1D1F") };
    const CIRC = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z";
    const icons = {
      pending: "M6 2h12 M6 22h12 M7 2v4a5 5 0 0 0 10 0V2 M7 22v-4a5 5 0 0 1 10 0v4",
      expired: CIRC + " M10 9v6 M14 9v6",
      rejected: CIRC + " M15 9l-6 6 M9 9l6 6",
      denied: "M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4"
    };
    const wraps = { pending: ["#FCEFC9", "#6B4A00"], expired: ["#FDE7E5", "#8A1C12"], rejected: ["#FDE7E5", "#8A1C12"], denied: ["#F1F1F4", "#1D1D1F"] };
    const cur = Object.assign({}, t.states[s], {
      badge: badges[s], icon: icons[s],
      iconWrap: "width:64px;height:64px;border-radius:18px;display:flex;align-items:center;justify-content:center;background:" + wraps[s][0] + ";color:" + wraps[s][1]
    });
    const tabs = ["pending", "expired", "rejected", "denied"].map((k) => ({
      label: t.tabs[k], sel: s === k, go: () => this.setState({ s: k }),
      style: "height:44px;padding:0 16px;border-radius:999px;font:700 14px 'Plus Jakarta Sans',sans-serif;cursor:pointer;" + (s === k ? "background:#C8102E;color:#FFFFFF;border:1.5px solid #C8102E" : "background:#FFFFFF;color:#1D1D1F;border:1.5px solid #C7C7CF")
    }));
    const on = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:#C8102E;color:#FFFFFF;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const off = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:#1D1D1F;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    return {
      t, cur, tabs, isExpired: s === "expired",
      isEn: lang === "en", isId: lang === "id",
      enBtn: lang === "en" ? on : off, idBtn: lang === "id" ? on : off,
      setEn: () => this.setState({ lang: "en" }), setId: () => this.setState({ lang: "id" })
    };
  }
}
return Component;
})();
SCREENS["Login"] = (function () {
class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const lang = st.lang || this.props.lang || "en";
    const isSubmitting = !!st.isSubmitting;
    const alertMsg = st.alertMsg || "";
    const alertType = st.alertType || "error";
    const D = {
      en: {
        sideTitle: "Welcome back to your classroom.", sideSub: "Admins, tutors and students all sign in here. You will land on the view for your role.",
        previewAs: "Prototype · preview as", student: "Student",
        title: "Log in", sub: "Use the account your bimbel admin created for you.",
        wsLabel: "Bimbel workspace", wsHint: "Ask your admin if you are not sure.",
        email: "Email", password: "Password", forgot: "Forgot password?", submit: "Log in",
        secure: "Your connection is encrypted and your session ends when you log out.",
        noAccount: "Running a bimbel?", registerLink: "Register it on BIMS"
      },
      id: {
        sideTitle: "Selamat datang kembali di ruang kelas Anda.", sideSub: "Admin, tutor, dan siswa masuk dari sini. Anda akan langsung diarahkan ke tampilan sesuai peran.",
        previewAs: "Prototipe · lihat sebagai", student: "Siswa",
        title: "Masuk", sub: "Gunakan akun yang dibuat oleh admin bimbel Anda.",
        wsLabel: "Ruang kerja bimbel", wsHint: "Tanyakan ke admin jika belum tahu.",
        email: "Email", password: "Kata sandi", forgot: "Lupa kata sandi?", submit: "Masuk",
        secure: "Koneksi Anda terenkripsi dan sesi berakhir saat Anda keluar.",
        noAccount: "Mengelola bimbel?", registerLink: "Daftarkan di BIMS"
      }
    };
    const t = D[lang];
    const on = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:#C8102E;color:#FFFFFF;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const off = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:#1D1D1F;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";

    const alertStyle = alertType === "error"
      ? "padding: 12px 16px; border-radius: 12px; background: #FDECEE; border: 1px solid #F6B4BC; color: #9B0D23; font-size: 14px; font-weight: 600; line-height: 1.5;"
      : "padding: 12px 16px; border-radius: 12px; background: #E6F4EA; border: 1px solid #CEEAD6; color: #137333; font-size: 14px; font-weight: 600; line-height: 1.5;";

    const handleLogin = async () => {
      const emEl = document.getElementById("em");
      const pwEl = document.getElementById("pw");
      const em = emEl ? emEl.value.trim() : "";
      const pw = pwEl ? pwEl.value : "";

      if (!em || !pw) {
        this.setState({
          alertMsg: lang === "id" ? "Masukkan email dan kata sandi." : "Please enter email and password.",
          alertType: "error"
        });
        return;
      }

      this.setState({ isSubmitting: true, alertMsg: "" });

      try {
        if (window.BIMS_AUTH) {
          const data = await window.BIMS_AUTH.signIn(em, pw);
          const user = (data && data.user) || window.BIMS_AUTH.currentUser;
          const role = (user && user.user_metadata && user.user_metadata.role) || "student";

          if (role === "super_admin") {
            go("SuperAdmin");
          } else if (role === "admin_bimbel") {
            go("AdminDashboard");
          } else if (role === "tutor") {
            go("TutorClass");
          } else {
            go("StudentHome");
          }
        } else {
          go("StudentHome");
        }
      } catch (err) {
        console.error("Login error:", err);
        let msg = err.message || "Gagal masuk.";
        if (msg.includes("Invalid login credentials")) {
          msg = lang === "id" ? "Email atau kata sandi tidak cocok." : "Invalid email or password.";
        }
        this.setState({
          isSubmitting: false,
          alertMsg: msg,
          alertType: "error"
        });
      }
    };

    return {
      t, isEn: lang === "en", isId: lang === "id",
      hasAlert: !!alertMsg, alertMsg, alertStyle,
      submitText: isSubmitting ? (lang === "id" ? "Memeriksa akun..." : "Checking account...") : t.submit,
      handleLogin,
      enBtn: lang === "en" ? on : off, idBtn: lang === "id" ? on : off,
      setEn: () => this.setState({ lang: "en" }), setId: () => this.setState({ lang: "id" })
    };
  }
}
return Component;
})();
SCREENS["SuperAdmin"] = (function () {
class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const lang = st.lang || this.props.lang || "en";
    const decided = st.decided || {};
    const D = {
      en: {
        logout: "Log out", title: "Service overview", updated: "Indicators refresh every 60 seconds", allOk: "All services running",
        kpis: [
          { label: "Active bimbel", value: "24", note: "3 waiting for approval" },
          { label: "Users", value: "3,182", note: "Across all bimbel" },
          { label: "App errors (24h)", value: "2", note: "Both resolved" },
          { label: "Service status", value: "Up", note: "API · database · file storage" }
        ],
        pendingTitle: "Registrations waiting for approval", pendingHint: "A workspace only switches on after you approve it.",
        approve: "Approve", reject: "Reject", undo: "Undo",
        sPending: "Pending", sActive: "Active", sRejected: "Rejected",
        tenantsTitle: "Plans & billing", colPlan: "Plan", colUsers: "Users / limit", colPeriod: "Start – end", colBilling: "Billing", colAction: "Action", perMonth: "/ mo",
        paid: "Paid", due: "Due", expired: "Expired", stExpired: "Expired", stInactive: "Inactive", recordPay: "Record payment", renew: "Renew", details: "Details", reactivate: "Reactivate",
        backupTitle: "Backups",
        backups: [
          { label: "Last database + PDF backup", value: "Today, 02:00 WIB" },
          { label: "Schedule", value: "Every 24 hours" },
          { label: "Last restore test", value: "Passed · 1 h 12 min" }
        ],
        runBackup: "Run backup now",
        privacy: "Student answers and passwords are never shown here. Opening a bimbel's content needs approval and is logged.",
        nav: ["Overview", "Bimbel registrations", "Plans & billing", "Service health", "Backups"]
      },
      id: {
        logout: "Keluar", title: "Ringkasan layanan", updated: "Indikator diperbarui setiap 60 detik", allOk: "Semua layanan berjalan",
        kpis: [
          { label: "Bimbel aktif", value: "24", note: "3 menunggu persetujuan" },
          { label: "Pengguna", value: "3.182", note: "Dari seluruh bimbel" },
          { label: "Error aplikasi (24 jam)", value: "2", note: "Keduanya sudah selesai" },
          { label: "Status layanan", value: "Aktif", note: "API · basis data · penyimpanan berkas" }
        ],
        pendingTitle: "Pendaftaran menunggu persetujuan", pendingHint: "Ruang kerja baru aktif setelah Anda setujui.",
        approve: "Setujui", reject: "Tolak", undo: "Batalkan",
        sPending: "Menunggu", sActive: "Aktif", sRejected: "Ditolak",
        tenantsTitle: "Paket & tagihan", colPlan: "Paket", colUsers: "Pengguna / batas", colPeriod: "Mulai – berakhir", colBilling: "Tagihan", colAction: "Tindakan", perMonth: "/ bln",
        paid: "Lunas", due: "Jatuh tempo", expired: "Kedaluwarsa", stExpired: "Kedaluwarsa", stInactive: "Nonaktif", recordPay: "Catat pembayaran", renew: "Perpanjang", details: "Detail", reactivate: "Aktifkan lagi",
        backupTitle: "Backup",
        backups: [
          { label: "Backup basis data + PDF terakhir", value: "Hari ini, 02.00 WIB" },
          { label: "Jadwal", value: "Setiap 24 jam" },
          { label: "Uji pemulihan terakhir", value: "Berhasil · 1 j 12 mnt" }
        ],
        runBackup: "Jalankan backup sekarang",
        privacy: "Jawaban siswa dan kata sandi tidak pernah ditampilkan di sini. Membuka isi data bimbel memerlukan persetujuan dan tercatat.",
        nav: ["Ringkasan", "Pendaftaran bimbel", "Paket & tagihan", "Kondisi layanan", "Backup"]
      }
    };
    const t = D[lang];
    const IC = {
      grid: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
      clip: "M9 3h6a1 1 0 0 1 1 1v2H8V4a1 1 0 0 1 1-1z M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2 M9 14l2 2 4-4",
      card: "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20 M6 15h4",
      activity: "M22 12h-4l-3 9L9 3l-3 9H2",
      db: "M4 6c0 1.7 3.6 3 8 3s8-1.3 8-3-3.6-3-8-3-8 1.3-8 3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
      building: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16 M16 9h2a2 2 0 0 1 2 2v10 M2 21h20 M8 7h4 M8 11h4 M8 15h4",
      users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
      alert: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01",
      server: "M4 3h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M4 13h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z M7 7h.01 M7 17h.01"
    };
    const NAVI = [IC.grid, IC.clip, IC.card, IC.activity, IC.db];
    t.kpis.forEach((k, i) => { k.icon = [IC.building, IC.users, IC.alert, IC.server][i]; });
    const badge = (bg, fg) => "flex:none;font-size:12px;font-weight:700;padding:6px 10px;border-radius:999px;background:" + bg + ";color:" + fg;
    const raw = [
      { id: "a", name: "Bimbel Pelita Nusantara", city: "Balikpapan", owner: "Hendra W.", plan: "Standard", date: "12 Oct 2026" },
      { id: "b", name: "Rumah Belajar Sinar", city: "Makassar", owner: "Nur A.", plan: "Basic", date: "13 Oct 2026" },
      { id: "c", name: "Prima Edukasi", city: "Bandung", owner: "Yosef K.", plan: "Pro", date: "14 Oct 2026" }
    ];
    const pending = raw.map((p) => {
      const s = decided[p.id] || "pending";
      const set = (v) => () => this.setState({ decided: Object.assign({}, decided, { [p.id]: v }) });
      return Object.assign({}, p, {
        isPending: s === "pending", isDone: s !== "pending",
        statusLabel: s === "pending" ? t.sPending : s === "active" ? t.sActive : t.sRejected,
        badge: s === "pending" ? badge("#FCEFC9", "#6B4A00") : s === "active" ? badge("#E6F4EA", "#1E6B3A") : badge("#FDE7E5", "#8A1C12"),
        approve: set("active"), reject: set("rejected"), undo: set("pending")
      });
    });
    const good = badge("#E6F4EA", "#1E6B3A"), warn = badge("#FCEFC9", "#6B4A00"), bad = badge("#FDE7E5", "#8A1C12"), grey = badge("#F2F2F5", "#4A4A55");
    const tenants = [
      { name: "Bimbel Cahaya Ilmu", plan: "Standard", users: "142 / 200", period: "01 Nov – 30 Nov 2026", status: t.sActive, sBadge: good, billing: t.paid, badge: good, action: t.details },
      { name: "Bimbel Mitra Prestasi", plan: "Basic", users: "58 / 100", period: "16 Oct – 15 Nov 2026", status: t.sActive, sBadge: good, billing: t.paid, badge: good, action: t.details },
      { name: "Smart Kids Course", plan: "Pro", users: "311 / 500", period: "21 Sep – 20 Oct 2026", status: t.sActive, sBadge: good, billing: t.due, badge: warn, action: t.recordPay },
      { name: "LBB Tunas Mandiri", plan: "Basic", users: "37 / 100", period: "11 Sep – 10 Oct 2026", status: t.stExpired, sBadge: bad, billing: t.expired, badge: bad, action: t.renew },
      { name: "Akademi Bintang", plan: "Standard", users: "96 / 200", period: "06 Aug – 05 Sep 2026", status: t.stInactive, sBadge: grey, billing: t.expired, badge: bad, action: t.reactivate }
    ];
    const nav = t.nav.map((label, i) => ({ icon: NAVI[i],
      label,
      style: i === 0
        ? "display:flex;align-items:center;gap:12px;min-height:44px;padding:0 14px;border-radius:10px;background:#FDECEE;color:#9E0B22;text-decoration:none;font-weight:700;font-size:15px"
        : "display:flex;align-items:center;gap:12px;min-height:44px;padding:0 14px;border-radius:10px;color:#1D1D1F;text-decoration:none;font-weight:500;font-size:15px"
    }));
    const on = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:#FFFFFF;color:#1D1D1F;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const off = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:#FFFFFF;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    return {
      t, pending, tenants, nav, isEn: lang === "en", isId: lang === "id",
      enBtn: lang === "en" ? on : off, idBtn: lang === "id" ? on : off,
      setEn: () => this.setState({ lang: "en" }), setId: () => this.setState({ lang: "id" })
    };
  }
}
return Component;
})();
SCREENS["AdminDashboard"] = (function () {
class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const lang = st.lang || this.props.lang || "en";
    const mode = st.mode || "idle";
    const D = {
      en: {
        logout: "Log out", planLine: "Standard plan · Monthly", planUntil: "Active until 30 Nov 2026", usersAria: "142 of 200 users used",
        title: "Dashboard",
        kpis: [{ label: "Students", value: "128" }, { label: "Tutors", value: "14" }, { label: "Classes", value: "9" }, { label: "Avg. CBT score (Oct)", value: "78" }],
        weekTitle: "This week's schedule", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        addTitle: "Add a session", fClass: "Class", fDay: "Day", fStart: "Start", fEnd: "End", mon: "Mon", cls12: "Class 12 IPA",
        clashTitle: "This overlaps another session", clashBody: "Rina S. already teaches Class 12 IPA on Monday 13:00–14:30. Sessions can start exactly when the previous one ends.",
        clashFix: "Start at 14:30 instead", saved: "Session saved for Monday 14:30–16:00.", saveBtn: "Save session",
        perfTitle: "Performance by class", export: "Export CSV", fExam: "Exam", fPeriod: "Period", allClasses: "All classes", allExams: "All exams", thisMonth: "October 2026",
        colClass: "Class", colStudents: "Students", colExams: "Exams", colAvg: "Avg. score",
        nav: ["Dashboard", "Students & tutors", "Subjects", "Classes", "Schedule", "Reports", "Subscription"],
        subj: { mat: "Mathematics", fis: "Physics", eng: "English", kim: "Chemistry", bio: "Biology" }
      },
      id: {
        logout: "Keluar", planLine: "Paket Standard · Bulanan", planUntil: "Aktif sampai 30 Nov 2026", usersAria: "142 dari 200 pengguna terpakai",
        title: "Dasbor",
        kpis: [{ label: "Siswa", value: "128" }, { label: "Tutor", value: "14" }, { label: "Kelas", value: "9" }, { label: "Rata-rata nilai CBT (Okt)", value: "78" }],
        weekTitle: "Jadwal minggu ini", days: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
        addTitle: "Tambah sesi", fClass: "Kelas", fDay: "Hari", fStart: "Mulai", fEnd: "Selesai", mon: "Sen", cls12: "Kelas 12 IPA",
        clashTitle: "Bentrok dengan sesi lain", clashBody: "Rina S. sudah mengajar Kelas 12 IPA hari Senin 13.00–14.30. Sesi boleh dimulai tepat saat sesi sebelumnya selesai.",
        clashFix: "Mulai pukul 14.30", saved: "Sesi tersimpan untuk Senin 14.30–16.00.", saveBtn: "Simpan sesi",
        perfTitle: "Performa per kelas", export: "Ekspor CSV", fExam: "Ujian", fPeriod: "Periode", allClasses: "Semua kelas", allExams: "Semua ujian", thisMonth: "Oktober 2026",
        colClass: "Kelas", colStudents: "Siswa", colExams: "Ujian", colAvg: "Rata-rata nilai",
        nav: ["Dasbor", "Siswa & tutor", "Mata pelajaran", "Kelas", "Jadwal", "Laporan", "Langganan"],
        subj: { mat: "Matematika", fis: "Fisika", eng: "Bahasa Inggris", kim: "Kimia", bio: "Biologi" }
      }
    };
    const t = D[lang];
    const IC = {
      grid: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
      users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
      book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
      present: "M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8",
      cal: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
      chart: "M3 3v18h18 M7 16v-5 M12 16V8 M17 16V5",
      card: "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20 M6 15h4",
      grad: "M22 10 12 5 2 10l10 5z M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5",
      layers: "M12 2 2 7l10 5 10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
      trend: "M3 17l6-6 4 4 8-8 M14 7h7v7"
    };
    const NAVI = [IC.grid, IC.users, IC.book, IC.present, IC.cal, IC.chart, IC.card];
    t.kpis.forEach((k, i) => { k.icon = [IC.grad, IC.present, IC.layers, IC.trend][i]; });
    const S = t.subj;
    const tone = {
      g: "display:flex;flex-direction:column;gap:2px;padding:10px;border-radius:10px;background:#FDECEE;color:#7A0A1C",
      y: "display:flex;flex-direction:column;gap:2px;padding:10px;border-radius:10px;background:#FCEFC9;color:#4A3A12",
      n: "display:flex;flex-direction:column;gap:2px;padding:10px;border-radius:10px;background:#F1F1F4;color:#1D1D1F"
    };
    const mk = (time, subject, tutor, c) => ({ time, subject, tutor, style: tone[c] });
    const fixed = mode === "saved";
    const days = [
      [mk("13:00–14:30", S.mat + " · 12 IPA", "Rina S.", "g"), mk("16:00–17:30", S.eng + " · 9 SMP", "Ayu L.", "n")].concat(fixed ? [mk("14:30–16:00", S.mat + " · 12 IPA", "Rina S.", "g")] : []),
      [mk("14:30–16:00", S.fis + " · 12 IPA", "Dimas P.", "y")],
      [mk("13:00–14:30", S.kim + " · 11 IPA", "Fajar R.", "n"), mk("15:00–16:30", S.mat + " · 9 SMP", "Rina S.", "g")],
      [mk("14:30–16:00", S.bio + " · 12 IPA", "Sari M.", "y")],
      [mk("13:00–14:30", S.eng + " · 12 IPA", "Ayu L.", "n")],
      [mk("08:00–10:00", "Tryout · 12 IPA", "Rina S.", "g")]
    ];
    const week = t.days.map((day, i) => ({ day, items: days[i] }));
    const perfRaw = [
      ["12 IPA", "Rina S.", 32, 4, 81], ["11 IPA", "Fajar R.", 28, 3, 74], ["9 SMP", "Ayu L.", 30, 3, 79], ["8 SMP", "Dimas P.", 24, 2, 71]
    ];
    const perf = perfRaw.map((r) => ({
      cls: (lang === "en" ? "Class " : "Kelas ") + r[0], tutor: r[1], students: String(r[2]), exams: String(r[3]), avg: String(r[4]),
      bar: "width:" + r[4] + "%;height:100%;background:#C8102E"
    }));
    const navHref = ["AdminDashboard.dc.html", "AdminClasses.dc.html", "AdminClasses.dc.html", "AdminClasses.dc.html", "#week-h", "#perf-h", "WorkspaceStatus.dc.html"];
    const nav = t.nav.map((label, i) => ({ icon: NAVI[i],
      label, href: navHref[i],
      style: i === 0
        ? "display:flex;align-items:center;gap:12px;min-height:44px;padding:0 14px;border-radius:10px;background:#FDECEE;color:#9E0B22;text-decoration:none;font-weight:700;font-size:15px"
        : "display:flex;align-items:center;gap:12px;min-height:44px;padding:0 14px;border-radius:10px;color:#1D1D1F;text-decoration:none;font-weight:500;font-size:15px"
    }));
    const clashInput = "height:44px;box-sizing:border-box;border:2px solid #B42318;border-radius:10px;padding:0 10px;font:500 14px 'IBM Plex Mono',monospace;color:#1D1D1F;width:100%;background:#FFF7F6";
    const okInput = "height:44px;box-sizing:border-box;border:1.5px solid #C7C7CF;border-radius:10px;padding:0 10px;font:500 14px 'IBM Plex Mono',monospace;color:#1D1D1F;width:100%";
    const fixedTime = mode === "fixed" || mode === "saved";
    const on = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:#C8102E;color:#FFFFFF;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const off = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:#1D1D1F;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    return {
      t, week, perf, nav,
      startVal: fixedTime ? "14:30" : "13:30", endVal: fixedTime ? "16:00" : "15:00",
      startStyle: mode === "clash" ? clashInput : okInput,
      showClash: mode === "clash", showSaved: mode === "saved",
      save: () => this.setState({ mode: fixedTime ? "saved" : "clash" }),
      fix: () => this.setState({ mode: "fixed" }),
      isEn: lang === "en", isId: lang === "id",
      enBtn: lang === "en" ? on : off, idBtn: lang === "id" ? on : off,
      setEn: () => this.setState({ lang: "en" }), setId: () => this.setState({ lang: "id" })
    };
  }
}
return Component;
})();
SCREENS["AdminClasses"] = (function () {
class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const lang = st.lang || this.props.lang || "en";
    const sel = st.sel || 0;
    const inactive = st.inactive || { 4: true };
    const picked = st.picked || { 0: true, 1: true };
    const added = st.added || 0;
    const D = {
      en: {
        logout: "Log out", classes: "Classes", newClass: "New class", className: "Class name", subject: "Subject", math: "Mathematics", cls12: "Class 12 IPA", save: "Save",
        tutors: "Assigned tutors", removeTutor: "Remove Rina S. from this class", addTutor: "Add tutor", tutorRule: "At least one tutor is required.",
        members: "Students in this class", addStudents: "Add students", search: "Search students in Bimbel Cahaya Ilmu", searchPh: "Name or email",
        sameTenant: "Only students from your own bimbel appear here.", add: "Add", selected: "selected",
        colName: "Name", colAction: "Action", active: "Active", inactiveL: "Inactive", deactivate: "Deactivate", activate: "Reactivate",
        moreRows: "Showing 6 of the class list · sorted by name",
        deactNote: "Students with exam results cannot be deleted. Deactivating keeps their scores in reports and stops them from logging in.",
        nav: ["Dashboard", "Students & tutors", "Subjects", "Classes", "Schedule", "Reports", "Subscription"],
        notIn: "not in a class", inOther: "also in Class 11 IPA", students: "students"
      },
      id: {
        logout: "Keluar", classes: "Kelas", newClass: "Kelas baru", className: "Nama kelas", subject: "Mata pelajaran", math: "Matematika", cls12: "Kelas 12 IPA", save: "Simpan",
        tutors: "Tutor pengampu", removeTutor: "Hapus Rina S. dari kelas ini", addTutor: "Tambah tutor", tutorRule: "Minimal satu tutor wajib dipilih.",
        members: "Siswa di kelas ini", addStudents: "Tambah siswa", search: "Cari siswa di Bimbel Cahaya Ilmu", searchPh: "Nama atau email",
        sameTenant: "Hanya siswa dari bimbel Anda sendiri yang muncul di sini.", add: "Tambahkan", selected: "dipilih",
        colName: "Nama", colAction: "Tindakan", active: "Aktif", inactiveL: "Nonaktif", deactivate: "Nonaktifkan", activate: "Aktifkan lagi",
        moreRows: "Menampilkan 6 dari daftar kelas · urut nama",
        deactNote: "Siswa yang sudah memiliki nilai tidak dapat dihapus. Menonaktifkan akun menjaga nilainya di laporan dan mencegahnya login.",
        nav: ["Dasbor", "Siswa & tutor", "Mata pelajaran", "Kelas", "Jadwal", "Laporan", "Langganan"],
        notIn: "belum punya kelas", inOther: "juga di Kelas 11 IPA", students: "siswa"
      }
    };
    const t = D[lang];
    const NAVI = [
      "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
      "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
      "M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8",
      "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
      "M3 3v18h18 M7 16v-5 M12 16V8 M17 16V5",
      "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20 M6 15h4"
    ];
    const base = [["12 IPA", "Rina S.", 32], ["11 IPA", "Fajar R.", 28], ["9 SMP", "Ayu L.", 30], ["8 SMP", "Dimas P.", 24]];
    const classList = base.map((c, i) => ({
      name: (lang === "en" ? "Class " : "Kelas ") + c[0], meta: c[1] + " · " + (c[2] + (i === 0 ? added : 0)) + " " + t.students, cur: i === sel ? "true" : "false",
      go: () => this.setState({ sel: i }),
      style: "display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:14px 16px;border-radius:14px;cursor:pointer;text-align:left;font-family:'Plus Jakarta Sans',sans-serif;color:#1D1D1F;" + (i === sel ? "border:2px solid #C8102E;background:#FFFFFF" : "border:1px solid #E6E6EA;background:#FFFFFF")
    }));
    const names = [["Aditya Pratama", "aditya@siswa.id"], ["Bunga Lestari", "bunga@siswa.id"], ["Citra Ayuningtyas", "citra@siswa.id"], ["Dewa Saputra", "dewa@siswa.id"], ["Eka Wulandari", "eka@siswa.id"], ["Farhan Hidayat", "farhan@siswa.id"]];
    const members = names.map((n, i) => {
      const off = !!inactive[i];
      return {
        name: n[0], email: n[1], status: off ? t.inactiveL : t.active, action: off ? t.activate : t.deactivate,
        badge: "font-size:12px;font-weight:700;padding:5px 10px;border-radius:999px;" + (off ? "background:#F2F2F5;color:#4A4A55" : "background:#E6F4EA;color:#1E6B3A"),
        toggle: () => this.setState({ inactive: Object.assign({}, inactive, { [i]: !off }) })
      };
    });
    const cand = [["Galih Ramadhan", t.notIn], ["Hana Putri", t.notIn], ["Indra Kusuma", t.inOther]];
    const candidates = cand.map((c, i) => ({ name: c[0], note: c[1], checked: !!picked[i], toggle: () => this.setState({ picked: Object.assign({}, picked, { [i]: !picked[i] }) }) }));
    const nPicked = Object.keys(picked).filter((k) => picked[k]).length;
    const navHref = ["AdminDashboard.dc.html", "#", "#", "AdminClasses.dc.html", "AdminDashboard.dc.html", "AdminDashboard.dc.html", "WorkspaceStatus.dc.html"];
    const nav = t.nav.map((label, i) => ({ icon: NAVI[i],
      label, href: navHref[i],
      style: i === 3
        ? "display:flex;align-items:center;gap:12px;min-height:44px;padding:0 14px;border-radius:10px;background:#FDECEE;color:#9E0B22;text-decoration:none;font-weight:700;font-size:15px"
        : "display:flex;align-items:center;gap:12px;min-height:44px;padding:0 14px;border-radius:10px;color:#1D1D1F;text-decoration:none;font-weight:500;font-size:15px"
    }));
    const on = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:#C8102E;color:#FFFFFF;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const off = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:#1D1D1F;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    return {
      t, classList, members, candidates, nav,
      memberCount: "(" + (32 + added) + ")",
      picker: !!st.picker, togglePicker: () => this.setState({ picker: !st.picker }),
      addLabel: t.add + " (" + nPicked + " " + t.selected + ")",
      addPicked: () => this.setState({ added: added + nPicked, picker: false, picked: {} }),
      isEn: lang === "en", isId: lang === "id",
      enBtn: lang === "en" ? on : off, idBtn: lang === "id" ? on : off,
      setEn: () => this.setState({ lang: "en" }), setId: () => this.setState({ lang: "id" })
    };
  }
}
return Component;
})();
SCREENS["TutorClass"] = (function () {
class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const lang = st.lang || this.props.lang || "en";
    const tab = st.tab || "mat";
    const D = {
      en: {
        logout: "Log out", myClasses: "My classes", classTitle: "Mathematics · Class 12 IPA", classMeta: "32 students · Mon 13:00–14:30, Wed 15:00–16:30", sectionsAria: "Class sections",
        tabs: ["Materials", "CBT exams", "Results & students"],
        opens: "Opens (WIB)", closes: "Closes (WIB)", duration: "Duration (min)", attemptsL: "Attempts per student",
        deadlineRule: "Each student's deadline is the earlier of start time + duration and the closing time, using server time.",
        examFilter: "Exam", exportCls: "Export CSV (this class)", done: "Submitted", missed: "Not taken",
        publishTitle: "Publish a material", fTitle: "Title", sampleTitle: "Integrals — practice set 2",
        drop: "Drop a PDF here", dropHint: "PDF only · up to 20 MB", browse: "Choose file", or: "or",
        videoLabel: "Video link", videoErr: "Use a secure link that starts with https://", publishBtn: "Publish to Class 12 IPA",
        published: "Published materials",
        mats: [
          ["PDF", "Limits — summary notes", "2.4 MB · 12 Oct"], ["Video", "Derivatives explained", "YouTube · 10 Oct"],
          ["PDF", "Derivatives — practice set 1", "1.1 MB · 08 Oct"], ["PDF", "Formula sheet, semester 1", "640 KB · 01 Oct"], ["Video", "Tryout 1 discussion", "YouTube · 28 Sep"]
        ],
        more: "More actions for",
        examsTitle: "CBT exams", newExam: "New exam",
        exList: [["Integrals Quiz", "20 questions · 45 min · 21 Oct, 13:00", "Draft", "d"], ["Mathematics Tryout 1", "20 questions · 60 min · 18 Oct, 08:00", "Published", "p"], ["Derivatives Quiz", "20 questions · 45 min · 07 Oct", "Closed", "c"]],
        editorTitle: "Integrals Quiz", editorMeta: "20 questions · 45 min",
        cantPublish: "Not ready to publish:", cantPublishBody: "questions 7 and 12 have no answer key yet. Every question needs 4 options and exactly one key.",
        q7: "QUESTION 7 OF 20", qText: "∫ (3x² + 2x) dx = …", answerKey: "Answer key",
        saveDraft: "Save draft", publishExam: "Publish exam",
        studentsTitle: "Students in this class", colName: "Name", colLast: "Last exam", colScore: "Score", lastExam: "Derivatives Quiz"
      },
      id: {
        logout: "Keluar", myClasses: "Kelas saya", classTitle: "Matematika · Kelas 12 IPA", classMeta: "32 siswa · Sen 13.00–14.30, Rab 15.00–16.30", sectionsAria: "Bagian kelas",
        tabs: ["Materi", "Ujian CBT", "Hasil & siswa"],
        opens: "Dibuka (WIB)", closes: "Ditutup (WIB)", duration: "Durasi (menit)", attemptsL: "Percobaan per siswa",
        deadlineRule: "Tenggat tiap siswa adalah yang lebih awal antara waktu mulai + durasi dan waktu ditutup, berdasarkan waktu server.",
        examFilter: "Ujian", exportCls: "Ekspor CSV (kelas ini)", done: "Dikumpulkan", missed: "Tidak mengerjakan",
        publishTitle: "Terbitkan materi", fTitle: "Judul", sampleTitle: "Integral — latihan 2",
        drop: "Letakkan PDF di sini", dropHint: "Hanya PDF · maks. 20 MB", browse: "Pilih berkas", or: "atau",
        videoLabel: "Tautan video", videoErr: "Gunakan tautan aman yang diawali https://", publishBtn: "Terbitkan ke Kelas 12 IPA",
        published: "Materi terbit",
        mats: [
          ["PDF", "Limit — ringkasan materi", "2,4 MB · 12 Okt"], ["Video", "Penjelasan turunan", "YouTube · 10 Okt"],
          ["PDF", "Turunan — latihan 1", "1,1 MB · 08 Okt"], ["PDF", "Lembar rumus semester 1", "640 KB · 01 Okt"], ["Video", "Pembahasan Tryout 1", "YouTube · 28 Sep"]
        ],
        more: "Tindakan lain untuk",
        examsTitle: "Ujian CBT", newExam: "Ujian baru",
        exList: [["Kuis Integral", "20 soal · 45 menit · 21 Okt, 13.00", "Draf", "d"], ["Tryout Matematika 1", "20 soal · 60 menit · 18 Okt, 08.00", "Terbit", "p"], ["Kuis Turunan", "20 soal · 45 menit · 07 Okt", "Ditutup", "c"]],
        editorTitle: "Kuis Integral", editorMeta: "20 soal · 45 menit",
        cantPublish: "Belum bisa diterbitkan:", cantPublishBody: "soal 7 dan 12 belum memiliki kunci jawaban. Setiap soal perlu 4 opsi dan tepat satu kunci.",
        q7: "SOAL 7 DARI 20", qText: "∫ (3x² + 2x) dx = …", answerKey: "Kunci jawaban",
        saveDraft: "Simpan draf", publishExam: "Terbitkan ujian",
        studentsTitle: "Siswa di kelas ini", colName: "Nama", colLast: "Ujian terakhir", colScore: "Skor", lastExam: "Kuis Turunan"
      }
    };
    const t = D[lang];
    const TABI = [
      "M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z",
      "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
      "M3 3v18h18 M7 16v-5 M12 16V8 M17 16V5"
    ];
    const ids = ["mat", "exam", "stu"];
    const tabs = t.tabs.map((label, i) => ({
      label, icon: TABI[i], sel: tab === ids[i], go: () => this.setState({ tab: ids[i] }),
      style: tab === ids[i]
        ? "height:48px;padding:0 18px;border:0;border-bottom:3px solid #C8102E;background:transparent;color:#1D1D1F;font:800 15px 'Plus Jakarta Sans',sans-serif;cursor:pointer;margin-bottom:-1px"
        : "height:48px;padding:0 18px;border:0;border-bottom:3px solid transparent;background:transparent;color:#5F6368;font:600 15px 'Plus Jakarta Sans',sans-serif;cursor:pointer;margin-bottom:-1px"
    }));
    const tag = (pdf) => pdf
      ? "flex:none;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;padding:6px 8px;border-radius:6px;background:#FDE7E5;color:#8A1C12;min-width:44px;text-align:center"
      : "flex:none;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;padding:6px 8px;border-radius:6px;background:#F1F1F4;color:#1D1D1F;min-width:44px;text-align:center";
    const materials = t.mats.map((m) => ({ kind: m[0], title: m[1], meta: m[2], tag: tag(m[0] === "PDF"), aria: t.more + " " + m[1] }));
    const b = (bg, fg) => "flex:none;font-size:12px;font-weight:700;padding:6px 10px;border-radius:999px;background:" + bg + ";color:" + fg;
    const exams = t.exList.map((e) => ({ title: e[0], meta: e[1], status: e[2], badge: e[3] === "d" ? b("#FCEFC9", "#6B4A00") : e[3] === "p" ? b("#E6F4EA", "#1E6B3A") : b("#F1F1F4", "#4A4A55") }));
    const optBase = "display:flex;align-items:center;gap:12px;min-height:44px;padding:0 14px;border-radius:10px;font-size:15px;";
    const opts = [["A", "x³ + x² + C", true], ["B", "6x + 2 + C", false], ["C", "x³ + 2x² + C", false], ["D", "3x³ + x² + C", false]].map((o) => ({
      k: o[0], v: o[1], key: o[2], style: optBase + (o[2] ? "border:2px solid #C8102E;background:#FDECEE" : "border:1px solid #E6E6EA;background:#FFFFFF")
    }));
    const students = [["Aditya Pratama", 88], ["Bunga Lestari", 92], ["Citra Ayuningtyas", 75], ["Dewa Saputra", 0], ["Eka Wulandari", 81], ["Farhan Hidayat", 70]].map((s, i) => ({
      name: s[0], exam: i === 3 ? t.missed : t.done, score: String(s[1]),
      badge: "font-size:12px;font-weight:700;padding:5px 10px;border-radius:999px;" + (i === 3 ? "background:#FDE7E5;color:#8A1C12" : "background:#E6F4EA;color:#1E6B3A")
    }));
    const on = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:#C8102E;color:#FFFFFF;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const off = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:#1D1D1F;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    return {
      t, tabs, materials, exams, opts, students,
      onMat: tab === "mat", onExam: tab === "exam", onStu: tab === "stu",
      isEn: lang === "en", isId: lang === "id",
      enBtn: lang === "en" ? on : off, idBtn: lang === "id" ? on : off,
      setEn: () => this.setState({ lang: "en" }), setId: () => this.setState({ lang: "id" })
    };
  }
}
return Component;
})();
SCREENS["StudentHome"] = (function () {
class Component extends DCLogic {
  renderVals() {
    const lang = (this.state && this.state.lang) || this.props.lang || "en";
    const D = {
      en: {
        nav: ["Home", "Classes", "Exams", "Scores"], profileAria: "Account: Aditya Pratama", cls: "Class 12 IPA", hello: "Good morning, Aditya",
        openNow: "Open now", examName: "Mathematics Tryout 1", examMeta: "20 questions · 60 minutes · Tutor: Rina S.", closes: "Closes at", attempts: "Attempts", start: "Start exam",
        myClasses: "My classes", materials: "materials", newMat: "New materials", today: "Today's schedule", scores: "Recent scores",
        subj: ["Mathematics", "Physics", "Chemistry", "English"],
        mats: [["PDF", "Integrals — practice set 2", "Mathematics · today"], ["Video", "Newton's laws, part 2", "Physics · yesterday"], ["PDF", "Reaction rates — notes", "Chemistry · 12 Oct"], ["PDF", "Reading comprehension pack", "English · 11 Oct"]],
        exams: ["Derivatives Quiz", "Kinematics Quiz", "Stoichiometry Quiz"], dates: ["07 Oct", "02 Oct", "28 Sep"],
        myExams: "My exams", sOpen: "Open", sSoon: "Opens soon", sDone: "Submitted", sClosed: "Closed",
        exList: [["Mathematics Tryout 1", "Today 08:00–10:00 · 60 min · 1 attempt", "open"], ["Integrals Quiz", "Opens 21 Oct, 13:00 · 45 min", "soon"], ["Derivatives Quiz", "07 Oct · score 88", "done"], ["Vectors Quiz", "05 Oct · not taken, scored 0", "closed"]],
        ctaStart: "Start exam", ctaScore: "See score"
      },
      id: {
        nav: ["Beranda", "Kelas", "Ujian", "Nilai"], profileAria: "Akun: Aditya Pratama", cls: "Kelas 12 IPA", hello: "Selamat pagi, Aditya",
        openNow: "Dibuka sekarang", examName: "Tryout Matematika 1", examMeta: "20 soal · 60 menit · Tutor: Rina S.", closes: "Ditutup pukul", attempts: "Percobaan", start: "Mulai ujian",
        myClasses: "Kelas saya", materials: "materi", newMat: "Materi terbaru", today: "Jadwal hari ini", scores: "Nilai terbaru",
        subj: ["Matematika", "Fisika", "Kimia", "Bahasa Inggris"],
        mats: [["PDF", "Integral — latihan 2", "Matematika · hari ini"], ["Video", "Hukum Newton, bagian 2", "Fisika · kemarin"], ["PDF", "Laju reaksi — catatan", "Kimia · 12 Okt"], ["PDF", "Paket pemahaman bacaan", "Bahasa Inggris · 11 Okt"]],
        exams: ["Kuis Turunan", "Kuis Kinematika", "Kuis Stoikiometri"], dates: ["07 Okt", "02 Okt", "28 Sep"],
        myExams: "Ujian saya", sOpen: "Dibuka", sSoon: "Akan dibuka", sDone: "Selesai", sClosed: "Ditutup",
        exList: [["Tryout Matematika 1", "Hari ini 08.00–10.00 · 60 menit · 1 percobaan", "open"], ["Kuis Integral", "Dibuka 21 Okt, 13.00 · 45 menit", "soon"], ["Kuis Turunan", "07 Okt · skor 88", "done"], ["Kuis Vektor", "05 Okt · tidak dikerjakan, nilai 0", "closed"]],
        ctaStart: "Mulai ujian", ctaScore: "Lihat nilai"
      }
    };
    const t = D[lang];
    const CIRC = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z";
    const NAVI = [
      "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
      "M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z",
      "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
      "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M8.5 13.9 7 22l5-3 5 3-1.5-8.1"
    ];
    const SUBJ = [
      "M18 4H6l6 8-6 8h12",
      "M13 2 3 14h9l-1 8 10-12h-9z",
      "M9 3h6 M10 3v6L4 19a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3L14 9V3 M7 15h10",
      "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z M8 9h8 M8 13h5"
    ];
    const SI = {
      open: CIRC + " M12 7v5l3 2",
      soon: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
      done: CIRC + " M8 12l3 3 5-6",
      closed: "M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4"
    };
    const colors = ["#C8102E", "#E3B53B", "#1D1D1F", "#E86A7C"];
    const tutors = ["Rina S.", "Dimas P.", "Fajar R.", "Ayu L."];
    const counts = [12, 9, 7, 10];
    const classes = t.subj.map((name, i) => ({ name, tutor: "Tutor: " + tutors[i], count: counts[i] + " " + t.materials, dot: "width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:" + colors[i] + ";color:" + (i === 1 ? "#1D1D1F" : "#FFFFFF"), icon: SUBJ[i] }));
    const tag = (pdf) => pdf
      ? "flex:none;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;padding:6px 8px;border-radius:6px;background:#FDE7E5;color:#8A1C12;min-width:44px;text-align:center"
      : "flex:none;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;padding:6px 8px;border-radius:6px;background:#F1F1F4;color:#1D1D1F;min-width:44px;text-align:center";
    const mats = t.mats.map((m) => ({ kind: m[0], title: m[1], meta: m[2], tag: tag(m[0] === "PDF") }));
    const today = [{ time: "08:00–09:00", subject: t.examName, tutor: "CBT" }, { time: "13:00–14:30", subject: t.subj[0], tutor: "Tutor: Rina S." }];
    const scores = t.exams.map((name, i) => ({ name, date: t.dates[i], score: ["88", "79", "83"][i] }));
    const bd = (bg, fg) => "flex:none;font-size:12px;font-weight:700;padding:6px 10px;border-radius:999px;background:" + bg + ";color:" + fg;
    const exams = t.exList.map((e) => {
      const k = e[2];
      return {
        name: e[0], meta: e[1], sicon: SI[k],
        status: k === "open" ? t.sOpen : k === "soon" ? t.sSoon : k === "done" ? t.sDone : t.sClosed,
        badge: k === "open" ? bd("#E6F4EA", "#1E6B3A") : k === "soon" ? bd("#F1F1F4", "#1D1D1F") : k === "done" ? bd("#FCEFC9", "#6B4A00") : bd("#F2F2F5", "#4A4A55"),
        hasLink: k === "open" || k === "done", href: k === "open" ? "Exam.dc.html" : "Result.dc.html", cta: k === "open" ? t.ctaStart : t.ctaScore
      };
    });
    const navHref = ["StudentHome.dc.html", "#mat-h", "#ex-h", "Result.dc.html"];
    const nav = t.nav.map((label, i) => ({ icon: NAVI[i],
      label, href: navHref[i],
      style: i === 0
        ? "display:flex;align-items:center;gap:8px;height:44px;padding:0 14px;border-radius:10px;background:#FDECEE;color:#9E0B22;text-decoration:none;font-weight:700;font-size:15px"
        : "display:flex;align-items:center;gap:8px;height:44px;padding:0 14px;border-radius:10px;color:#1D1D1F;text-decoration:none;font-weight:500;font-size:15px"
    }));
    const on = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:#C8102E;color:#FFFFFF;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const off = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:#1D1D1F;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    return {
      t, nav, classes, mats, today, scores, exams,
      isEn: lang === "en", isId: lang === "id",
      enBtn: lang === "en" ? on : off, idBtn: lang === "id" ? on : off,
      setEn: () => this.setState({ lang: "en" }), setId: () => this.setState({ lang: "id" })
    };
  }
}
return Component;
})();
SCREENS["Exam"] = (function () {
class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const lang = st.lang || this.props.lang || "en";
    const cur = st.cur == null ? 6 : st.cur;
    const answers = st.answers || { 0: "A", 1: "C", 2: "B", 3: "D", 4: "A", 5: "B", 7: "C", 8: "A", 10: "B", 11: "D" };
    const flags = st.flags || { 9: true };
    const D = {
      en: {
        examName: "Mathematics Tryout 1", cls: "Class 12 IPA", saved: "Answers saved · 3 s ago", timeLeftAria: "Time left: 42 minutes 17 seconds",
        submit: "Submit", flag: "Flag for review", prev: "Previous", next: "Next", questions: "Questions", answered: "answered",
        lAnswered: "Answered", lFlagged: "Flagged for review", lEmpty: "Not answered", qOf: "Question", of: "of",
        rules: "The timer runs on the server. Your deadline is the earlier of start + 60 min and the exam's closing time (10:00 WIB). When time is up your saved answers are submitted automatically; later answers are not accepted. One attempt only. If the page reloads, your saved answers come back.",
        unsaved: "Not saved yet — check your connection",
        cfTitle: "Submit your exam?", cfA: "You have answered", cfB: "Unanswered questions score zero, and you can't change answers after submitting.",
        back: "Keep working", cfSubmit: "Submit now",
        Q: [
          { text: "If f(x) = 2x³ − 5x + 1, what is f′(2)?", o: ["19", "11", "24", "7"] },
          { text: "The value of lim (x→3) of (x² − 9)/(x − 3) is …", o: ["0", "3", "6", "Undefined"] },
          { text: "∫ from 0 to 2 of 3x² dx equals …", o: ["6", "8", "12", "4"] },
          { text: "The gradient of the line through (1, 2) and (4, 11) is …", o: ["2", "3", "4", "9"] },
          { text: "If log₂ x = 5, then x = …", o: ["10", "25", "32", "64"] }
        ]
      },
      id: {
        examName: "Tryout Matematika 1", cls: "Kelas 12 IPA", saved: "Jawaban tersimpan · 3 dtk lalu", timeLeftAria: "Sisa waktu: 42 menit 17 detik",
        submit: "Kumpulkan", flag: "Tandai untuk ditinjau", prev: "Sebelumnya", next: "Berikutnya", questions: "Daftar soal", answered: "terjawab",
        lAnswered: "Sudah dijawab", lFlagged: "Ditandai", lEmpty: "Belum dijawab", qOf: "Soal", of: "dari",
        rules: "Timer berjalan di server. Tenggat Anda adalah yang lebih awal antara waktu mulai + 60 menit dan waktu ujian ditutup (10.00 WIB). Saat waktu habis, jawaban yang tersimpan dikumpulkan otomatis; jawaban terlambat tidak diterima. Hanya satu percobaan. Jika halaman dimuat ulang, jawaban tersimpan kembali muncul.",
        unsaved: "Belum tersimpan — periksa koneksi",
        cfTitle: "Kumpulkan ujian?", cfA: "Anda sudah menjawab", cfB: "Soal yang tidak dijawab bernilai nol, dan jawaban tidak bisa diubah setelah dikumpulkan.",
        back: "Lanjut mengerjakan", cfSubmit: "Kumpulkan sekarang",
        Q: [
          { text: "Jika f(x) = 2x³ − 5x + 1, maka f′(2) = …", o: ["19", "11", "24", "7"] },
          { text: "Nilai lim (x→3) dari (x² − 9)/(x − 3) adalah …", o: ["0", "3", "6", "Tidak terdefinisi"] },
          { text: "∫ dari 0 sampai 2 untuk 3x² dx sama dengan …", o: ["6", "8", "12", "4"] },
          { text: "Gradien garis yang melalui (1, 2) dan (4, 11) adalah …", o: ["2", "3", "4", "9"] },
          { text: "Jika log₂ x = 5, maka x = …", o: ["10", "25", "32", "64"] }
        ]
      }
    };
    const t = D[lang];
    const N = 20;
    const q = t.Q[cur % t.Q.length];
    const keys = ["A", "B", "C", "D"];
    const chosen = answers[cur];
    const setAns = (k) => () => this.setState({ answers: Object.assign({}, answers, { [cur]: k }) });
    const options = q.o.map((v, i) => {
      const sel = chosen === keys[i];
      return {
        k: keys[i], v, sel, pick: setAns(keys[i]),
        style: "display:flex;align-items:center;gap:16px;min-height:60px;padding:10px 18px;border-radius:14px;cursor:pointer;font:500 18px 'Plus Jakarta Sans',sans-serif;color:#1D1D1F;" + (sel ? "border:2px solid #C8102E;background:#FDECEE" : "border:1.5px solid #D6D6DC;background:#FFFFFF"),
        badge: "flex:none;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font:600 15px 'IBM Plex Mono',monospace;" + (sel ? "background:#C8102E;color:#FFFFFF" : "background:#F7F7F8;color:#1D1D1F")
      };
    });
    const count = Object.keys(answers).length;
    const grid = [];
    for (let i = 0; i < N; i++) {
      const a = answers[i] != null, f = !!flags[i], c = i === cur;
      let s = "height:44px;border-radius:10px;font:600 14px 'IBM Plex Mono',monospace;cursor:pointer;";
      if (f) s += "background:#FCEFC9;color:#4A3A12;border:2px solid #C98A00;";
      else if (a) s += "background:#C8102E;color:#FFFFFF;border:2px solid #C8102E;";
      else s += "background:#FFFFFF;color:#1D1D1F;border:1px solid #C7C7CF;";
      if (c) s += "box-shadow:0 0 0 3px #1D1D1F;";
      grid.push({ n: String(i + 1), cur: c ? "step" : "false", aria: t.qOf + " " + (i + 1) + (a ? " · " + t.lAnswered : "") + (f ? " · " + t.lFlagged : ""), style: s, go: () => this.setState({ cur: i }) });
    }
    const flagged = !!flags[cur];
    const on = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:#FFFFFF;color:#1D1D1F;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const off = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:#FFFFFF;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const unsaved = this.props.connection === "offline";
    return {
      t, q, options, grid, flagged, isSaved: !unsaved, isUnsaved: unsaved,
      qLabel: t.qOf + " " + (cur + 1) + " " + t.of + " " + N,
      answeredLine: count + " / " + N + " " + t.answered,
      cfBody: t.cfA + " " + count + " / " + N + ". " + t.cfB,
      flagStyle: "height:44px;padding:0 14px;border-radius:10px;font:700 14px 'Plus Jakarta Sans',sans-serif;cursor:pointer;" + (flagged ? "background:#FCEFC9;color:#4A3A12;border:2px solid #C98A00" : "background:#FFFFFF;color:#1D1D1F;border:1.5px solid #C7C7CF"),
      toggleFlag: () => this.setState({ flags: Object.assign({}, flags, { [cur]: !flagged }) }),
      prev: () => this.setState({ cur: Math.max(0, cur - 1) }),
      next: () => this.setState({ cur: Math.min(N - 1, cur + 1) }),
      confirm: !!st.confirm,
      openConfirm: () => this.setState({ confirm: true }), closeConfirm: () => this.setState({ confirm: false }),
      isEn: lang === "en", isId: lang === "id",
      enBtn: lang === "en" ? on : off, idBtn: lang === "id" ? on : off,
      setEn: () => this.setState({ lang: "en" }), setId: () => this.setState({ lang: "id" })
    };
  }
}
return Component;
})();
SCREENS["Result"] = (function () {
class Component extends DCLogic {
  renderVals() {
    const lang = (this.state && this.state.lang) || this.props.lang || "en";
    const D = {
      en: {
        home: "Back to home", scoreAria: "Score 85 out of 100", finalized: "Submitted · score final", examName: "Mathematics Tryout 1",
        meta: "Submitted 18 Oct 2026, 08:47 WIB · time used 47 of 60 min",
        sCorrect: "Correct", sWrong: "Wrong", sBlank: "Unanswered",
        formula: "Score = 17 correct ÷ 20 questions × 100 = 85",
        perQ: "Question by question", correct: "Correct", wrong: "Wrong", blank: "Unanswered", q: "Question",
        keyNote: "Answer keys stay with your tutor. Ask them in class to go through the questions you missed.",
        history: "Your mathematics scores", hNames: ["Mathematics Tryout 1", "Derivatives Quiz", "Limits Quiz", "Functions Quiz"]
      },
      id: {
        home: "Kembali ke beranda", scoreAria: "Skor 85 dari 100", finalized: "Sudah dikumpulkan · skor final", examName: "Tryout Matematika 1",
        meta: "Dikumpulkan 18 Okt 2026, 08.47 WIB · waktu terpakai 47 dari 60 menit",
        sCorrect: "Benar", sWrong: "Salah", sBlank: "Kosong",
        formula: "Skor = 17 benar ÷ 20 soal × 100 = 85",
        perQ: "Per soal", correct: "Benar", wrong: "Salah", blank: "Kosong", q: "Soal",
        keyNote: "Kunci jawaban tetap dipegang tutor. Tanyakan di kelas untuk membahas soal yang terlewat.",
        history: "Nilai matematika Anda", hNames: ["Tryout Matematika 1", "Kuis Turunan", "Kuis Limit", "Kuis Fungsi"]
      }
    };
    const t = D[lang];
    const CIRC = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z";
    const SICON = [CIRC + " M8 12l3 3 5-6", CIRC + " M15 9l-6 6 M9 9l6 6", CIRC + " M8 12h8"];
    const stats0 = [
      { n: "17", label: t.sCorrect, style: "display:flex;flex-direction:column;gap:2px;padding:14px;border-radius:12px;background:#E6F4EA;color:#14532D" },
      { n: "2", label: t.sWrong, style: "display:flex;flex-direction:column;gap:2px;padding:14px;border-radius:12px;background:#FDE7E5;color:#8A1C12" },
      { n: "1", label: t.sBlank, style: "display:flex;flex-direction:column;gap:2px;padding:14px;border-radius:12px;background:#F2F2F5;color:#4A4A55" }
    ];
    const stats = stats0.map((s, i) => Object.assign({}, s, { icon: SICON[i] }));
    const wrong = { 6: 1, 13: 1 }, blank = { 17: 1 };
    const cells = [];
    for (let i = 0; i < 20; i++) {
      const base = "height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;font:600 13px 'IBM Plex Mono',monospace;box-sizing:border-box;";
      let style, st;
      if (wrong[i]) { style = base + "background:#FFFFFF;color:#8A1C12;border:2px solid #B42318"; st = t.wrong; }
      else if (blank[i]) { style = base + "background:#ECECF0;color:#4A4A55"; st = t.blank; }
      else { style = base + "background:#1E8E3E;color:#FFFFFF"; st = t.correct; }
      cells.push({ n: String(i + 1), style, aria: t.q + " " + (i + 1) + ": " + st });
    }
    const hs = [85, 88, 76, 70];
    const hist = t.hNames.map((name, i) => ({ name, score: String(hs[i]), bar: "width:" + hs[i] + "%;height:100%;background:" + (i === 0 ? "#C8102E" : "#EFA3AE") }));
    const on = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:#C8102E;color:#FFFFFF;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    const off = "height:36px;min-width:44px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:#1D1D1F;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer";
    return {
      t, stats, cells, hist,
      isEn: lang === "en", isId: lang === "id",
      enBtn: lang === "en" ? on : off, idBtn: lang === "id" ? on : off,
      setEn: () => this.setState({ lang: "en" }), setId: () => this.setState({ lang: "id" })
    };
  }
}
return Component;
})();
SCREENS["AccessMatrix"] = (function () {
class Component extends DCLogic {
  renderVals() {
    const K = "display:inline-block;font-size:12px;font-weight:700;padding:6px 10px;border-radius:8px;background:#C8102E;color:#FFFFFF";
    const L = "display:inline-block;font-size:12px;font-weight:700;padding:6px 10px;border-radius:8px;background:#FDECEE;color:#7A0A1C;border:1px solid #EFA3AE";
    const N = "display:inline-block;font-size:12px;font-weight:600;padding:6px 10px;border-radius:8px;background:#F2F2F5;color:#5F6368";
    const c = (s, text) => ({ style: s, text });
    const rows = [
      { fn: "Persetujuan bimbel & paket global", er: "ER-1.1", cells: [c(K, "Kelola"), c(N, "—"), c(N, "—"), c(N, "—")] },
      { fn: "Informasi paket & tagihan", er: "ER-1.2", cells: [c(K, "Kelola semua bimbel"), c(L, "Lihat milik sendiri"), c(N, "—"), c(N, "—")] },
      { fn: "Pengguna, kelas & jadwal", er: "ER-3.1, 3.2", cells: [c(L, "Status akun tenant"), c(K, "Kelola tenant"), c(L, "Lihat penugasan"), c(L, "Lihat kelas sendiri")] },
      { fn: "Materi & bank soal", er: "ER-4.1, 5.1", cells: [c(N, "— (default)"), c(K, "Kelola per penugasan"), c(K, "Kelola kelas diampu"), c(L, "Lihat materi kelas")] },
      { fn: "Pengerjaan CBT", er: "ER-5.2, 5.3", cells: [c(N, "—"), c(N, "—"), c(N, "—"), c(L, "Kerjakan ujian sendiri")] },
      { fn: "Hasil & laporan", er: "ER-6.1", cells: [c(N, "— (default)"), c(L, "Lihat seluruh tenant"), c(L, "Lihat kelas diampu"), c(L, "Lihat nilai sendiri")] },
      { fn: "Monitoring & backup", er: "ER-7.1, 7.3", cells: [c(K, "Kelola"), c(N, "—"), c(N, "—"), c(N, "—")] }
    ];
    const m = (menu, does, screen, href) => ({ menu, does, screen, href });
    const head = (bg, fg) => "display:flex;flex-direction:column;gap:4px;padding:18px 20px;background:" + bg + ";color:" + fg;
    const roles = [
      { name: "Super Admin", scope: "Seluruh layanan, tanpa isi data belajar", head: head("#1D1D1F", "#FFFFFF"), menus: [
        m("Ringkasan", "Tenant aktif, pengguna, error, status layanan", "SuperAdmin", "SuperAdmin.dc.html"),
        m("Pendaftaran bimbel", "Setujui / tolak tenant Menunggu", "SuperAdmin", "SuperAdmin.dc.html"),
        m("Paket & tagihan", "Harga, batas pengguna, masa aktif, perpanjangan", "SuperAdmin", "SuperAdmin.dc.html"),
        m("Kondisi layanan", "Log error dan status komponen", "SuperAdmin", "SuperAdmin.dc.html"),
        m("Backup", "Backup 24 jam dan uji pemulihan", "SuperAdmin", "SuperAdmin.dc.html") ] },
      { name: "Admin Bimbel", scope: "Seluruh data di bimbelnya sendiri", head: head("#C8102E", "#FFFFFF"), menus: [
        m("Dasbor", "Ringkasan, jadwal minggu ini, tambah sesi", "AdminDashboard", "AdminDashboard.dc.html"),
        m("Siswa & tutor · Mata pelajaran", "Tambah, ubah, nonaktifkan", "AdminClasses", "AdminClasses.dc.html"),
        m("Kelas", "Tutor pengampu dan anggota kelas", "AdminClasses", "AdminClasses.dc.html"),
        m("Jadwal", "Sesi per kelas dengan cek bentrok", "AdminDashboard", "AdminDashboard.dc.html"),
        m("Laporan", "Rekap kelas, hasil per siswa, ekspor CSV", "AdminDashboard", "AdminDashboard.dc.html"),
        m("Langganan", "Lihat paket, kuota, tagihan", "WorkspaceStatus", "WorkspaceStatus.dc.html") ] },
      { name: "Tutor", scope: "Hanya kelas yang ditugaskan", head: head("#E3B53B", "#1D1D1F"), menus: [
        m("Kelas saya", "Daftar kelas yang diampu", "TutorClass", "TutorClass.dc.html"),
        m("Kelas › Materi", "PDF ≤ 20 MB atau tautan video HTTPS", "TutorClass", "TutorClass.dc.html"),
        m("Kelas › Ujian CBT", "≥ 20 soal, 4 opsi, 1 kunci, jadwal & durasi", "TutorClass", "TutorClass.dc.html"),
        m("Kelas › Hasil & siswa", "Nilai per ujian, ekspor CSV kelas", "TutorClass", "TutorClass.dc.html") ] },
      { name: "Siswa", scope: "Hanya kelas dan nilainya sendiri", head: head("#FDECEE", "#7A0A1C"), menus: [
        m("Beranda", "Ujian dibuka, kelas, materi terbaru, jadwal", "StudentHome", "StudentHome.dc.html"),
        m("Kelas", "Materi PDF dan video per kelas", "StudentHome", "StudentHome.dc.html"),
        m("Ujian", "Status ujian, kerjakan satu kali", "Exam", "Exam.dc.html"),
        m("Nilai", "Skor dan ringkasan per soal", "Result", "Result.dc.html") ] }
    ];
    const RI = [
      "M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z",
      "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16 M16 9h2a2 2 0 0 1 2 2v10 M2 21h20 M8 7h4 M8 11h4 M8 15h4",
      "M2 4h20 M4 4v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4 M12 16v4 M8 21h8",
      "M22 10 12 5 2 10l10 5z M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"
    ];
    roles.forEach((r, i) => { r.icon = RI[i]; });
    return { rows, roles };
  }
}
return Component;
})();
