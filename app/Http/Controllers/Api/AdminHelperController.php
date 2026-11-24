<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * AdminHelperController
 *
 * Menyediakan endpoint tambahan yang dibutuhkan oleh halaman AdminClasses.jsx
 * dan AdminDashboard.jsx (tambah jadwal, daftar tutor, cari siswa, dll.).
 *
 * Semua endpoint terlindungi oleh middleware auth:sanctum + role:admin_bimbel,super_admin
 * yang sudah dipasang di routes/api.php.
 */
class AdminHelperController extends Controller
{
    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Dapatkan tenant_id dari pengguna yang login (atau null untuk super_admin).
     */
    protected function tenantId(): ?int
    {
        $user = auth()->user();
        return $user->role === 'super_admin' ? null : (int) $user->tenant_id;
    }

    // ── Daftar tutor milik tenant ─────────────────────────────────────────────

    /**
     * GET /api/admin/tutors
     * Mengembalikan daftar semua tutor yang terdaftar di tenant admin yang login.
     * Digunakan untuk dropdown pilih tutor di AdminClasses & AdminDashboard.
     */
    public function tutors(Request $request)
    {
        $tenantId = $this->tenantId();
        $query = User::where('role', 'tutor')->where('is_active', true);
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($sq) use ($q) {
                $sq->where('name', 'like', "%{$q}%")
                   ->orWhere('email', 'like', "%{$q}%");
            });
        }

        return response()->json([
            'success' => true,
            'data'    => $query->select('id', 'name', 'email', 'phone', 'role')->orderBy('name')->get(),
        ]);
    }

    // ── Cari siswa untuk picker di AdminClasses ───────────────────────────────

    /**
     * GET /api/admin/students/search?q=…
     * Mencari siswa dari tenant yang sama, mengembalikan id, name, email.
     * Digunakan oleh komponen Add Students picker di AdminClasses.jsx.
     */
    public function searchStudents(Request $request)
    {
        $tenantId = $this->tenantId();
        $q = $request->get('q', '');

        $query = User::where('role', 'siswa')->where('is_active', true);
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        if ($q !== '') {
            $query->where(function ($sq) use ($q) {
                $sq->where('name', 'like', "%{$q}%")
                   ->orWhere('email', 'like', "%{$q}%");
            });
        }

        return response()->json([
            'success' => true,
            'data'    => $query->select('id', 'name', 'email')->orderBy('name')->limit(50)->get(),
        ]);
    }

    // ── Anggota kelas ─────────────────────────────────────────────────────────

    /**
     * GET /api/admin/classes/:id/students
     * Mengembalikan daftar siswa yang terdaftar di kelas.
     */
    public function classStudents($id)
    {
        $classroom = Classroom::find($id);
        if (!$classroom) {
            return response()->json(['success' => false, 'message' => 'Kelas tidak ditemukan.'], 404);
        }

        $students = $classroom->students()
            ->select('users.id', 'users.name', 'users.email', 'users.is_active')
            ->get();

        return response()->json(['success' => true, 'data' => $students]);
    }

    /**
     * GET /api/admin/classes/:id/tutors
     * Mengembalikan daftar tutor yang mengajar di kelas.
     */
    public function classTutors($id)
    {
        $classroom = Classroom::find($id);
        if (!$classroom) {
            return response()->json(['success' => false, 'message' => 'Kelas tidak ditemukan.'], 404);
        }

        $tutors = $classroom->tutors()
            ->select('users.id', 'users.name', 'users.email')
            ->get();

        return response()->json(['success' => true, 'data' => $tutors]);
    }

    /**
     * POST /api/admin/classes/:id/students
     * Menambahkan beberapa siswa sekaligus ke kelas.
     * Body: { student_ids: [1, 2, 3] }
     */
    public function addStudentsToClass(Request $request, $id)
    {
        $classroom = Classroom::find($id);
        if (!$classroom) {
            return response()->json(['success' => false, 'message' => 'Kelas tidak ditemukan.'], 404);
        }

        $request->validate([
            'student_ids'   => 'required|array|min:1',
            'student_ids.*' => 'integer|exists:users,id',
        ]);

        $tenantId = $this->tenantId();
        $added = 0;
        $skipped = 0;

        foreach ($request->student_ids as $userId) {
            $user = User::find($userId);
            if (!$user) { $skipped++; continue; }

            // Validasi tenant & role
            if ($tenantId && $user->tenant_id !== $tenantId) { $skipped++; continue; }
            if ($user->role !== 'siswa') { $skipped++; continue; }

            // Cek duplikat
            $exists = ClassroomMember::where('classroom_id', $classroom->id)
                ->where('user_id', $userId)->exists();
            if ($exists) { $skipped++; continue; }

            // Batas 30 siswa per kelas (ER-3.1)
            $count = ClassroomMember::where('classroom_id', $classroom->id)
                ->where('role_in_class', 'siswa')->count();
            if ($count >= 30) break;

            ClassroomMember::create([
                'classroom_id'  => $classroom->id,
                'user_id'       => $userId,
                'role_in_class' => 'siswa',
                'joined_at'     => now(),
            ]);
            $added++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$added} siswa berhasil ditambahkan ke kelas, {$skipped} dilewati.",
            'added'   => $added,
        ]);
    }

    /**
     * POST /api/admin/classes/:id/tutors
     * Menugaskan satu tutor ke kelas.
     * Body: { tutor_id: 5 }
     */
    public function addTutorToClass(Request $request, $id)
    {
        $classroom = Classroom::find($id);
        if (!$classroom) {
            return response()->json(['success' => false, 'message' => 'Kelas tidak ditemukan.'], 404);
        }

        $request->validate(['tutor_id' => 'required|integer|exists:users,id']);

        $tutor = User::find($request->tutor_id);
        $tenantId = $this->tenantId();

        if ($tutor->role !== 'tutor') {
            return response()->json(['success' => false, 'message' => 'Pengguna ini bukan Tutor.'], 422);
        }
        if ($tenantId && $tutor->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Tutor tidak terdaftar di bimbel Anda.'], 422);
        }

        $exists = ClassroomMember::where('classroom_id', $classroom->id)
            ->where('user_id', $tutor->id)->exists();
        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Tutor ini sudah terdaftar di kelas.'], 422);
        }

        ClassroomMember::create([
            'classroom_id'  => $classroom->id,
            'user_id'       => $tutor->id,
            'role_in_class' => 'tutor',
            'joined_at'     => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Tutor {$tutor->name} berhasil ditambahkan ke kelas.",
        ]);
    }

    /**
     * DELETE /api/admin/classes/:id/tutors/:tutorId
     * Melepaskan tutor dari kelas.
     */
    public function removeTutorFromClass($id, $tutorId)
    {
        $member = ClassroomMember::where('classroom_id', $id)
            ->where('user_id', $tutorId)
            ->where('role_in_class', 'tutor')
            ->first();

        if (!$member) {
            return response()->json(['success' => false, 'message' => 'Tutor tidak ditemukan di kelas ini.'], 404);
        }

        $member->delete();

        return response()->json(['success' => true, 'message' => 'Tutor berhasil dilepas dari kelas.']);
    }

    // ── Jadwal (Sessions) ─────────────────────────────────────────────────────

    /**
     * POST /api/admin/sessions
     * Membuat jadwal baru dari halaman AdminDashboard.
     * Body: { class_id, tutor_id, subject_id?, day_of_week, time_start, time_end, room_or_link? }
     *
     * Jika subject_id tidak dikirim, akan membuat/memakai subject "Umum" milik tenant.
     */
    public function createSession(Request $request)
    {
        $request->validate([
            'class_id'     => 'required|integer|exists:classrooms,id',
            'tutor_id'     => 'required|integer|exists:users,id',
            'subject_id'   => 'nullable|integer|exists:subjects,id',
            'day_of_week'  => 'required|integer|between:1,7',
            'time_start'   => 'required|date_format:H:i',
            'time_end'     => 'required|date_format:H:i|after:time_start',
            'room_or_link' => 'nullable|string|max:255',
        ]);

        $tenantId = $this->tenantId();
        $tutor = User::find($request->tutor_id);

        if (!$tutor || $tutor->role !== 'tutor') {
            return response()->json(['success' => false, 'message' => 'Pengguna yang dipilih bukan Tutor.'], 422);
        }

        // Gunakan subject_id dari request; jika kosong, gunakan subject "Umum" tenant
        $subjectId = $request->subject_id;
        if (!$subjectId) {
            $subject = Subject::where('name', 'Umum')
                ->when($tenantId, fn($q) => $q->where('tenant_id', $tenantId))
                ->first();
            if (!$subject) {
                $subject = Subject::create([
                    'name'      => 'Umum',
                    'code'      => 'UMM',
                    'tenant_id' => $tenantId,
                ]);
            }
            $subjectId = $subject->id;
        }

        // Validasi bentrok tutor
        $tutorClash = Schedule::where('tutor_id', $request->tutor_id)
            ->where('day_of_week', $request->day_of_week)
            ->where(function ($q) use ($request) {
                $q->where('start_time', '<', $request->time_end)
                  ->where('end_time', '>', $request->time_start);
            })->with('classroom:id,name')->first();

        if ($tutorClash) {
            return response()->json([
                'success' => false,
                'message' => "Jadwal bentrok: Tutor {$tutor->name} sudah mengajar di {$tutorClash->classroom->name} pada jam tersebut.",
                'clash'   => [
                    'message'          => "Tutor {$tutor->name} sudah mengajar di {$tutorClash->classroom->name} ({$tutorClash->start_time} – {$tutorClash->end_time}).",
                    'suggestion_start' => $tutorClash->end_time,
                ],
            ], 422);
        }

        // Validasi bentrok kelas
        $classClash = Schedule::where('classroom_id', $request->class_id)
            ->where('day_of_week', $request->day_of_week)
            ->where(function ($q) use ($request) {
                $q->where('start_time', '<', $request->time_end)
                  ->where('end_time', '>', $request->time_start);
            })->with('subject:id,name')->first();

        if ($classClash) {
            return response()->json([
                'success' => false,
                'message' => "Jadwal bentrok: Kelas sudah memiliki sesi pada jam tersebut.",
                'clash'   => [
                    'message'          => "Kelas sudah ada sesi {$classClash->subject->name} ({$classClash->start_time} – {$classClash->end_time}).",
                    'suggestion_start' => $classClash->end_time,
                ],
            ], 422);
        }

        $schedule = Schedule::create([
            'tenant_id'    => $tenantId,
            'classroom_id' => $request->class_id,
            'subject_id'   => $subjectId,
            'tutor_id'     => $request->tutor_id,
            'day_of_week'  => $request->day_of_week,
            'start_time'   => $request->time_start,
            'end_time'     => $request->time_end,
            'room_or_link' => $request->room_or_link,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sesi jadwal berhasil ditambahkan.',
            'data'    => $schedule->load(['classroom:id,name', 'subject:id,name', 'tutor:id,name']),
        ], 201);
    }

    /**
     * DELETE /api/admin/sessions/:id
     * Menghapus satu sesi jadwal.
     */
    public function deleteSession($id)
    {
        $schedule = Schedule::find($id);
        if (!$schedule) {
            return response()->json(['success' => false, 'message' => 'Jadwal tidak ditemukan.'], 404);
        }

        $tenantId = $this->tenantId();
        if ($tenantId && $schedule->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $schedule->delete();

        return response()->json(['success' => true, 'message' => 'Sesi jadwal berhasil dihapus.']);
    }
}
