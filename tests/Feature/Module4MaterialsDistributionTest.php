<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Classroom;
use App\Models\ClassroomMember;
use App\Models\Material;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class Module4MaterialsDistributionTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $tutor;
    private User $siswa;
    private Classroom $classroom;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->tenant = Tenant::create([
            'name'   => 'Bimbel Prestasi',
            'slug'   => 'bimbel-prestasi',
            'status' => 'aktif',
        ]);

        $this->tutor = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Tutor Fisika',
            'email'     => 'tutor.fisika@prestasi.com',
            'password'  => bcrypt('password123'),
            'role'      => 'tutor',
            'is_active' => true,
        ]);

        $this->siswa = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Siswa Kevin',
            'email'     => 'kevin@prestasi.com',
            'password'  => bcrypt('password123'),
            'role'      => 'siswa',
            'is_active' => true,
        ]);

        $this->classroom = Classroom::create([
            'tenant_id'     => $this->tenant->id,
            'name'          => 'Kelas 11 IPA Reguler',
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

    public function test_tutor_can_publish_pdf_material_with_size_validation_er_4_1()
    {
        // 1. Upload file PDF valid (misal 500 KB)
        $file = UploadedFile::fake()->create('modul_kinematika.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->tutor, 'sanctum')
            ->postJson("/api/tutor/classes/{$this->classroom->id}/materials", [
                'title' => 'Modul Kinematika Gerak Lurus',
                'file'  => $file,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title' => 'Modul Kinematika Gerak Lurus',
                    'type'  => 'pdf',
                ]
            ]);

        $materialId = $response->json('data.id');

        $this->assertDatabaseHas('materials', [
            'id'    => $materialId,
            'title' => 'Modul Kinematika Gerak Lurus',
            'type'  => 'pdf',
        ]);

        // Verifikasi file tersimpan di storage public
        $material = Material::find($materialId);
        Storage::disk('public')->assertExists($material->file_path);

        // Verifikasi audit log tercatat (MR-7)
        $this->assertDatabaseHas('activity_logs', [
            'action'    => 'UPLOAD_MATERIAL',
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->tutor->id,
        ]);

        // 2. Validasi gagal jika bukan PDF (misal file .txt atau .exe)
        $invalidFile = UploadedFile::fake()->create('dokumen.txt', 100, 'text/plain');
        $failResponse = $this->actingAs($this->tutor, 'sanctum')
            ->postJson("/api/tutor/classes/{$this->classroom->id}/materials", [
                'title' => 'Dokumen Salah Format',
                'file'  => $invalidFile,
            ]);

        $failResponse->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_tutor_can_publish_video_material()
    {
        $response = $this->actingAs($this->tutor, 'sanctum')
            ->postJson("/api/tutor/classes/{$this->classroom->id}/materials", [
                'title'     => 'Rekaman Pembahasan Soal Vektor',
                'video_url' => 'https://youtube.com/watch?v=example123',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'title'     => 'Rekaman Pembahasan Soal Vektor',
                    'type'      => 'video',
                    'video_url' => 'https://youtube.com/watch?v=example123',
                ]
            ]);

        $this->assertDatabaseHas('materials', [
            'title' => 'Rekaman Pembahasan Soal Vektor',
            'type'  => 'video',
        ]);
    }

    public function test_student_can_view_materials_for_their_enrolled_classes()
    {
        // Materi di kelas siswa
        Material::create([
            'tenant_id'    => $this->tenant->id,
            'classroom_id' => $this->classroom->id,
            'tutor_id'     => $this->tutor->id,
            'title'        => 'Materi Termodinamika',
            'type'         => 'video',
            'video_url'    => 'https://youtube.com/watch?v=termo',
        ]);

        // Kelas lain yang TIDAK diikuti siswa ini
        $otherClass = Classroom::create([
            'tenant_id'     => $this->tenant->id,
            'name'          => 'Kelas 10 Reguler',
            'academic_year' => '2026/2027',
        ]);

        Material::create([
            'tenant_id'    => $this->tenant->id,
            'classroom_id' => $otherClass->id,
            'tutor_id'     => $this->tutor->id,
            'title'        => 'Materi Kelas Lain',
            'type'         => 'video',
            'video_url'    => 'https://youtube.com/watch?v=other',
        ]);

        $response = $this->actingAs($this->siswa, 'sanctum')
            ->getJson('/api/student/materials');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $this->assertEquals('Materi Termodinamika', $response->json('data.0.title'));
    }

    public function test_tutor_can_delete_material()
    {
        $file = UploadedFile::fake()->create('hapus_saya.pdf', 100, 'application/pdf');
        $path = $file->store('materials', 'public');

        $material = Material::create([
            'tenant_id'    => $this->tenant->id,
            'classroom_id' => $this->classroom->id,
            'tutor_id'     => $this->tutor->id,
            'title'        => 'Materi yang akan dihapus',
            'type'         => 'pdf',
            'file_path'    => $path,
        ]);

        $deleteRes = $this->actingAs($this->tutor, 'sanctum')
            ->deleteJson("/api/tutor/materials/{$material->id}");

        $deleteRes->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('materials', ['id' => $material->id]);
        Storage::disk('public')->assertMissing($path);
    }
}
