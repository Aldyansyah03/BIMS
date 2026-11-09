<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Menampilkan daftar pengguna (Tutor & Siswa) di bimbel.
     * Khusus Admin Bimbel (filter tenant_id sendiri) atau Super Admin.
     */
    public function index(Request $request)
    {
        $currentUser = $request->user();

        $query = User::query();

        // 1. Isolasi Multi-Tenant (ER-2.2)
        if ($currentUser->role !== 'super_admin') {
            $query->where('tenant_id', $currentUser->tenant_id);
        } elseif ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        // 2. Filter Role (tutor, siswa, admin_bimbel)
        // Mendukung 'student' sebagai alias untuk 'siswa'
        if ($request->filled('role')) {
            $role = $request->role;
            if ($role === 'student') {
                $role = 'siswa';
            }
            $query->where('role', $role);
        }

        // 3. Filter Status Keaktifan Akun
        if ($request->has('is_active')) {
            $isActive = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }
        }

        // 4. Pencarian (nama, email, no telepon)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        // 5. Informasi Kuota Paket Pengguna Bimbel (ER-1.2)
        $quotaInfo = null;
        $tenantId = $currentUser->tenant_id ?? $request->tenant_id;

        if ($tenantId) {
            $subscription = Subscription::with('package')
                ->where('tenant_id', $tenantId)
                ->where('status', 'aktif')
                ->latest()
                ->first();

            $totalTutors = User::where('tenant_id', $tenantId)->where('role', 'tutor')->count();
            $totalSiswa  = User::where('tenant_id', $tenantId)->where('role', 'siswa')->count();
            $totalManaged = $totalTutors + $totalSiswa;
            $maxUsers = $subscription?->package?->max_users;

            $quotaInfo = [
                'current_tutors'  => $totalTutors,
                'current_siswa'   => $totalSiswa,
                'total_users'     => $totalManaged,
                'max_users'       => $maxUsers,
                'package_name'    => $subscription?->package?->name ?? 'Belum ada paket aktif',
                'remaining_quota' => $maxUsers ? max(0, $maxUsers - $totalManaged) : null,
            ];
        }

        return response()->json([
            'success' => true,
            'data'    => $users,
            'quota'   => $quotaInfo,
        ]);
    }

    /**
     * Menambahkan akun pengguna baru secara internal oleh Admin Bimbel (ER-3.1).
     * Memvalidasi batas maksimal pengguna berdasarkan paket langganan (ER-1.2).
     */
    public function store(Request $request)
    {
        $currentUser = $request->user();

        // Tentukan tenant_id
        $tenantId = $currentUser->role === 'super_admin'
            ? $request->tenant_id
            : $currentUser->tenant_id;

        if (!$tenantId) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant ID wajib ditentukan.',
            ], 422);
        }

        // Normalisasi role student -> siswa jika dikirim dari frontend
        if ($request->role === 'student') {
            $request->merge(['role' => 'siswa']);
        }

        // 1. Validasi Input
        $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|max:150|unique:users,email',
            'password' => 'required|string|min:6',
            'role'     => ['required', Rule::in(['tutor', 'siswa'])], // ER-3.1: Admin Bimbel hanya membuat akun tutor/siswa
            'phone'    => 'nullable|string|max:20',
        ]);

        // 2. Validasi Batas Kuota Paket (ER-1.2)
        $subscription = Subscription::with('package')
            ->where('tenant_id', $tenantId)
            ->where('status', 'aktif')
            ->latest()
            ->first();

        if ($subscription && $subscription->package) {
            $maxUsers = $subscription->package->max_users;
            $currentCount = User::where('tenant_id', $tenantId)
                ->whereIn('role', ['tutor', 'siswa'])
                ->count();

            if ($currentCount >= $maxUsers) {
                return response()->json([
                    'success' => false,
                    'message' => "Batas maksimal pengguna untuk paket langganan Anda telah tercapai ({$maxUsers} pengguna). Silakan upgrade paket langganan Anda untuk menambah tutor/siswa baru.",
                    'quota'   => [
                        'current_users' => $currentCount,
                        'max_users'     => $maxUsers,
                    ]
                ], 422);
            }
        }

        // 3. Simpan Akun Pengguna Baru
        $user = User::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password), // Hash adaptif bersalt (ER-2.3)
            'role'      => $request->role,
            'phone'     => $request->phone,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Akun {$user->role} atas nama {$user->name} berhasil dibuat.",
            'data'    => $user
        ], 201);
    }

    /**
     * Menampilkan detail satu akun pengguna.
     */
    public function show(Request $request, $id)
    {
        $currentUser = $request->user();
        $user = User::findOrFail($id);

        // Isolasi Multi-Tenant
        if ($currentUser->role !== 'super_admin' && $user->tenant_id !== $currentUser->tenant_id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Pengguna ini bukan bagian dari bimbel Anda.'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => $user
        ]);
    }

    /**
     * Memperbarui informasi akun pengguna.
     */
    public function update(Request $request, $id)
    {
        $currentUser = $request->user();
        $user = User::findOrFail($id);

        // Isolasi Multi-Tenant
        if ($currentUser->role !== 'super_admin' && $user->tenant_id !== $currentUser->tenant_id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Pengguna ini bukan bagian dari bimbel Anda.'
            ], 403);
        }

        $request->validate([
            'name'     => 'sometimes|required|string|max:100',
            'email'    => ['sometimes', 'required', 'email', 'max:150', Rule::unique('users')->ignore($user->id)],
            'role'     => ['sometimes', 'required', Rule::in(['tutor', 'siswa'])],
            'phone'    => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
        ]);

        $updateData = $request->only(['name', 'email', 'role', 'phone']);

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diperbarui.',
            'data'    => $user
        ]);
    }

    /**
     * Mengubah status aktif/nonaktif akun (is_active).
     * Jika akun dinonaktifkan, user tidak bisa login.
     */
    public function toggleStatus(Request $request, $id)
    {
        $currentUser = $request->user();
        $user = User::findOrFail($id);

        // Isolasi Multi-Tenant
        if ($currentUser->role !== 'super_admin' && $user->tenant_id !== $currentUser->tenant_id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Pengguna ini bukan bagian dari bimbel Anda.'
            ], 403);
        }

        // Cegah admin menonaktifkan akunnya sendiri
        if ($user->id === $currentUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.'
            ], 400);
        }

        // Tentukan nilai status baru
        if ($request->has('is_active')) {
            $newStatus = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
        } elseif ($request->has('active')) {
            $newStatus = filter_var($request->active, FILTER_VALIDATE_BOOLEAN);
        } else {
            $newStatus = !$user->is_active;
        }

        $user->update(['is_active' => $newStatus]);

        $statusText = $newStatus ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'success' => true,
            'message' => "Akun {$user->name} berhasil {$statusText}.",
            'data'    => [
                'id'        => $user->id,
                'name'      => $user->name,
                'is_active' => $user->is_active,
                'active'    => $user->is_active,
            ]
        ]);
    }

    /**
     * Reset kata sandi akun pengguna oleh Admin Bimbel / Super Admin.
     */
    public function resetPassword(Request $request, $id)
    {
        $currentUser = $request->user();
        $user = User::findOrFail($id);

        // Isolasi Multi-Tenant
        if ($currentUser->role !== 'super_admin' && $user->tenant_id !== $currentUser->tenant_id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Pengguna ini bukan bagian dari bimbel Anda.'
            ], 403);
        }

        $request->validate([
            'password' => 'nullable|string|min:6',
        ]);

        $newPassword = $request->filled('password') ? $request->password : 'password123';

        $user->update([
            'password' => Hash::make($newPassword),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Kata sandi untuk akun {$user->name} berhasil direset.",
            'data'    => [
                'id'    => $user->id,
                'email' => $user->email,
            ]
        ]);
    }

    /**
     * Menghapus akun pengguna.
     */
    public function destroy(Request $request, $id)
    {
        $currentUser = $request->user();
        $user = User::findOrFail($id);

        // Isolasi Multi-Tenant
        if ($currentUser->role !== 'super_admin' && $user->tenant_id !== $currentUser->tenant_id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Pengguna ini bukan bagian dari bimbel Anda.'
            ], 403);
        }

        // Cegah admin menghapus dirinya sendiri
        if ($user->id === $currentUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.'
            ], 400);
        }

        $userName = $user->name;
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => "Akun {$userName} berhasil dihapus dari sistem."
        ]);
    }
}
