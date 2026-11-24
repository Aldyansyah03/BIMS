<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\ExamResult;
use App\Models\Material;
use App\Models\Schedule;
use Illuminate\Http\Request;

/**
 * StudentHelperController
 *
 * Menyediakan endpoint tambahan yang dibutuhkan oleh halaman StudentHome.jsx:
 * - Daftar kelas yang diikuti siswa (GET /student/classes)
 * - Jadwal hari ini (GET /student/schedule/today)
 * - Nilai ujian terbaru (GET /student/scores)
 *
 * Semua endpoint terlindungi oleh middleware auth:sanctum + role:siswa
 * yang sudah dipasang di routes/api.php.
 */
class StudentHelperController extends Controller
{
    /**
     * GET /api/student/classes
     * Mengembalikan kelas yang diikuti siswa beserta info tutor dan jumlah materi.
     */
    public function myClasses(Request $request)
    {
        $user = auth()->user();

        $classrooms = Classroom::whereHas('members', function ($q) use ($user) {
            $q->where('user_id', $user->id)->where('role_in_class', 'siswa');
        })->with(['tutors:id,name', 'schedules.subject:id,name'])->get();

        $data = $classrooms->map(function ($cls) {
            $tutorName = $cls->tutors->first()?->name ?? null;
            $materialCount = \App\Models\Material::where('classroom_id', $cls->id)->count();
            return [
                'id'             => $cls->id,
                'name'           => $cls->name,
                'academic_year'  => $cls->academic_year,
                'tutor_name'     => $tutorName,
                'material_count' => $materialCount,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/student/schedule/today
     * Mengembalikan jadwal hari ini untuk siswa berdasarkan kelas yang diikutinya.
     */
    public function todaySchedule(Request $request)
    {
        $user = auth()->user();
        $today = now()->dayOfWeekIso; // 1=Senin, 7=Minggu (ISO 8601)

        $classroomIds = $user->classrooms()
            ->wherePivot('role_in_class', 'siswa')
            ->pluck('classrooms.id');

        $schedules = Schedule::with(['classroom:id,name', 'subject:id,name', 'tutor:id,name'])
            ->whereIn('classroom_id', $classroomIds)
            ->where('day_of_week', $today)
            ->orderBy('start_time')
            ->get();

        $data = $schedules->map(function ($s) {
            return [
                'id'          => $s->id,
                'start_time'  => substr($s->start_time, 0, 5),
                'end_time'    => substr($s->end_time, 0, 5),
                'subject'     => $s->subject?->name ?? 'Umum',
                'class_name'  => $s->classroom?->name ?? '—',
                'tutor_name'  => $s->tutor?->name ?? '—',
                'type'        => 'class',
                'room_or_link'=> $s->room_or_link,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/student/scores?limit=5
     * Mengembalikan nilai ujian terbaru siswa.
     */
    public function myScores(Request $request)
    {
        $user  = auth()->user();
        $limit = (int) $request->query('limit', 5);

        $results = ExamResult::where('user_id', $user->id)
            ->with('exam:id,title')
            ->orderBy('graded_at', 'desc')
            ->take($limit)
            ->get();

        $data = $results->map(function ($r) {
            return [
                'id'          => $r->id,
                'result_id'   => $r->id,
                'exam_title'  => $r->exam?->title ?? '—',
                'submitted_at'=> $r->graded_at?->toIso8601String(),
                'score'       => (float) $r->score,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }
}
