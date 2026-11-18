<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamResult;
use App\Models\Option;
use App\Models\Question;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Module5CbtExamTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $adminBimbel;
    private User $tutor;
    private User $siswa;
    private Classroom $classroom;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name'   => 'Bimbel Cerdas',
            'slug'   => 'bimbel-cerdas',
            'status' => 'aktif',
        ]);

        $this->adminBimbel = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Admin Bimbel Cerdas',
            'email'     => 'admin@bimbelcerdas.com',
            'password'  => bcrypt('password123'),
            'role'      => 'admin_bimbel',
            'is_active' => true,
        ]);

        $this->tutor = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Tutor Matematika',
            'email'     => 'tutor@bimbelcerdas.com',
            'password'  => bcrypt('password123'),
            'role'      => 'tutor',
            'is_active' => true,
        ]);

        $this->siswa = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Siswa Budi',
            'email'     => 'budi@bimbelcerdas.com',
            'password'  => bcrypt('password123'),
            'role'      => 'siswa',
            'is_active' => true,
        ]);

        $this->classroom = Classroom::create([
            'tenant_id'     => $this->tenant->id,
            'name'          => 'Kelas 12 IPA Intensif',
            'academic_year' => '2026/2027',
            'is_active'     => true,
        ]);

        // Masukkan tutor dan siswa ke kelas
        ClassroomMember::create([
            'classroom_id'  => $this->classroom->id,
            'user_id'       => $this->tutor->id,
            'role_in_class' => 'tutor',
        ]);

        ClassroomMember::create([
            'classroom_id'  => $this->classroom->id,
            'user_id'       => $this->siswa->id,
            'role_in_class' => 'siswa',
        ]);
    }

    public function test_tutor_can_create_exam_and_add_questions()
    {
        // 1. Buat Ujian Baru
        $examRes = $this->actingAs($this->tutor, 'sanctum')
            ->postJson('/api/exams', [
                'classroom_id'     => $this->classroom->id,
                'title'            => 'Tryout UTBK Matematika 1',
                'start_time'       => now()->subMinute()->toDateTimeString(),
                'end_time'         => now()->addHours(3)->toDateTimeString(),
                'duration_minutes' => 60,
                'is_published'     => false,
            ]);

        $examRes->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Tryout UTBK Matematika 1',
                    'duration_minutes' => 60,
                ]
            ]);

        $examId = $examRes->json('data.id');

        // 2. Tambah Butir Soal (Pilihan Ganda A, B, C, D)
        $questionRes = $this->actingAs($this->tutor, 'sanctum')
            ->postJson("/api/exams/{$examId}/questions", [
                'text'    => 'Berapakah nilai dari 5 x 5?',
                'options' => [
                    ['letter' => 'A', 'text' => '20'],
                    ['letter' => 'B', 'text' => '25'],
                    ['letter' => 'C', 'text' => '30'],
                    ['letter' => 'D', 'text' => '35'],
                ],
                'correct_letter' => 'B',
            ]);

        $questionRes->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('questions', ['exam_id' => $examId, 'text' => 'Berapakah nilai dari 5 x 5?']);
        $this->assertDatabaseHas('options', ['letter' => 'B', 'is_correct' => true]);
        $this->assertDatabaseHas('options', ['letter' => 'A', 'is_correct' => false]);

        // 3. Publish Ujian
        $publishRes = $this->actingAs($this->tutor, 'sanctum')
            ->patchJson("/api/exams/{$examId}/publish");

        $publishRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['is_published' => true],
            ]);
    }

    public function test_student_exam_workflow_and_security_er_5_1_and_er_5_4()
    {
        // Setup Ujian yang sudah dipublish
        $exam = Exam::create([
            'tenant_id'        => $this->tenant->id,
            'classroom_id'     => $this->classroom->id,
            'tutor_id'         => $this->tutor->id,
            'title'            => 'Kuis Harian MTK',
            'start_time'       => now()->subMinute(),
            'end_time'         => now()->addHours(2),
            'duration_minutes' => 30,
            'is_published'     => true,
        ]);

        // Soal 1: Kunci B
        $q1 = Question::create(['exam_id' => $exam->id, 'text' => 'Soal 1: 1 + 1 = ?']);
        $optA1 = Option::create(['question_id' => $q1->id, 'letter' => 'A', 'text' => '1', 'is_correct' => false]);
        $optB1 = Option::create(['question_id' => $q1->id, 'letter' => 'B', 'text' => '2', 'is_correct' => true]);

        // Soal 2: Kunci A
        $q2 = Question::create(['exam_id' => $exam->id, 'text' => 'Soal 2: Ibukota Indonesia adalah?']);
        $optA2 = Option::create(['question_id' => $q2->id, 'letter' => 'A', 'text' => 'Jakarta/IKN', 'is_correct' => true]);
        $optB2 = Option::create(['question_id' => $q2->id, 'letter' => 'B', 'text' => 'Surabaya', 'is_correct' => false]);

        // 1. Siswa Mulai Ujian (Start Exam)
        $startRes = $this->actingAs($this->siswa, 'sanctum')
            ->postJson("/api/student/exams/{$exam->id}/start");

        $startRes->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'exam_id' => $exam->id,
                    'status'  => 'in_progress',
                ]
            ]);

        // 2. Siswa Ambil Soal -> PASTIKAN ER-5.1: is_correct TIDAK ADA DI RESPONSE!
        $questionsRes = $this->actingAs($this->siswa, 'sanctum')
            ->getJson("/api/student/exams/{$exam->id}/questions");

        $questionsRes->assertStatus(200);
        $responseData = $questionsRes->json('data.questions');
        $this->assertCount(2, $responseData);

        // Verifikasi tidak ada kunci jawaban yang bocor
        foreach ($responseData as $q) {
            foreach ($q['options'] as $opt) {
                $this->assertArrayNotHasKey('is_correct', $opt, 'KEAMANAN ER-5.1 GAGAL: is_correct bocor ke frontend siswa!');
            }
        }

        // 3. Siswa Simpan Jawaban Soal 1 (Pilih B -> Benar)
        $ans1Res = $this->actingAs($this->siswa, 'sanctum')
            ->postJson("/api/student/exams/{$exam->id}/answer", [
                'question_id' => $q1->id,
                'option_id'   => $optB1->id,
            ]);

        $ans1Res->assertStatus(200)
            ->assertJson(['success' => true]);

        // Siswa Simpan Jawaban Soal 2 (Pilih B -> Salah)
        $ans2Res = $this->actingAs($this->siswa, 'sanctum')
            ->postJson("/api/student/exams/{$exam->id}/answer", [
                'question_id' => $q2->id,
                'option_id'   => $optB2->id,
            ]);

        $ans2Res->assertStatus(200);

        // 4. Siswa Submit Ujian (Kalkulasi Nilai Otomatis ER-5.4)
        $submitRes = $this->actingAs($this->siswa, 'sanctum')
            ->postJson("/api/student/exams/{$exam->id}/submit");

        $submitRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_questions' => 2,
                    'correct_answers' => 1,
                    'score'           => 50.00, // 1/2 * 100 = 50.00
                ]
            ]);

        $this->assertDatabaseHas('exam_results', [
            'exam_id'         => $exam->id,
            'user_id'         => $this->siswa->id,
            'total_questions' => 2,
            'correct_answers' => 1,
            'score'           => 50.00,
        ]);

        // 5. Validasi ER-5.2: Siswa DILARANG memulai ulang ujian yang sudah selesai
        $reStartRes = $this->actingAs($this->siswa, 'sanctum')
            ->postJson("/api/student/exams/{$exam->id}/start");

        $reStartRes->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_server_timer_validation_er_5_3()
    {
        $exam = Exam::create([
            'tenant_id'        => $this->tenant->id,
            'classroom_id'     => $this->classroom->id,
            'tutor_id'         => $this->tutor->id,
            'title'            => 'Ujian Kilat',
            'start_time'       => now()->subMinutes(10),
            'end_time'         => now()->addMinutes(10),
            'duration_minutes' => 5,
            'is_published'     => true,
        ]);

        $q = Question::create(['exam_id' => $exam->id, 'text' => 'Soal 1']);
        $opt = Option::create(['question_id' => $q->id, 'letter' => 'A', 'text' => 'Opsi A', 'is_correct' => true]);

        // Buat attempt yang sudah melewati deadline_at (misal 5 menit yang lalu)
        $attempt = ExamAttempt::create([
            'exam_id'     => $exam->id,
            'user_id'     => $this->siswa->id,
            'started_at'  => now()->subMinutes(10),
            'deadline_at' => now()->subMinute(), // DEADLINE SUDAH LEWAT
            'status'      => 'in_progress',
        ]);

        // Coba kirim jawaban -> Wajib ditolak oleh server (ER-5.3)
        $answerRes = $this->actingAs($this->siswa, 'sanctum')
            ->postJson("/api/student/exams/{$exam->id}/answer", [
                'question_id' => $q->id,
                'option_id'   => $opt->id,
            ]);

        $answerRes->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
        $this->assertStringContainsString('Batas waktu pengerjaan ujian telah berakhir', $answerRes->json('message'));

        $this->assertDatabaseHas('exam_attempts', [
            'id'     => $attempt->id,
            'status' => 'timed_out',
        ]);
    }
}
