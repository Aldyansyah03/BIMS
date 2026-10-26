<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;   // <--- INI YANG KURANG
use Illuminate\Support\Facades\Hash;
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

        // 3. Cek status tenant (jika bukan super admin)
        if ($user->tenant && $user->tenant->status !== 'aktif') {
            return response()->json([
                'success' => false,
                'message' => 'Layanan bimbel Anda sedang ' . $user->tenant->status . '.'
            ], 403);
        }

        // 4. Generate Sanctum Token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data'    => [
                'token' => $token,
                'user'  => [
                    'id'          => $user->id,
                    'name'        => $user->name,
                    'email'       => $user->email,
                    'role'        => $user->role,
                    'tenant_id'   => $user->tenant_id,
                    'tenant_name' => $user->tenant?->name,
                ]
            ]
        ], 200);
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => $request->user()->load('tenant')
        ]);
    }

    public function logout(Request $request)
    {
        // Hapus token saat ini
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.'
        ]);
    }

    //register
    public function register(Request $request)
    {
        // 1. Validasi input dari user
        $request->validate([
            'tenant_name' => 'required|string|max:150',
            'name'        => 'required|string|max:100',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'required|string|min:6|confirmed', // butuh 'password_confirmation'
            'phone'       => 'nullable|string|max:20',
        ]);

        // 2. Simpan ke database Supabase
        return DB::transaction(function () use ($request) {
            // Buat slug otomatis dari nama bimbel (misal "Bimbel Juara" -> "bimbel-juara")
            $slug = Str::slug($request->tenant_name);
            $originalSlug = $slug;
            $count = 1;
            while (Tenant::where('slug', $slug)->exists()) {
                $slug = "{$originalSlug}-{$count}";
                $count++;
            }

            // Simpan Data Bimbel (Tenant)
            $tenant = Tenant::create([
                'name'   => $request->tenant_name,
                'slug'   => $slug,
                'status' => 'aktif', // kita buat 'aktif' dulu agar langsung bisa di-test
            ]);

            // Simpan Akun Admin Bimbel
            $user = User::create([
                'tenant_id' => $tenant->id,
                'name'      => $request->name,
                'email'     => $request->email,
                'password'  => Hash::make($request->password),
                'role'      => 'admin_bimbel',
                'phone'     => $request->phone,
                'is_active' => true,
            ]);

            // Buat token otomatis
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Pendaftaran bimbel dan akun admin berhasil!',
                'data'    => [
                    'token'  => $token,
                    'tenant' => [
                        'id'   => $tenant->id,
                        'name' => $tenant->name,
                        'slug' => $tenant->slug,
                    ],
                    'user'   => [
                        'id'    => $user->id,
                        'name'  => $user->name,
                        'email' => $user->email,
                        'role'  => $user->role,
                    ]
                ]
            ], 201);
        });
    }
}