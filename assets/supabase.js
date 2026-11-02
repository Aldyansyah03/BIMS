/**
 * BIMS — Supabase Integration Client
 * Project Ref: isxkzbrswxqdlswmupzt
 */

const SUPABASE_CONFIG = {
  url: "https://isxkzbrswxqdlswmupzt.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzeGt6YnJzd3hxZGxzd211cHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4OTA2MzUsImV4cCI6MjEwODQ2NjYzNX0.QezwvGIg3iqhJzwAmz_0PceU2nKYibuUflN_bE1vDOM"
};

// Inisialisasi Supabase Client
let supabaseClient = null;

if (window.supabase && typeof window.supabase.createClient === "function") {
  supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  window.supabaseClient = supabaseClient;
  console.log("✅ Supabase berhasil terhubung ke proyek: isxkzbrswxqdlswmupzt");
} else {
  console.warn("⚠️ SDK Supabase belum dimuat. Pastikan script CDN terpasang.");
}

// Module Auth & State Pengguna
window.BIMS_AUTH = {
  currentUser: null,
  currentProfile: null,

  // Inisialisasi status sesi saat halaman dibuka
  async init() {
    if (!supabaseClient) return null;
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (!error && session && session.user) {
        this.currentUser = session.user;
        this.currentProfile = session.user.user_metadata || {};
        console.log("👤 Pengguna aktif:", this.currentUser.email);
      }
      return this.currentUser;
    } catch (e) {
      console.warn("Gagal mengambil sesi:", e);
      return null;
    }
  },

  // 1. Mendaftar akun baru (Sign Up)
  async signUp(email, password, extraData = {}) {
    if (!supabaseClient) throw new Error("Supabase client belum siap");
    
    // Normalisasi role
    const metadata = Object.assign({
      role: "admin_bimbel",
      created_at: new Date().toISOString()
    }, extraData);

    const { data, error } = await supabaseClient.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: metadata
      }
    });

    if (error) throw error;
    if (data && data.user) {
      this.currentUser = data.user;
      this.currentProfile = metadata;
    }
    return data;
  },

  // 2. Masuk / Login
  async signIn(email, password) {
    if (!supabaseClient) throw new Error("Supabase client belum siap");

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) throw error;
    if (data && data.user) {
      this.currentUser = data.user;
      this.currentProfile = data.user.user_metadata || {};
    }
    return data;
  },

  // 3. Keluar / Logout
  async signOut() {
    if (!supabaseClient) return;
    try {
      await supabaseClient.auth.signOut();
    } catch (e) {
      console.warn("Error sign out:", e);
    }
    this.currentUser = null;
    this.currentProfile = null;
  },

  // Dapatkan profil user saat ini
  getProfile() {
    return this.currentProfile || (this.currentUser && this.currentUser.user_metadata) || null;
  },

  // Cek apakah sudah login
  isLoggedIn() {
    return !!this.currentUser;
  }
};

// Jalankan pengecekan sesi saat file dimuat
if (window.BIMS_AUTH) {
  window.BIMS_AUTH.init();
}
