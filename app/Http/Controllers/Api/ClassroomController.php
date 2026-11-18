<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\User;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    /**
     * Daftar kelas.
     * Tutor hanya melihat kelas yang diampunya, siswa hanya melihat kelas yang diikutinya.
     * Admin Bimbel & Super Admin melihat semua kelas tenant.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Classroom::query()->withCount(['members', 'tutors', 'students']);

        // Filter berdasarkan peran pengguna jika bukan admin
        if ($user->role === 'tutor') {
            $query->whereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id)->where('role_in_class', 'tutor');
            });
        } elseif ($user->role === 'siswa') {
            $query->whereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id)->where('role_in_class', 'siswa');
            });
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->filled('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $classrooms = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data'    => $classrooms,
        ], 200);
    }

    /**
     * Buat kelas baru.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'          => 'required|string|max:100',
            'academic_year' => 'required|string|max:20',
            'is_active'     => 'nullable|boolean',
            'tenant_id'     => 'nullable|exists:tenants,id',
        ]);

        $classroomData = [
            'name'          => $request->name,
            'academic_year' => $request->academic_year,
            'is_active'     => $request->has('is_active') ? $request->boolean('is_active') : true,
        ];

        if (auth()->user()->role === 'super_admin' && $request->filled('tenant_id')) {
            $classroomData['tenant_id'] = $request->tenant_id;
        }

        $classroom = Classroom::create($classroomData);

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dibuat.',
            'data'    => $classroom,
        ], 201);
    }

    /**
     * Detail satu kelas beserta tutor, siswa, dan jadwalnya.
     */
    public function show($id)
    {
        $classroom = Classroom::with([
            'tutors:id,name,email,phone,role',
            'students:id,name,email,phone,role',
            'schedules.subject',
            'schedules.tutor:id,name,email,phone',
        ])->find($id);

        if (!$classroom) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $classroom,
        ], 200);
    }

    /**
     * Update data kelas.
     */
    public function update(Request $request, $id)
    {
        $classroom = Classroom::find($id);

        if (!$classroom) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan.',
            ], 404);
        }

        $request->validate([
            'name'          => 'sometimes|required|string|max:100',
            'academic_year' => 'sometimes|required|string|max:20',
            'is_active'     => 'nullable|boolean',
        ]);

        $classroom->update($request->only(['name', 'academic_year', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'Data kelas berhasil diperbarui.',
            'data'    => $classroom,
        ], 200);
    }

    /**
     * Hapus kelas.
     */
    public function destroy($id)
    {
        $classroom = Classroom::find($id);

        if (!$classroom) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan.',
            ], 404);
        }

        $classroom->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dihapus.',
        ], 200);
    }

    /**
     * Ambil daftar anggota kelas (tutor dan siswa).
     */
    public function getMembers($id)
    {
        $classroom = Classroom::find($id);

        if (!$classroom) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan.',
            ], 404);
        }

        $members = ClassroomMember::with('user:id,name,email,phone,role')
            ->where('classroom_id', $classroom->id)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'classroom_id' => $classroom->id,
                'classroom_name' => $classroom->name,
                'total_members' => $members->count(),
                'members' => $members,
            ],
        ], 200);
    }

    /**
     * Tambah anggota ke dalam kelas (ER-3.1).
     */
    public function addMember(Request $request, $id)
    {
        $classroom = Classroom::find($id);

        if (!$classroom) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan.',
            ], 404);
        }

        $request->validate([
            'user_id'       => 'required|exists:users,id',
            'role_in_class' => 'required|in:tutor,siswa',
        ]);

        $user = User::find($request->user_id);

        // Validasi tenant: User harus berada di tenant yang sama dengan kelas
        if ($classroom->tenant_id && $user->tenant_id !== $classroom->tenant_id) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak terdaftar pada bimbel yang sama.',
            ], 422);
        }

        // Validasi ER-3.1: Kesesuaian role pengguna
        if ($request->role_in_class === 'tutor' && $user->role !== 'tutor') {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna ini bukan berstatus Tutor.',
            ], 422);
        }

        if ($request->role_in_class === 'siswa' && $user->role !== 'siswa') {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna ini bukan berstatus Siswa.',
            ], 422);
        }

        // Cek apakah sudah terdaftar di kelas ini
        $alreadyMember = ClassroomMember::where('classroom_id', $classroom->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($alreadyMember) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna sudah terdaftar di kelas ini.',
            ], 422);
        }

        // Validasi ER-3.1: Batas maksimal siswa per kelas (maksimal 30 siswa per kelas)
        if ($request->role_in_class === 'siswa') {
            $studentCount = ClassroomMember::where('classroom_id', $classroom->id)
                ->where('role_in_class', 'siswa')
                ->count();

            if ($studentCount >= 30) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kapasitas maksimal siswa untuk kelas ini telah tercapai (maksimal 30 siswa).',
                ], 422);
            }
        }

        $member = ClassroomMember::create([
            'classroom_id'  => $classroom->id,
            'user_id'       => $user->id,
            'role_in_class' => $request->role_in_class,
            'joined_at'     => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Anggota berhasil ditambahkan ke kelas.',
            'data'    => $member->load('user:id,name,email,phone,role'),
        ], 201);
    }

    /**
     * Hapus anggota dari kelas.
     */
    public function removeMember($id, $userId)
    {
        $classroom = Classroom::find($id);

        if (!$classroom) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan.',
            ], 404);
        }

        $member = ClassroomMember::where('classroom_id', $classroom->id)
            ->where('user_id', $userId)
            ->first();

        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak terdaftar dalam kelas ini.',
            ], 404);
        }

        $member->delete();

        return response()->json([
            'success' => true,
            'message' => 'Anggota berhasil dikeluarkan dari kelas.',
        ], 200);
    }
}
