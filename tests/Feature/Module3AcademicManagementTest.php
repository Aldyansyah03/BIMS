<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Module3AcademicManagementTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $adminBimbel;
    private User $tutor;
    private User $siswa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name'   => 'Bimbel Pintar',
            'slug'   => 'bimbel-pintar',
            'status' => 'aktif',
        ]);

        $this->adminBimbel = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Admin Bimbel',
            'email'     => 'admin@bimbelpintar.com',
            'password'  => bcrypt('password123'),
            'role'      => 'admin_bimbel',
            'is_active' => true,
        ]);

        $this->tutor = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Tutor Budi',
            'email'     => 'tutor.budi@bimbelpintar.com',
            'password'  => bcrypt('password123'),
            'role'      => 'tutor',
            'is_active' => true,
        ]);

        $this->siswa = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Siswa Siti',
            'email'     => 'siswa.siti@bimbelpintar.com',
            'password'  => bcrypt('password123'),
            'role'      => 'siswa',
            'is_active' => true,
        ]);
    }

    public function test_admin_bimbel_can_crud_subjects()
    {
        // 1. Create Subject
        $createRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->postJson('/api/subjects', [
                'name' => 'Matematika Wajib',
                'code' => 'MTK-12',
            ]);

        $createRes->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Matematika Wajib',
                    'code' => 'MTK-12',
                ]
            ]);

        $subjectId = $createRes->json('data.id');

        // 2. Read Subject List
        $listRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->getJson('/api/subjects');

        $listRes->assertStatus(200)
            ->assertJsonCount(1, 'data');

        // 3. Update Subject
        $updateRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->putJson("/api/subjects/{$subjectId}", [
                'name' => 'Matematika Peminatan',
            ]);

        $updateRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Matematika Peminatan',
                ]
            ]);

        // 4. Delete Subject
        $deleteRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->deleteJson("/api/subjects/{$subjectId}");

        $deleteRes->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('subjects', ['id' => $subjectId]);
    }

    public function test_admin_bimbel_can_crud_classrooms()
    {
        // 1. Create Classroom
        $createRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->postJson('/api/classrooms', [
                'name'          => 'Kelas 12 IPA Intensif',
                'academic_year' => '2026/2027',
                'is_active'     => true,
            ]);

        $createRes->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name'          => 'Kelas 12 IPA Intensif',
                    'academic_year' => '2026/2027',
                ]
            ]);

        $classroomId = $createRes->json('data.id');

        // 2. Detail Classroom
        $detailRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->getJson("/api/classrooms/{$classroomId}");

        $detailRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id'   => $classroomId,
                    'name' => 'Kelas 12 IPA Intensif',
                ]
            ]);

        // 3. Update Classroom
        $updateRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->putJson("/api/classrooms/{$classroomId}", [
                'name' => 'Kelas 12 IPA Reguler',
            ]);

        $updateRes->assertStatus(200)
            ->assertJson([
                'data' => [
                    'name' => 'Kelas 12 IPA Reguler',
                ]
            ]);

        // 4. Delete Classroom
        $deleteRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->deleteJson("/api/classrooms/{$classroomId}");

        $deleteRes->assertStatus(200);
        $this->assertDatabaseMissing('classrooms', ['id' => $classroomId]);
    }

    public function test_classroom_membership_validation_er_3_1()
    {
        $classroom = Classroom::create([
            'tenant_id'     => $this->tenant->id,
            'name'          => 'Kelas 10 Unggulan',
            'academic_year' => '2026/2027',
        ]);

        // 1. Gagal jika Tutor dimasukkan sebagai siswa
        $invalidRoleRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->id}/members", [
                'user_id'       => $this->tutor->id,
                'role_in_class' => 'siswa',
            ]);

        $invalidRoleRes->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Pengguna ini bukan berstatus Siswa.',
            ]);

        // 2. Berhasil memasukkan Tutor dengan role tutor
        $addTutorRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->id}/members", [
                'user_id'       => $this->tutor->id,
                'role_in_class' => 'tutor',
            ]);

        $addTutorRes->assertStatus(201)
            ->assertJson(['success' => true]);

        // 3. Gagal jika memasukkan orang yang sama dua kali (duplikat)
        $duplicateRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->id}/members", [
                'user_id'       => $this->tutor->id,
                'role_in_class' => 'tutor',
            ]);

        $duplicateRes->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Pengguna sudah terdaftar di kelas ini.',
            ]);

        // 4. Berhasil memasukkan Siswa
        $addSiswaRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->postJson("/api/classrooms/{$classroom->id}/members", [
                'user_id'       => $this->siswa->id,
                'role_in_class' => 'siswa',
            ]);

        $addSiswaRes->assertStatus(201);

        // 5. Lihat list anggota kelas
        $membersRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->getJson("/api/classrooms/{$classroom->id}/members");

        $membersRes->assertStatus(200)
            ->assertJson([
                'data' => [
                    'total_members' => 2,
                ]
            ]);

        // 6. Hapus Siswa dari anggota kelas
        $removeRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->deleteJson("/api/classrooms/{$classroom->id}/members/{$this->siswa->id}");

        $removeRes->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('classroom_members', [
            'classroom_id' => $classroom->id,
            'user_id'      => $this->siswa->id,
        ]);
    }

    public function test_schedule_clash_validation_er_3_2()
    {
        $subject = Subject::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Fisika',
            'code'      => 'FSK-12',
        ]);

        $classA = Classroom::create([
            'tenant_id'     => $this->tenant->id,
            'name'          => 'Kelas IPA 1',
            'academic_year' => '2026/2027',
        ]);

        $classB = Classroom::create([
            'tenant_id'     => $this->tenant->id,
            'name'          => 'Kelas IPA 2',
            'academic_year' => '2026/2027',
        ]);

        // 1. Jadwal awal untuk Tutor Budi di Kelas IPA 1: Hari Senin (1), 08:00 - 10:00
        $scheduleA = Schedule::create([
            'tenant_id'    => $this->tenant->id,
            'classroom_id' => $classA->id,
            'subject_id'   => $subject->id,
            'tutor_id'     => $this->tutor->id,
            'day_of_week'  => 1,
            'start_time'   => '08:00',
            'end_time'     => '10:00',
        ]);

        // 2. Bentrok Tutor: Coba jadwalkan Tutor Budi di Kelas IPA 2 pada waktu tumpang tindih (09:00 - 11:00)
        $tutorClashRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->postJson('/api/schedules', [
                'classroom_id' => $classB->id,
                'subject_id'   => $subject->id,
                'tutor_id'     => $this->tutor->id,
                'day_of_week'  => 1,
                'start_time'   => '09:00',
                'end_time'     => '11:00',
            ]);

        $tutorClashRes->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
        $this->assertStringContainsString('sudah memiliki jadwal mengajar', $tutorClashRes->json('message'));

        // Buat tutor kedua
        $tutor2 = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Tutor Ani',
            'email'     => 'tutor.ani@bimbelpintar.com',
            'password'  => bcrypt('password123'),
            'role'      => 'tutor',
            'is_active' => true,
        ]);

        // 3. Bentrok Kelas: Coba jadwalkan Kelas IPA 1 di jam tumpang tindih (09:00 - 11:00) meskipun dengan Tutor Ani
        $classClashRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->postJson('/api/schedules', [
                'classroom_id' => $classA->id,
                'subject_id'   => $subject->id,
                'tutor_id'     => $tutor2->id,
                'day_of_week'  => 1,
                'start_time'   => '09:00',
                'end_time'     => '11:00',
            ]);

        $classClashRes->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
        $this->assertStringContainsString('sudah memiliki jadwal mapel', $classClashRes->json('message'));

        // 4. Jadwal Tidak Bentrok: Jam 10:00 - 12:00 berhasil dibuat
        $validRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->postJson('/api/schedules', [
                'classroom_id' => $classA->id,
                'subject_id'   => $subject->id,
                'tutor_id'     => $this->tutor->id,
                'day_of_week'  => 1,
                'start_time'   => '10:00',
                'end_time'     => '12:00',
            ]);

        $validRes->assertStatus(201)
            ->assertJson(['success' => true]);
    }

    public function test_multi_tenant_isolation_in_module_3_er_2_2()
    {
        // Bimbel Lain
        $otherTenant = Tenant::create([
            'name'   => 'Bimbel Lain',
            'slug'   => 'bimbel-lain',
            'status' => 'aktif',
        ]);

        $otherAdmin = User::create([
            'tenant_id' => $otherTenant->id,
            'name'      => 'Admin Lain',
            'email'     => 'admin@bimbellain.com',
            'password'  => bcrypt('password123'),
            'role'      => 'admin_bimbel',
            'is_active' => true,
        ]);

        Subject::create([
            'tenant_id' => $otherTenant->id,
            'name'      => 'Kimia Farmasi',
            'code'      => 'KIM-FAR',
        ]);

        Classroom::create([
            'tenant_id'     => $otherTenant->id,
            'name'          => 'Kelas Khusus Bimbel Lain',
            'academic_year' => '2026/2027',
        ]);

        // Admin Bimbel Pintar tidak boleh melihat Subject dan Classroom milik Bimbel Lain
        $subjectRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->getJson('/api/subjects');

        $subjectRes->assertStatus(200)
            ->assertJsonCount(0, 'data');

        $classroomRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->getJson('/api/classrooms');

        $classroomRes->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
