<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamResult;
use App\Models\Question;
use App\Models\StudentAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentExamController extends Controller
{
    /**
     * Daftar ujian yang tersedia untuk siswa di kelas-kelas yang diikutinya.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Ambil ID kelas yang diikuti oleh siswa
        $classrooms = $user->classrooms()->wherePivot('role_in_class', 'siswa')->get();
        $classroomIds = $classrooms->pluck('id');

        $exams = Exam::with(['classroom:id,name', 'tutor:id,name'])
            ->whereIn('classroom_id', $classroomIds)
            ->where('is_published', true)
            ->withCount('questions')
            ->orderBy('start_time', 'asc')
            ->get();

        // Lengkapi dengan informasi status pengerjaan siswa
        $exams->transform(function ($exam) use ($user) {
            $attempt = ExamAttempt::where('exam_id', $exam->id)
                ->where('user_id', $user->id)
                ->with('result')
                ->first();

            $exam->attempt_status = $attempt ? $attempt->status : 'not_started';
            $exam->started_at     = $attempt?->started_at;
            $exam->deadline_at    = $attempt?->deadline_at;
            $exam->score          = $attempt?->result?->score;

            return $exam;
        });

        return response()->json([
            'success' => true,
            'data'    => $exams,
        ], 200);
    }

    /**
     * Memulai ujian CBT (Maksimal 1 attempt per siswa - ER-5.2 & ER-5.3).
     */
    public function start(Request $request, $id)
    {
        $user = auth()->user();
        $exam = Exam::with('classroom')->find($id);

        if (!$exam) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian tidak ditemukan.',
            ], 404);
        }

        if (!$exam->is_published) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian ini belum dipublikasikan.',
            ], 403);
        }

        // Validasi: Siswa harus terdaftar di kelas ujian tersebut
        $isMember = $exam->classroom->students()->where('users.id', $user->id)->exists();
        if (!$isMember) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak terdaftar sebagai siswa di kelas ujian ini.',
            ], 403);
        }

        $now = now();

        // Validasi waktu pembukaan ujian
        if ($now->lt($exam->start_time)) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian belum dibuka. Waktu mulai: ' . $exam->start_time->toDateTimeString(),
            ], 422);
        }

        if ($now->gt($exam->end_time)) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian telah berakhir pada ' . $exam->end_time->toDateTimeString(),
            ], 422);
        }

        // Cek apakah sudah pernah ada attempt (ER-5.2)
        $existingAttempt = ExamAttempt::where('exam_id', $exam->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingAttempt) {
            if ($existingAttempt->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda telah menyelesaikan ujian ini sebelumnya (maksimal 1 kali pengerjaan).',
                ], 422);
            }

            if ($existingAttempt->status === 'timed_out' || $now->gt($existingAttempt->deadline_at)) {
                if ($existingAttempt->status !== 'timed_out') {
                    $existingAttempt->update(['status' => 'timed_out']);
                }
                return response()->json([
                    'success' => false,
                    'message' => 'Batas waktu pengerjaan ujian Anda telah berakhir.',
                ], 422);
            }

            // Jika status masih in_progress dan waktu masih ada, lanjutkan sesi
            return response()->json([
                'success' => true,
                'message' => 'Melanjutkan sesi ujian yang sedang berjalan.',
                'data'    => $existingAttempt,
            ], 200);
        }

        // Hitung deadline_at = min(now + duration, exam.end_time) (ER-5.3)
        $durationDeadline = $now->copy()->addMinutes($exam->duration_minutes);
        $deadline = $durationDeadline->lt($exam->end_time) ? $durationDeadline : $exam->end_time;

        $attempt = ExamAttempt::create([
            'exam_id'     => $exam->id,
            'user_id'     => $user->id,
            'started_at'  => $now,
            'deadline_at' => $deadline,
            'status'      => 'in_progress',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sesi ujian berhasil dimulai.',
            'data'    => $attempt,
        ], 201);
    }

    /**
     * Mengambil daftar soal ujian untuk siswa.
     * ER-5.1: Kunci jawaban (is_correct) DILARANG DIKIRIM ke frontend!
     */
    public function getQuestions(Request $request, $id)
    {
        $user = auth()->user();
        $exam = Exam::find($id);

        if (!$exam) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian tidak ditemukan.',
            ], 404);
        }

        $attempt = ExamAttempt::where('exam_id', $exam->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$attempt) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum memulai sesi ujian ini. Silakan mulai ujian terlebih dahulu.',
            ], 403);
        }

        // Ambil soal dengan opsi, DENGAN MENGECUALIKAN is_correct (ER-5.1)
        $questions = Question::where('exam_id', $exam->id)
            ->select('id', 'exam_id', 'text')
            ->with(['options' => function ($query) {
                // Jangan select 'is_correct'
                $query->select('id', 'question_id', 'letter', 'text');
            }])
            ->get();

        // Ambil jawaban yang sebelumnya sudah tersimpan (jika resume)
        $savedAnswers = StudentAnswer::where('attempt_id', $attempt->id)
            ->pluck('option_id', 'question_id');

        return response()->json([
            'success' => true,
            'data'    => [
                'exam_id'          => $exam->id,
                'exam_title'       => $exam->title,
                'attempt_status'   => $attempt->status,
                'deadline_at'      => $attempt->deadline_at,
                'total_questions'  => $questions->count(),
                'questions'        => $questions,
                'saved_answers'    => $savedAnswers,
            ],
        ], 200);
    }

    /**
     * Simpan jawaban otomatis (Auto-save) per butir soal dengan validasi timer server (ER-5.3).
     */
    public function saveAnswer(Request $request, $id)
    {
        $request->validate([
            'question_id' => 'required|exists:questions,id',
            'option_id'   => 'nullable|exists:options,id',
        ]);

        $user = auth()->user();
        $attempt = ExamAttempt::where('exam_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$attempt) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi ujian tidak ditemukan.',
            ], 404);
        }

        if ($attempt->status !== 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'Sesi ujian sudah ditutup atau tidak aktif.',
            ], 422);
        }

        // ER-5.3 Validasi Timer Server
        if (now()->gt($attempt->deadline_at)) {
            $attempt->update([
                'status'      => 'timed_out',
                'finished_at' => now(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Batas waktu pengerjaan ujian telah berakhir. Jawaban ditolak.',
            ], 422);
        }

        // Simpan / update jawaban
        $answer = StudentAnswer::updateOrCreate(
            [
                'attempt_id'  => $attempt->id,
                'question_id' => $request->question_id,
            ],
            [
                'option_id'   => $request->option_id,
                'answered_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Jawaban berhasil disimpan.',
            'data'    => [
                'question_id' => $request->question_id,
                'option_id'   => $request->option_id,
            ],
        ], 200);
    }

    /**
     * Submit ujian & kalkulasi nilai otomatis (ER-5.4 & MR-6).
     */
    public function submit(Request $request, $id)
    {
        $user = auth()->user();
        $exam = Exam::find($id);

        if (!$exam) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian tidak ditemukan.',
            ], 404);
        }

        $attempt = ExamAttempt::where('exam_id', $exam->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$attempt) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi ujian tidak ditemukan.',
            ], 404);
        }

        if ($attempt->status === 'completed') {
            $result = ExamResult::where('attempt_id', $attempt->id)->first();
            return response()->json([
                'success' => true,
                'message' => 'Ujian sudah disubmit sebelumnya.',
                'data'    => $result,
            ], 200);
        }

        return DB::transaction(function () use ($exam, $attempt, $user) {
            // Ambil semua soal dan kunci jawabannya
            $questions = Question::with('options')->where('exam_id', $exam->id)->get();
            $answers = StudentAnswer::where('attempt_id', $attempt->id)->get()->keyBy('question_id');

            $totalQuestions = $questions->count();
            $correctAnswers = 0;

            foreach ($questions as $question) {
                $correctOption = $question->options->where('is_correct', true)->first();
                $studentAnswer = $answers->get($question->id);

                if ($studentAnswer && $correctOption && $studentAnswer->option_id === $correctOption->id) {
                    $correctAnswers++;
                    $studentAnswer->update(['is_correct' => true]);
                } elseif ($studentAnswer) {
                    $studentAnswer->update(['is_correct' => false]);
                }
            }

            // Rumus skor: (benar / total_soal) * 100 (ER-5.4)
            $score = $totalQuestions > 0 ? round(($correctAnswers / $totalQuestions) * 100, 2) : 0;

            // Kunci status attempt
            $attempt->update([
                'status'      => 'completed',
                'finished_at' => now(),
            ]);

            // Simpan ke rekap exam_results
            $examResult = ExamResult::updateOrCreate(
                ['attempt_id' => $attempt->id],
                [
                    'tenant_id'       => $exam->tenant_id,
                    'user_id'         => $user->id,
                    'exam_id'         => $exam->id,
                    'total_questions' => $totalQuestions,
                    'correct_answers' => $correctAnswers,
                    'score'           => $score,
                    'graded_at'       => now(),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Ujian berhasil diselesaikan.',
                'data'    => [
                    'exam_id'         => $exam->id,
                    'exam_title'      => $exam->title,
                    'total_questions' => $totalQuestions,
                    'correct_answers' => $correctAnswers,
                    'score'           => $score,
                    'finished_at'     => $attempt->finished_at,
                ],
            ], 200);
        });
    }
}
