<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamResult;
use App\Models\Schedule;
use App\Models\StudentAnswer;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExamResultController extends Controller
{
    /**
     * Detail hasil ujian siswa untuk halaman Result.jsx.
     * Sesuai format frontend: examService.js -> getExamResult(resultId)
     */
    public function getStudentResult($resultId)
    {
        $user = auth()->user();

        $result = ExamResult::with(['exam.classroom', 'attempt'])->find($resultId);

        if (!$result) {
            return response()->json([
                'success' => false,
                'message' => 'Hasil ujian tidak ditemukan.',
            ], 404);
        }

        // Siswa hanya boleh melihat hasil miliknya sendiri (kecuali tutor/admin)
        if ($user->role === 'siswa' && $result->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke hasil ujian ini.',
            ], 403);
        }

        $exam = $result->exam;
        $attempt = $result->attempt;

        // Ambil butir soal dan jawaban siswa
        $questions = $exam->questions()->orderBy('id', 'asc')->get();
        $answers = StudentAnswer::where('attempt_id', $attempt->id)->get()->keyBy('question_id');

        $questionResults = [];
        $correct = 0;
        $wrong = 0;
        $blank = 0;

        foreach ($questions as $index => $q) {
            $ans = $answers->get($q->id);
            if (!$ans || empty($ans->option_id)) {
                $status = 'blank';
                $blank++;
            } elseif ($ans->is_correct) {
                $status = 'correct';
                $correct++;
            } else {
                $status = 'wrong';
                $wrong++;
            }

            $questionResults[] = [
                'number' => $index + 1,
                'status' => $status,
            ];
        }

        // Durasi yang terpakai
        $durationUsed = 0;
        if ($attempt->started_at && $attempt->finished_at) {
            $durationUsed = $attempt->started_at->diffInSeconds($attempt->finished_at);
        }

        // Riwayat / Leaderboard kelas untuk ujian ini
        $history = ExamResult::where('exam_id', $exam->id)
            ->with('user:id,name')
            ->orderBy('score', 'desc')
            ->take(10)
            ->get()
            ->map(function ($item) {
                return [
                    'name'  => $item->user?->name ?? 'Siswa',
                    'score' => (float) $item->score,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'id'                    => $result->id,
                'exam_title'            => $exam->title,
                'subject'               => $exam->classroom?->name ?? 'Kelas',
                'submitted_at'          => $result->graded_at ? $result->graded_at->toIso8601String() : now()->toIso8601String(),
                'duration_used_seconds' => $durationUsed,
                'duration_seconds'      => $exam->duration_minutes * 60,
                'score'                 => (float) $result->score,
                'correct'               => $correct,
                'wrong'                 => $wrong,
                'blank'                 => $blank,
                'total'                 => $result->total_questions,
                'question_results'      => $questionResults,
                'history'               => $history,
            ],
        ], 200);
    }

    /**
     * Riwayat seluruh hasil ujian yang pernah dikerjakan oleh siswa yang sedang login.
     */
    public function getStudentHistory()
    {
        $user = auth()->user();

        $results = ExamResult::where('user_id', $user->id)
            ->with('exam:id,title,classroom_id')
            ->orderBy('graded_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $results,
        ], 200);
    }

    /**
     * Daftar siswa + nilai ujian di kelas tertentu (Tutor / Admin).
     * Sesuai format tutorService.js -> getClassResults(classId, examId)
     */
    public function getClassResults(Request $request, $classId)
    {
        $examId = $request->query('exam_id');
        $classroom = Classroom::find($classId);

        if (!$classroom) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan.',
            ], 404);
        }

        // Ambil seluruh siswa di kelas
        $students = $classroom->students()->select('users.id', 'users.name', 'users.email')->get();

        $resultsQuery = ExamResult::whereIn('user_id', $students->pluck('id'));
        if ($examId) {
            $resultsQuery->where('exam_id', $examId);
        }
        $examResults = $resultsQuery->get()->keyBy('user_id');

        $data = $students->map(function ($student) use ($examResults) {
            $res = $examResults->get($student->id);
            return [
                'id'     => $student->id,
                'name'   => $student->name,
                'email'  => $student->email,
                'status' => $res ? 'submitted' : 'not_taken',
                'score'  => $res ? (float) $res->score : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
        ], 200);
    }

    /**
     * Export rekap nilai kelas ke file CSV.
     * Sesuai format tutorService.js -> exportResults(classId, examId)
     */
    public function exportClassResults(Request $request, $classId): StreamedResponse
    {
        $examId = $request->query('exam_id');
        $classroom = Classroom::find($classId);

        $students = $classroom ? $classroom->students()->get() : collect();
        $resultsQuery = ExamResult::whereIn('user_id', $students->pluck('id'));
        if ($examId) {
            $resultsQuery->where('exam_id', $examId);
        }
        $examResults = $resultsQuery->get()->keyBy('user_id');

        $fileName = 'Rekap_Nilai_' . ($classroom ? str_replace(' ', '_', $classroom->name) : 'Kelas') . '_' . date('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($students, $examResults) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['No', 'Nama Siswa', 'Email', 'Status Pengerjaan', 'Nilai Skor']);

            foreach ($students as $index => $student) {
                $res = $examResults->get($student->id);
                fputcsv($handle, [
                    $index + 1,
                    $student->name,
                    $student->email,
                    $res ? 'Selesai' : 'Belum Mengerjakan',
                    $res ? $res->score : '-',
                ]);
            }
            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }

    /**
     * Ringkasan Dashboard Admin Bimbel.
     * Sesuai format adminService.js -> getDashboard()
     */
    public function getAdminDashboard()
    {
        $user = auth()->user();
        $tenantId = $user->tenant_id;

        // 1. Data Paket / Langganan
        $subscription = Subscription::with('package')
            ->where('tenant_id', $tenantId)
            ->where('status', 'aktif')
            ->latest()
            ->first();

        $usersCount = User::where('tenant_id', $tenantId)->count();
        $limit = $subscription?->package?->max_users ?? 50;

        $activeUntil = now()->addMonth()->toDateString();
        if ($subscription && $subscription->end_date) {
            $activeUntil = is_string($subscription->end_date)
                ? substr($subscription->end_date, 0, 10)
                : $subscription->end_date->toDateString();
        }

        $plan = [
            'name'          => $subscription?->package?->name ?? 'Paket Trial Bimbel',
            'billing_cycle' => 'Bulanan',
            'active_until'  => $activeUntil,
            'users_used'    => $usersCount,
            'users_limit'   => $limit,
        ];

        // 2. KPIs
        $studentsCount = User::where('tenant_id', $tenantId)->where('role', 'siswa')->count();
        $tutorsCount   = User::where('tenant_id', $tenantId)->where('role', 'tutor')->count();
        $classesCount  = Classroom::where('tenant_id', $tenantId)->count();
        $avgScore      = ExamResult::where('tenant_id', $tenantId)->avg('score');

        $kpis = [
            'students'  => $studentsCount,
            'tutors'    => $tutorsCount,
            'classes'   => $classesCount,
            'avg_score' => $avgScore ? round((float) $avgScore, 1) : 0,
        ];

        // 3. Week Sessions
        $schedules = Schedule::with(['classroom:id,name', 'subject:id,name', 'tutor:id,name'])
            ->where('tenant_id', $tenantId)
            ->get();

        $weekDays = [];
        $dayNames = [1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu', 7 => 'Minggu'];

        foreach ($dayNames as $num => $dayName) {
            $daySessions = $schedules->where('day_of_week', $num)->values()->map(function ($s) {
                return [
                    'id'         => $s->id,
                    'time_start' => substr($s->start_time, 0, 5),
                    'time_end'   => substr($s->end_time, 0, 5),
                    'subject'    => $s->subject?->name ?? 'Umum',
                    'class_name' => $s->classroom?->name ?? 'Kelas',
                    'tutor_name' => $s->tutor?->name ?? 'Tutor',
                    'color'      => 'blue',
                ];
            });

            $weekDays[] = [
                'label'    => $dayName,
                'date'     => now()->startOfWeek()->addDays($num - 1)->format('d M'),
                'sessions' => $daySessions,
            ];
        }

        // 4. Performa Kelas
        $classrooms = Classroom::where('tenant_id', $tenantId)
            ->with(['tutors:id,name', 'students:id'])
            ->get();

        $performance = $classrooms->map(function ($cls) use ($tenantId) {
            $examIds = Exam::where('classroom_id', $cls->id)->pluck('id');
            $classAvg = ExamResult::whereIn('exam_id', $examIds)->avg('score');

            return [
                'class_id'      => $cls->id,
                'class_name'    => $cls->name,
                'tutor_name'    => $cls->tutors->first()?->name ?? 'Belum Ditentukan',
                'student_count' => $cls->students->count(),
                'exam_count'    => $examIds->count(),
                'avg_score'     => $classAvg ? round((float) $classAvg, 1) : 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'plan'        => $plan,
                'kpis'        => $kpis,
                'week'        => [
                    'range_label' => now()->startOfWeek()->format('d M') . ' - ' . now()->endOfWeek()->format('d M Y'),
                    'days'        => $weekDays,
                ],
                'performance' => $performance,
            ],
        ], 200);
    }

    /**
     * Export Performa Kelas ke CSV.
     */
    public function exportPerformance(): StreamedResponse
    {
        $user = auth()->user();
        $tenantId = $user->tenant_id;
        $classrooms = Classroom::where('tenant_id', $tenantId)->with(['tutors:id,name', 'students:id'])->get();

        $fileName = 'Performa_Kelas_' . date('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($classrooms, $tenantId) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID Kelas', 'Nama Kelas', 'Tutor Pengampu', 'Jumlah Siswa', 'Jumlah Ujian', 'Rata-rata Skor']);

            foreach ($classrooms as $cls) {
                $examIds = Exam::where('classroom_id', $cls->id)->pluck('id');
                $classAvg = ExamResult::whereIn('exam_id', $examIds)->avg('score');

                fputcsv($handle, [
                    $cls->id,
                    $cls->name,
                    $cls->tutors->first()?->name ?? '-',
                    $cls->students->count(),
                    $examIds->count(),
                    $classAvg ? round((float) $classAvg, 1) : '0',
                ]);
            }
            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }
}
