<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamResult;
use App\Models\Option;
use App\Models\Question;
use App\Models\StudentAnswer;
use App\Models\Subscription;
use App\Models\SubscriptionPackage;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Module6And7ResultsAndAuditLogTest extends TestCase
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
            'name'   => 'Bimbel Teladan',
            'slug'   => 'bimbel-teladan',
            'status' => 'aktif',
        ]);

        $this->adminBimbel = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Admin Bimbel Teladan',
            'email'     => 'admin@bimbelteladan.com',
            'password'  => bcrypt('password123'),
            'role'      => 'admin_bimbel',
            'is_active' => true,
        ]);

        $this->tutor = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Tutor Matematika',
            'email'     => 'tutor@bimbelteladan.com',
            'password'  => bcrypt('password123'),
            'role'      => 'tutor',
            'is_active' => true,
        ]);

        $this->siswa = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Siswa Rizky',
            'email'     => 'rizky@bimbelteladan.com',
            'password'  => bcrypt('password123'),
            'role'      => 'siswa',
            'is_active' => true,
        ]);

        $this->classroom = Classroom::create([
            'tenant_id'     => $this->tenant->id,
            'name'          => 'Kelas 12 Sains',
            'academic_year' => '2026/2027',
            'is_active'     => true,
        ]);

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

    public function test_student_can_view_detailed_exam_result_and_leaderboard_mr_6()
    {
        $exam = Exam::create([
            'tenant_id'        => $this->tenant->id,
            'classroom_id'     => $this->classroom->id,
            'tutor_id'         => $this->tutor->id,
            'title'            => 'Kuis Trigonometri',
            'start_time'       => now()->subHour(),
            'end_time'         => now()->addHour(),
            'duration_minutes' => 60,
            'is_published'     => true,
        ]);

        $q1 = Question::create(['exam_id' => $exam->id, 'text' => 'Sin 90?']);
        $opt1 = Option::create(['question_id' => $q1->id, 'letter' => 'A', 'text' => '1', 'is_correct' => true]);

        $attempt = ExamAttempt::create([
            'exam_id'     => $exam->id,
            'user_id'     => $this->siswa->id,
            'started_at'  => now()->subMinutes(30),
            'deadline_at' => now()->addMinutes(30),
            'finished_at' => now()->subMinutes(10),
            'status'      => 'completed',
        ]);

        StudentAnswer::create([
            'attempt_id'  => $attempt->id,
            'question_id' => $q1->id,
            'option_id'   => $opt1->id,
            'is_correct'  => true,
        ]);

        $result = ExamResult::create([
            'attempt_id'      => $attempt->id,
            'tenant_id'       => $this->tenant->id,
            'user_id'         => $this->siswa->id,
            'exam_id'         => $exam->id,
            'total_questions' => 1,
            'correct_answers' => 1,
            'score'           => 100.00,
            'graded_at'       => now()->subMinutes(10),
        ]);

        // Request detail hasil ujian oleh siswa
        $response = $this->actingAs($this->siswa, 'sanctum')
            ->getJson("/api/student/exam-results/{$result->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id'               => $result->id,
                    'exam_title'       => 'Kuis Trigonometri',
                    'score'            => 100,
                    'correct'          => 1,
                    'wrong'            => 0,
                    'total'            => 1,
                    'question_results' => [
                        [
                            'number' => 1,
                            'status' => 'correct',
                        ]
                    ]
                ]
            ]);

        // Cek riwayat seluruh ujian siswa
        $historyRes = $this->actingAs($this->siswa, 'sanctum')
            ->getJson('/api/student/exam-results');

        $historyRes->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_tutor_can_view_and_export_class_results_mr_6()
    {
        $exam = Exam::create([
            'tenant_id'        => $this->tenant->id,
            'classroom_id'     => $this->classroom->id,
            'tutor_id'         => $this->tutor->id,
            'title'            => 'UTS Kimia',
            'start_time'       => now()->subHour(),
            'end_time'         => now()->addHour(),
            'duration_minutes' => 60,
            'is_published'     => true,
        ]);

        $attempt = ExamAttempt::create([
            'exam_id'     => $exam->id,
            'user_id'     => $this->siswa->id,
            'started_at'  => now()->subMinutes(20),
            'deadline_at' => now()->addMinutes(40),
            'finished_at' => now()->subMinutes(5),
            'status'      => 'completed',
        ]);

        ExamResult::create([
            'attempt_id'      => $attempt->id,
            'tenant_id'       => $this->tenant->id,
            'user_id'         => $this->siswa->id,
            'exam_id'         => $exam->id,
            'total_questions' => 10,
            'correct_answers' => 8,
            'score'           => 80.00,
            'graded_at'       => now(),
        ]);

        // 1. Tutor ambil rekap nilai kelas
        $res = $this->actingAs($this->tutor, 'sanctum')
            ->getJson("/api/tutor/classes/{$this->classroom->id}/results?exam_id={$exam->id}");

        $res->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    [
                        'id'     => $this->siswa->id,
                        'name'   => $this->siswa->name,
                        'status' => 'submitted',
                        'score'  => 80,
                    ]
                ]
            ]);

        // 2. Tutor export nilai ke CSV
        $exportRes = $this->actingAs($this->tutor, 'sanctum')
            ->get("/api/tutor/classes/{$this->classroom->id}/results/export?exam_id={$exam->id}");

        $exportRes->assertStatus(200)
            ->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    public function test_admin_dashboard_returns_kpis_and_performance_mr_6()
    {
        $pkg = SubscriptionPackage::create([
            'name'          => 'Paket Pro',
            'price'         => 300000,
            'duration_days' => 30,
            'max_users'     => 100,
            'is_active'     => true,
        ]);

        Subscription::create([
            'tenant_id'  => $this->tenant->id,
            'package_id' => $pkg->id,
            'start_date' => now(),
            'end_date'   => now()->addDays(30),
            'status'     => 'aktif',
        ]);

        $res = $this->actingAs($this->adminBimbel, 'sanctum')
            ->getJson('/api/admin/dashboard');

        $res->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'plan' => [
                        'name'        => 'Paket Pro',
                        'users_limit' => 100,
                    ],
                    'kpis' => [
                        'students' => 1,
                        'tutors'   => 1,
                        'classes'  => 1,
                    ]
                ]
            ]);
    }

    public function test_activity_logs_recorded_and_viewable_mr_7()
    {
        // 1. Catat Log Manual & Otomatis
        ActivityLog::record('CUSTOM_ACTION', ['note' => 'Pengujian audit log'], $this->adminBimbel);

        $this->assertDatabaseHas('activity_logs', [
            'action'    => 'CUSTOM_ACTION',
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->adminBimbel->id,
        ]);

        // 2. Admin Bimbel melihat list activity logs
        $logsRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->getJson('/api/admin/activity-logs?action=CUSTOM_ACTION');

        $logsRes->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertGreaterThanOrEqual(1, count($logsRes->json('data.data')));
    }
}
