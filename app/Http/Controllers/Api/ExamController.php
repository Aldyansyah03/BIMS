<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Option;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    /**
     * Daftar ujian (Tutor & Admin Bimbel).
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Exam::with(['classroom:id,name', 'tutor:id,name'])
            ->withCount(['questions', 'attempts']);

        if ($user->role === 'tutor') {
            $query->where('tutor_id', $user->id);
        }

        if ($request->filled('classroom_id')) {
            $query->where('classroom_id', $request->classroom_id);
        }

        if ($request->has('is_published')) {
            $query->where('is_published', filter_var($request->is_published, FILTER_VALIDATE_BOOLEAN));
        }

        $exams = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data'    => $exams,
        ], 200);
    }

    /**
     * Buat paket ujian CBT baru.
     */
    public function store(Request $request)
    {
        $request->validate([
            'classroom_id'     => 'required|exists:classrooms,id',
            'title'            => 'required|string|max:200',
            'start_time'       => 'required|date',
            'end_time'         => 'required|date|after:start_time',
            'duration_minutes' => 'required|integer|min:1',
            'is_published'     => 'nullable|boolean',
            'tenant_id'        => 'nullable|exists:tenants,id',
        ]);

        $user = auth()->user();
        $classroom = Classroom::find($request->classroom_id);

        if ($classroom->tenant_id && $classroom->tenant_id !== $user->tenant_id && $user->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak valid untuk tenant Anda.',
            ], 422);
        }

        $examData = [
            'classroom_id'     => $request->classroom_id,
            'tutor_id'         => $user->role === 'tutor' ? $user->id : ($request->input('tutor_id', $user->id)),
            'title'            => $request->title,
            'start_time'       => $request->start_time,
            'end_time'         => $request->end_time,
            'duration_minutes' => $request->duration_minutes,
            'is_published'     => $request->boolean('is_published', false),
        ];

        if ($user->role === 'super_admin' && $request->filled('tenant_id')) {
            $examData['tenant_id'] = $request->tenant_id;
        }

        $exam = Exam::create($examData);

        // Catat Audit Trail (MR-7)
        \App\Models\ActivityLog::record('CREATE_EXAM', [
            'exam_id' => $exam->id,
            'title'   => $exam->title,
        ], $user);

        return response()->json([
            'success' => true,
            'message' => 'Paket ujian CBT berhasil dibuat.',
            'data'    => $exam->load(['classroom:id,name', 'tutor:id,name']),
        ], 201);
    }

    /**
     * Detail satu ujian.
     */
    public function show($id)
    {
        $exam = Exam::with(['classroom:id,name', 'tutor:id,name'])
            ->withCount(['questions', 'attempts'])
            ->find($id);

        if (!$exam) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $exam,
        ], 200);
    }

    /**
     * Update data ujian.
     */
    public function update(Request $request, $id)
    {
        $exam = Exam::find($id);

        if (!$exam) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian tidak ditemukan.',
            ], 404);
        }

        $request->validate([
            'classroom_id'     => 'sometimes|required|exists:classrooms,id',
            'title'            => 'sometimes|required|string|max:200',
            'start_time'       => 'sometimes|required|date',
            'end_time'         => 'sometimes|required|date',
            'duration_minutes' => 'sometimes|required|integer|min:1',
            'is_published'     => 'nullable|boolean',
        ]);

        $exam->update($request->only([
            'classroom_id',
            'title',
            'start_time',
            'end_time',
            'duration_minutes',
            'is_published',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Ujian berhasil diperbarui.',
            'data'    => $exam->load(['classroom:id,name', 'tutor:id,name']),
        ], 200);
    }

    /**
     * Hapus ujian.
     */
    public function destroy($id)
    {
        $exam = Exam::find($id);

        if (!$exam) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian tidak ditemukan.',
            ], 404);
        }

        $exam->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ujian berhasil dihapus.',
        ], 200);
    }

    /**
     * Toggle status publikasi ujian (ER-5.1).
     */
    public function togglePublish($id)
    {
        $exam = Exam::find($id);

        if (!$exam) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian tidak ditemukan.',
            ], 404);
        }

        $exam->is_published = !$exam->is_published;
        $exam->save();

        // Catat Audit Trail (MR-7)
        \App\Models\ActivityLog::record($exam->is_published ? 'PUBLISH_EXAM' : 'UNPUBLISH_EXAM', [
            'exam_id' => $exam->id,
            'title'   => $exam->title,
        ]);

        return response()->json([
            'success' => true,
            'message' => $exam->is_published ? 'Ujian berhasil dipublikasikan ke siswa.' : 'Ujian ditarik dari publikasi.',
            'data'    => [
                'id'           => $exam->id,
                'is_published' => $exam->is_published,
            ],
        ], 200);
    }

    /**
     * Ambil soal ujian lengkap dengan kunci jawaban (Khusus Tutor/Admin).
     */
    public function getQuestions($id)
    {
        $exam = Exam::find($id);

        if (!$exam) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian tidak ditemukan.',
            ], 404);
        }

        $questions = Question::with('options')
            ->where('exam_id', $exam->id)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'exam_id'         => $exam->id,
                'exam_title'      => $exam->title,
                'total_questions' => $questions->count(),
                'questions'       => $questions,
            ],
        ], 200);
    }

    /**
     * Tambah butir soal ke ujian beserta 4 opsi pilihan ganda dan kunci jawaban.
     */
    public function addQuestion(Request $request, $id)
    {
        $exam = Exam::find($id);

        if (!$exam) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian tidak ditemukan.',
            ], 404);
        }

        $request->validate([
            'text'              => 'required|string',
            'options'           => 'required|array|min:2|max:5',
            'options.*.letter'  => 'required|string|in:A,B,C,D,E',
            'options.*.text'    => 'required|string',
            'correct_letter'    => 'required|string|in:A,B,C,D,E',
        ]);

        return DB::transaction(function () use ($exam, $request) {
            $question = Question::create([
                'exam_id' => $exam->id,
                'text'    => $request->text,
            ]);

            foreach ($request->options as $opt) {
                Option::create([
                    'question_id' => $question->id,
                    'letter'      => strtoupper($opt['letter']),
                    'text'        => $opt['text'],
                    'is_correct'  => strtoupper($opt['letter']) === strtoupper($request->correct_letter),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Soal dan pilihan jawaban berhasil ditambahkan.',
                'data'    => $question->load('options'),
            ], 201);
        });
    }

    /**
     * Hapus satu butir soal.
     */
    public function deleteQuestion($id, $questionId)
    {
        $question = Question::where('exam_id', $id)->where('id', $questionId)->first();

        if (!$question) {
            return response()->json([
                'success' => false,
                'message' => 'Soal tidak ditemukan.',
            ], 404);
        }

        $question->delete();

        return response()->json([
            'success' => true,
            'message' => 'Soal berhasil dihapus.',
        ], 200);
    }

    /**
     * Rekap seluruh nilai siswa di ujian ini (MR-6).
     */
    public function getResults($id)
    {
        $exam = Exam::find($id);

        if (!$exam) {
            return response()->json([
                'success' => false,
                'message' => 'Ujian tidak ditemukan.',
            ], 404);
        }

        $results = ExamResult::with('user:id,name,email,phone')
            ->where('exam_id', $exam->id)
            ->orderBy('score', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'exam_id'       => $exam->id,
                'exam_title'    => $exam->title,
                'total_results' => $results->count(),
                'results'       => $results,
            ],
        ], 200);
    }
}
