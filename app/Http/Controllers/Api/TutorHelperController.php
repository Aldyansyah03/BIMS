<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Exam;
use Illuminate\Http\Request;

/**
 * TutorHelperController
 *
 * Menyediakan endpoint tambahan yang dibutuhkan oleh halaman TutorClass.jsx:
 * - Daftar kelas tutor (GET /tutor/classes)
 * - Ujian per kelas  (GET /tutor/classes/:classId/exams)
 * - Buat ujian       (POST /tutor/classes/:classId/exams)
 * - Update ujian     (PUT /tutor/exams/:examId)
 * - Publish ujian    (POST /tutor/exams/:examId/publish)
 *
 * Semua endpoint terlindungi oleh middleware auth:sanctum + role:tutor,admin_bimbel,super_admin
 * yang sudah dipasang di routes/api.php.
 */
class TutorHelperController extends Controller
{
    /**
     * GET /api/tutor/classes
     * Kelas yang diampu tutor.
     */
    public function myClasses(Request $request)
    {
        $user = auth()->user();

        $query = Classroom::query()->withCount(['students']);

        if ($user->role === 'tutor') {
            $query->whereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id)->where('role_in_class', 'tutor');
            });
        }
        // admin_bimbel & super_admin melihat semua kelas tenant (sudah difilter oleh BelongsToTenant trait)

        $classrooms = $query->with(['tutors:id,name', 'schedules.subject:id,name'])
            ->orderBy('name')
            ->get();

        $data = $classrooms->map(function ($cls) {
            $scheduleLabel = null;
            if ($cls->schedules->isNotEmpty()) {
                $days = [1 => 'Sen', 2 => 'Sel', 3 => 'Rab', 4 => 'Kam', 5 => 'Jum', 6 => 'Sab', 7 => 'Min'];
                $scheduleLabel = $cls->schedules->map(function ($s) use ($days) {
                    return ($days[$s->day_of_week] ?? '') . ' ' . substr($s->start_time, 0, 5);
                })->unique()->take(2)->implode(', ');
            }

            return [
                'id'             => $cls->id,
                'name'           => $cls->name,
                'academic_year'  => $cls->academic_year,
                'student_count'  => $cls->students_count,
                'schedule_label' => $scheduleLabel,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/tutor/classes/:classId/exams
     * Ujian yang ada di kelas.
     * Format respons disesuaikan dengan yang diharapkan TutorClass.jsx.
     */
    public function classExams(Request $request, $classId)
    {
        $user = auth()->user();

        $classroom = Classroom::find($classId);
        if (!$classroom) {
            return response()->json(['success' => false, 'message' => 'Kelas tidak ditemukan.'], 404);
        }

        $query = Exam::withCount(['questions', 'attempts'])
            ->where('classroom_id', $classId);

        if ($user->role === 'tutor') {
            $query->where('tutor_id', $user->id);
        }

        $exams = $query->orderBy('created_at', 'desc')->get();

        $data = $exams->map(function ($exam) {
            $status = 'draft';
            if ($exam->is_published) {
                $status = now()->isAfter($exam->end_time) ? 'closed' : 'published';
            }

            return [
                'id'               => $exam->id,
                'classroom_id'     => $exam->classroom_id,
                'title'            => $exam->title,
                'duration_minutes' => $exam->duration_minutes,
                'opens_at'         => $exam->start_time?->toIso8601String(),
                'closes_at'        => $exam->end_time?->toIso8601String(),
                'is_published'     => $exam->is_published,
                'status'           => $status,
                'question_count'   => $exam->questions_count,
                'attempts_count'   => $exam->attempts_count,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * POST /api/tutor/classes/:classId/exams
     * Membuat ujian baru di kelas.
     * Body: { title, duration_minutes, opens_at, closes_at }
     */
    public function createExam(Request $request, $classId)
    {
        $classroom = Classroom::find($classId);
        if (!$classroom) {
            return response()->json(['success' => false, 'message' => 'Kelas tidak ditemukan.'], 404);
        }

        $request->validate([
            'title'            => 'required|string|max:200',
            'duration_minutes' => 'required|integer|min:1',
            'opens_at'         => 'nullable|date',
            'closes_at'        => 'nullable|date|after:opens_at',
            'max_attempts'     => 'nullable|integer|min:1|max:10',
        ]);

        $user = auth()->user();

        $exam = Exam::create([
            'tenant_id'        => $classroom->tenant_id,
            'classroom_id'     => $classId,
            'tutor_id'         => $user->role === 'tutor' ? $user->id : ($request->tutor_id ?? $user->id),
            'title'            => $request->title,
            'start_time'       => $request->opens_at ?? now()->addDay(),
            'end_time'         => $request->closes_at ?? now()->addDays(7),
            'duration_minutes' => $request->duration_minutes,
            'is_published'     => false,
        ]);

        \App\Models\ActivityLog::record('CREATE_EXAM', [
            'exam_id'      => $exam->id,
            'classroom_id' => $classId,
            'title'        => $exam->title,
        ], $user);

        return response()->json([
            'success' => true,
            'message' => 'Ujian baru berhasil dibuat.',
            'data'    => [
                'id'               => $exam->id,
                'classroom_id'     => $exam->classroom_id,
                'title'            => $exam->title,
                'duration_minutes' => $exam->duration_minutes,
                'opens_at'         => $exam->start_time?->toIso8601String(),
                'closes_at'        => $exam->end_time?->toIso8601String(),
                'is_published'     => false,
                'status'           => 'draft',
                'question_count'   => 0,
            ],
        ], 201);
    }

    /**
     * PUT /api/tutor/exams/:examId
     * Update metadata ujian.
     */
    public function updateExam(Request $request, $examId)
    {
        $exam = Exam::find($examId);
        if (!$exam) {
            return response()->json(['success' => false, 'message' => 'Ujian tidak ditemukan.'], 404);
        }

        $request->validate([
            'title'            => 'sometimes|required|string|max:200',
            'duration_minutes' => 'sometimes|required|integer|min:1',
            'opens_at'         => 'nullable|date',
            'closes_at'        => 'nullable|date',
            'max_attempts'     => 'nullable|integer|min:1|max:10',
        ]);

        $exam->update([
            'title'            => $request->input('title', $exam->title),
            'duration_minutes' => $request->input('duration_minutes', $exam->duration_minutes),
            'start_time'       => $request->input('opens_at', $exam->start_time),
            'end_time'         => $request->input('closes_at', $exam->end_time),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ujian berhasil diperbarui.',
            'data'    => $exam->fresh(),
        ]);
    }

    /**
     * POST /api/tutor/exams/:examId/publish
     * Menerbitkan ujian ke siswa (ER-5.1).
     */
    public function publishExam(Request $request, $examId)
    {
        $exam = Exam::withCount('questions')->find($examId);
        if (!$exam) {
            return response()->json(['success' => false, 'message' => 'Ujian tidak ditemukan.'], 404);
        }

        if ($exam->questions_count === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian belum bisa diterbitkan. Tambahkan minimal satu soal terlebih dahulu.',
            ], 422);
        }

        $exam->is_published = true;
        $exam->save();

        \App\Models\ActivityLog::record('PUBLISH_EXAM', [
            'exam_id' => $exam->id,
            'title'   => $exam->title,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ujian berhasil diterbitkan ke siswa.',
            'data'    => [
                'id'           => $exam->id,
                'is_published' => true,
                'status'       => 'published',
            ],
        ]);
    }
}
