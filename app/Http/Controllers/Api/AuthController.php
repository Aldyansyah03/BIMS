<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\Subscription;
use App\Models\SubscriptionPackage;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use App\Rules\DeliverableEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with('tenant')->where('email', $request->email)->first();

        // 1. Cek email dan password
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.'
            ], 401);
        }

        // 2. Cek apakah user aktif
        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda sedang dinonaktifkan.'
            ], 403);
        }

        // 3. Status tenant
        // Jika statusnya 'ditolak', tolak login
        if ($user->tenant && strtolower($user->tenant->status) === 'ditolak') {
            return response()->json([
                'success'       => false,
                'status_code'   => 'TENANT_REJECTED',
                'tenant_status' => 'ditolak',
                'message'       => 'Mohon maaf, pendaftaran bimbel Anda tidak disetujui oleh Super Admin.',
            ], 403);
        }

        // 4. Generate Sanctum Token
        $token = $user->createToken('auth-token')->plainTextToken;

        // Catat Audit Trail (MR-7)
        ActivityLog::record('LOGIN', ['email' => $user->email], $user);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data'    => [
                'token' => $token,
                'user'  => [
                    'id'                   => $user->id,
                    'name'                 => $user->name,
                    'email'                => $user->email,
                    'role'                 => $user->role,
                    'tenant_id'            => $user->tenant_id,
                    'tenant_name'          => $user->tenant?->name,
                    'tenant'               => $user->tenant,
                    'email_verified_at'    => $user->email_verified_at,
                    'onboarding_step'      => $user->onboarding_step ?? 'completed',
                    'onboarding_completed' => (bool) $user->onboarding_completed,
                    'welcome_shown'        => (bool) $user->welcome_shown,
                ]
            ]
        ], 200);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['tenant', 'subscriptions.package']);
        return response()->json([
            'success' => true,
            'data'    => $user
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            ActivityLog::record('LOGOUT', ['email' => $request->user()->email], $request->user());
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.'
        ]);
    }

    /**
     * TAHAP 1: Registrasi Akun (Pre-Registration Staging via Cache)
     * Data akun TIDAK disimpan ke database `users` dulu agar database tetap 100% bersih.
     * Data disimpan sementara di Cache selama 24 jam dan email verifikasi dikirimkan.
     */
    public function register(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:100',
            'email'                 => ['required', 'string', 'max:150', 'unique:users,email', new DeliverableEmail()],
            'password'              => 'required|string|min:6|confirmed',
            'phone'                 => 'nullable|string|max:20',
            'package_id'            => 'nullable|exists:subscription_packages,id',
            'tenant_name'           => 'nullable|string|max:150',
        ]);

        $verificationToken = Str::random(64);

        // Tentukan paket langganan (default ke paket pertama jika tidak dikirim)
        $packageId = $request->package_id;
        if (!$packageId) {
            $defaultPkg = SubscriptionPackage::where('is_active', true)->first();
            $packageId = $defaultPkg?->id;
        }

        $emailClean = strtolower(trim($request->email));

        // Simpan data form sementara di Cache selama 24 jam (tidak mengotori database users)
        $pendingData = [
            'name'        => $request->name,
            'email'       => $emailClean,
            'password'    => Hash::make($request->password),
            'phone'       => $request->phone,
            'package_id'  => $packageId,
            'tenant_name' => $request->tenant_name,
            'token'       => $verificationToken,
            'created_at'  => now()->toIso8601String(),
        ];

        Cache::put("pending_reg_token_{$verificationToken}", $pendingData, now()->addHours(24));
        Cache::put("pending_reg_email_{$emailClean}", $verificationToken, now()->addHours(24));

        // Kirim email verifikasi ke alamat email calon pengguna
        try {
            Notification::route('mail', $request->email)
                ->notify(new VerifyEmailNotification($verificationToken, $request->email, $request->name));
        } catch (\Throwable $e) {
            Log::warning("Gagal mengirim email verifikasi ke {$request->email}: " . $e->getMessage());
        }

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $verificationUrl = "{$frontendUrl}/verify-email?token={$verificationToken}&email=" . urlencode($request->email);

        $responseData = [
            'next_step' => 'verify_email',
            'email'     => $request->email,
        ];

        if (app()->environment('testing')) {
            $responseData['verification_token'] = $verificationToken;
            $responseData['verification_url']   = $verificationUrl;
        }

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran akun berhasil! Tautan verifikasi telah dikirim ke email Anda. Data akun Anda akan diaktifkan setelah Anda mengklik tautan verifikasi di email.',
            'data'    => $responseData,
        ], 201);
    }

    /**
     * TAHAP 2: Verifikasi Email (Aktivasi & Penyimpanan Data ke Database)
     * Memvalidasi token dari Cache, memasukkan data ke tabel `users`, `subscriptions`, dan `invoices`.
     */
    public function verifyEmail(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($request->email));
        $token = trim($request->token);

        // 1. Cek apakah pengguna sudah pernah diverifikasi & tersimpan di database sebelumnya
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            if ($existingUser->email_verified_at) {
                $authToken = $existingUser->createToken('auth-token')->plainTextToken;
                return response()->json([
                    'success' => true,
                    'message' => 'Alamat email sudah diverifikasi sebelumnya.',
                    'data'    => [
                        'token'     => $authToken,
                        'user'      => $existingUser->fresh(['tenant', 'subscriptions.package']),
                        'next_step' => $existingUser->onboarding_step === 'verify_email' ? 'payment' : $existingUser->onboarding_step,
                    ]
                ]);
            }
        }

        // 2. Ambil data registrasi pending dari Cache staging
        $pendingData = Cache::get("pending_reg_token_{$token}");

        if (!$pendingData || strtolower(trim($pendingData['email'])) !== $email) {
            return response()->json([
                'success' => false,
                'message' => 'Tautan verifikasi tidak valid atau telah kedaluwarsa. Silakan lakukan pendaftaran ulang.',
            ], 400);
        }

        // 3. BARU SEKARANG data dimasukkan secara resmi ke Database Users (DB Transaction)
        return DB::transaction(function () use ($pendingData, $token, $email) {
            // Jika ada nama bimbel sementara
            $tenant = null;
            if (!empty($pendingData['tenant_name'])) {
                $slug = Str::slug($pendingData['tenant_name']);
                $originalSlug = $slug;
                $count = 1;
                while (Tenant::where('slug', $slug)->exists()) {
                    $slug = "{$originalSlug}-{$count}";
                    $count++;
                }
                $tenant = Tenant::create([
                    'name'   => $pendingData['tenant_name'],
                    'slug'   => $slug,
                    'status' => 'menunggu',
                ]);
            }

            // Buat User Baru di Database yang SUDAH TERVERIFIKASI
            $user = User::create([
                'tenant_id'            => $tenant?->id,
                'name'                 => $pendingData['name'],
                'email'                => $pendingData['email'],
                'password'             => $pendingData['password'], // Hash tersimpan dari cache
                'role'                 => 'admin_bimbel',
                'phone'                => $pendingData['phone'],
                'is_active'            => true,
                'email_verified_at'    => now(), // Langsung terverifikasi saat data dibuat!
                'verification_token'   => null,
                'onboarding_step'      => 'payment', // Langkah berikutnya adalah pembayaran
                'onboarding_completed' => false,
                'welcome_shown'        => false,
            ]);

            // Inisiasi Subscription & Invoice dengan status menunggu/unpaid
            $packageId = $pendingData['package_id'];
            if ($packageId) {
                $package = SubscriptionPackage::find($packageId);
                if ($package) {
                    $orderId = 'REG-' . strtoupper(Str::random(6)) . '-' . time();
                    $subscription = Subscription::create([
                        'tenant_id'  => $tenant?->id,
                        'user_id'    => $user->id,
                        'package_id' => $package->id,
                        'start_date' => now(),
                        'end_date'   => now()->addDays($package->duration_days),
                        'status'     => 'menunggu_verifikasi',
                    ]);

                    Invoice::create([
                        'tenant_id'       => $tenant?->id,
                        'user_id'         => $user->id,
                        'subscription_id' => $subscription->id,
                        'invoice_number'  => $orderId,
                        'amount'          => $package->price,
                        'status'          => 'unpaid',
                        'due_date'        => now()->addDays(1),
                    ]);
                }
            }

            // Hapus data sementara dari Cache staging
            Cache::forget("pending_reg_token_{$token}");
            Cache::forget("pending_reg_email_{$email}");

            // Buat sanctum token agar sesi pengguna langsung aktif ke langkah pembayaran
            $authToken = $user->createToken('auth-token')->plainTextToken;

            // Catat audit trail pendaftaran resmi terverifikasi
            ActivityLog::record('REGISTER_VERIFIED', ['email' => $user->email, 'name' => $user->name], $user);

            return response()->json([
                'success' => true,
                'message' => 'Email berhasil diverifikasi! Akun Anda telah aktif, silakan lanjutkan ke pembayaran.',
                'data'    => [
                    'token'     => $authToken,
                    'user'      => $user->fresh(['tenant', 'subscriptions.package']),
                    'next_step' => 'payment',
                ]
            ], 200);
        });
    }

    /**
     * Kirim Ulang Email Verifikasi (Memperbarui data di Cache staging)
     */
    public function resendVerification(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string', new DeliverableEmail()],
        ]);

        $email = strtolower(trim($request->email));

        // 1. Cek apakah sudah terdaftar dan terverifikasi di database
        $existingUser = User::where('email', $email)->first();
        if ($existingUser && $existingUser->email_verified_at) {
            return response()->json([
                'success' => true,
                'message' => 'Email ini sudah terverifikasi sebelumnya.',
                'data'    => [
                    'next_step' => 'payment'
                ]
            ]);
        }

        // 2. Cek data di Cache staging
        $token = Cache::get("pending_reg_email_{$email}");
        $pendingData = $token ? Cache::get("pending_reg_token_{$token}") : null;

        if (!$pendingData) {
            return response()->json([
                'success' => false,
                'message' => 'Data pendaftaran untuk email ini tidak ditemukan atau telah kedaluwarsa. Silakan lakukan pendaftaran ulang.',
            ], 404);
        }

        // Perbarui token verifikasi baru di Cache
        Cache::forget("pending_reg_token_{$token}");

        $newToken = Str::random(64);
        $pendingData['token'] = $newToken;

        Cache::put("pending_reg_token_{$newToken}", $pendingData, now()->addHours(24));
        Cache::put("pending_reg_email_{$email}", $newToken, now()->addHours(24));

        try {
            Notification::route('mail', $email)
                ->notify(new VerifyEmailNotification($newToken, $email, $pendingData['name'] ?? 'Pengguna BIMS'));
        } catch (\Throwable $e) {
            Log::warning("Gagal kirim ulang email verifikasi: " . $e->getMessage());
        }

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $verificationUrl = "{$frontendUrl}/verify-email?token={$newToken}&email=" . urlencode($email);

        $responseData = [
            'next_step' => 'verify_email'
        ];

        if (app()->environment('testing')) {
            $responseData['verification_token'] = $newToken;
            $responseData['verification_url']   = $verificationUrl;
        }

        return response()->json([
            'success' => true,
            'message' => 'Tautan verifikasi baru berhasil dikirimkan ke kotak masuk email Anda.',
            'data'    => $responseData,
        ], 200);
    }

    /**
     * Cek Status Verifikasi Email Publik (Untuk tombol refresh status di frontend)
     * Tanpa memerlukan Sanctum token, sehingga tidak akan memicu 401 redirect ke login.
     */
    public function checkEmailVerified(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        // Jika user sudah masuk database dan email sudah terverifikasi
        if ($user && $user->email_verified_at) {
            $token = $user->createToken('auth-token')->plainTextToken;
            return response()->json([
                'success'  => true,
                'verified' => true,
                'message'  => 'Email Anda telah terverifikasi.',
                'data'     => [
                    'token'     => $token,
                    'user'      => $user->fresh(['tenant', 'subscriptions.package']),
                    'next_step' => 'payment',
                ]
            ], 200);
        }

        // Jika belum verifikasi (masih di staging cache atau belum klik link)
        return response()->json([
            'success'  => true,
            'verified' => false,
            'message'  => 'Email belum diverifikasi. Silakan buka kotak masuk email Anda dan klik tombol verifikasi di dalamnya.',
        ], 200);
    }

    /**
     * TAHAP 4: Melengkapi Profil Bimbel
     * Validasi data profil wajib, simpan Tenant, tandai onboarding selesai (onboarding_completed = true).
     */
    public function completeProfile(Request $request)
    {
        $user = $request->user() ? $request->user()->fresh() : null;

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak terautentikasi.',
            ], 401);
        }

        // Validasi otorisasi alur: Harus sudah verifikasi email
        if (!$user->email_verified_at) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum memverifikasi email.',
                'next_step' => 'verify_email',
            ], 403);
        }

        // Validasi otorisasi alur: Harus sudah menyelesaikan pembayaran
        $hasPaid = Invoice::where('user_id', $user->id)
            ->where('status', 'paid')
            ->exists() || in_array($user->onboarding_step, ['complete_profile', 'completed']);

        if (!$hasPaid) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum menyelesaikan pembayaran registrasi.',
                'next_step' => 'payment',
            ], 403);
        }

        // Validasi input data profil bimbel
        $request->validate([
            'bimbel_name'    => 'required|string|max:150',
            'city'           => 'required|string|max:100',
            'address'        => 'required|string|max:255',
            'workspace_slug' => 'required|string|max:50|alpha_dash|unique:tenants,slug' . ($user->tenant_id ? ",{$user->tenant_id}" : ''),
            'phone'          => 'required|string|max:20',
            'description'    => 'nullable|string|max:500',
            'logo'           => 'nullable',
        ]);

        return DB::transaction(function () use ($request, $user) {
            $slug = strtolower($request->workspace_slug);

            $logoUrl = null;
            if ($request->hasFile('logo')) {
                $logoUrl = $this->storeLogoFile($request->file('logo'));
            } elseif ($request->filled('logo')) {
                $logoUrl = $request->logo;
            }

            if ($user->tenant_id && $tenant = Tenant::find($user->tenant_id)) {
                // Update tenant yang sudah ada
                $tenantData = [
                    'name'        => $request->bimbel_name,
                    'slug'        => $slug,
                    'city'        => $request->city,
                    'address'     => $request->address,
                    'phone'       => $request->phone,
                    'description' => $request->description,
                    'status'      => 'aktif', // Aktif langsung!
                ];
                if ($logoUrl) {
                    $tenantData['logo'] = $logoUrl;
                }
                $tenant->update($tenantData);
            } else {
                // Buat Tenant Baru
                $tenant = Tenant::create([
                    'name'        => $request->bimbel_name,
                    'logo'        => $logoUrl,
                    'slug'        => $slug,
                    'city'        => $request->city,
                    'address'     => $request->address,
                    'phone'       => $request->phone,
                    'description' => $request->description,
                    'status'      => 'aktif', // Aktif langsung!
                ]);
            }

            // Update status akun user: onboarding selesai, welcome_shown diset false untuk trigger modal selamat datang
            $user->update([
                'tenant_id'            => $tenant->id,
                'phone'                => $request->phone,
                'onboarding_step'      => 'completed',
                'onboarding_completed' => true,
                'welcome_shown'        => false,
            ]);

            // Kaitkan Invoice dan Subscription ke Tenant ini
            Invoice::where('user_id', $user->id)->update(['tenant_id' => $tenant->id]);
            Subscription::where('user_id', $user->id)->update(['tenant_id' => $tenant->id]);

            ActivityLog::record('COMPLETE_PROFILE', [
                'tenant_id'   => $tenant->id,
                'tenant_name' => $tenant->name,
                'slug'        => $tenant->slug
            ], $user);

            return response()->json([
                'success' => true,
                'message' => 'Profil bimbel berhasil dilengkapi! Selamat datang di BIMS.',
                'data'    => [
                    'user'   => $user->fresh(['tenant']),
                    'tenant' => $tenant,
                    'slug'   => $tenant->slug,
                ]
            ], 200);
        });
    }

    /**
     * Dismiss Sambutan Selamat Datang
     * Menandai bahwa modal ucapan selamat datang sudah ditampilkan satu kali.
     */
    public function dismissWelcome(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->update(['welcome_shown' => true]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi sambutan telah ditutup.'
        ]);
    }

    /**
     * Update Profil Akun & Bimbel
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'         => 'required|string|max:100',
            'phone'        => 'nullable|string|max:20',
            'password'     => 'nullable|string|min:6|confirmed',
            'bimbel_name'  => 'nullable|string|max:150',
            'city'         => 'nullable|string|max:100',
            'address'      => 'nullable|string|max:255',
            'description'  => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($request, $user) {
            $userPayload = [
                'name'  => $request->name,
                'phone' => $request->phone ?? $user->phone,
            ];

            if ($request->filled('password')) {
                $userPayload['password'] = Hash::make($request->password);
            }

            $user->update($userPayload);

            if ($user->tenant_id && $tenant = Tenant::find($user->tenant_id)) {
                $tenantPayload = [];
                if ($request->filled('bimbel_name')) $tenantPayload['name'] = $request->bimbel_name;
                if ($request->filled('city')) $tenantPayload['city'] = $request->city;
                if ($request->filled('address')) $tenantPayload['address'] = $request->address;
                if ($request->has('description')) $tenantPayload['description'] = $request->description;
                if ($request->filled('phone')) $tenantPayload['phone'] = $request->phone;

                if ($request->hasFile('logo')) {
                    $tenantPayload['logo'] = $this->storeLogoFile($request->file('logo'));
                } elseif ($request->filled('logo')) {
                    $tenantPayload['logo'] = $request->logo;
                }

                if (!empty($tenantPayload)) {
                    $tenant->update($tenantPayload);
                }
            }

            ActivityLog::record('UPDATE_PROFILE', ['name' => $user->name], $user);

            return response()->json([
                'success' => true,
                'message' => 'Profil berhasil diperbarui.',
                'data'    => $user->fresh(['tenant'])
            ]);
        });
    }

    /**
     * Simpan file logo ke storage (Supabase S3 jika credentials tersedia, atau disk public lokal)
     */
    protected function storeLogoFile($file): string
    {
        // 1. Coba upload ke Supabase bucket S3 jika S3 dikonfigurasi dan memiliki Key
        if (config('filesystems.default') === 's3' && !empty(config('filesystems.disks.s3.key'))) {
            try {
                $path = $file->store('logos', 's3');
                return Storage::disk('s3')->url($path);
            } catch (\Throwable $e) {
                Log::warning('Supabase S3 upload logo gagal, fallback ke public disk: ' . $e->getMessage());
            }
        }

        // 2. Default: simpan di public disk lokal
        $path = $file->store('logos', 'public');
        return '/storage/' . $path;
    }
}
