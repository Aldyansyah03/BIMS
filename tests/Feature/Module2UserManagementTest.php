<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\SubscriptionPackage;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Module2UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $adminBimbel;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name'   => 'Bimbel Hebat',
            'slug'   => 'bimbel-hebat',
            'status' => 'aktif',
        ]);

        $this->adminBimbel = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Admin Bimbel Hebat',
            'email'     => 'admin@bimbelhebat.com',
            'password'  => bcrypt('password123'),
            'role'      => 'admin_bimbel',
            'phone'     => '081234567890',
            'is_active' => true,
        ]);
    }

    public function test_admin_bimbel_can_view_users_list_and_quota()
    {
        User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Tutor Matematika',
            'email'     => 'tutor@bimbelhebat.com',
            'password'  => bcrypt('password123'),
            'role'      => 'tutor',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminBimbel, 'sanctum')
            ->getJson('/api/users');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'data',
                'quota' => [
                    'current_tutors',
                    'current_siswa',
                    'total_users',
                ]
            ]);
    }

    public function test_admin_bimbel_can_create_tutor_and_siswa()
    {
        $payload = [
            'name'     => 'Budi Siswa',
            'email'    => 'budi@siswa.com',
            'password' => 'secret123',
            'role'     => 'siswa',
            'phone'    => '081122334455',
        ];

        $response = $this->actingAs($this->adminBimbel, 'sanctum')
            ->postJson('/api/users', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'name'      => 'Budi Siswa',
                    'email'     => 'budi@siswa.com',
                    'role'      => 'siswa',
                    'tenant_id' => $this->tenant->id,
                    'is_active' => true,
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'email'     => 'budi@siswa.com',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_creation_is_rejected_when_package_quota_exceeded_er_1_2()
    {
        // Buat paket dengan kapasitas hanya 1 user
        $package = SubscriptionPackage::create([
            'name'          => 'Paket Hemat',
            'price'         => 100000,
            'duration_days' => 30,
            'max_users'     => 1,
            'is_active'     => true,
        ]);

        Subscription::create([
            'tenant_id'  => $this->tenant->id,
            'package_id' => $package->id,
            'start_date' => now(),
            'end_date'   => now()->addDays(30),
            'status'     => 'aktif',
        ]);

        // Isi kuota dengan 1 tutor
        User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Tutor Existing',
            'email'     => 'existing@bimbel.com',
            'password'  => bcrypt('password123'),
            'role'      => 'tutor',
            'is_active' => true,
        ]);

        // Coba tambah siswa baru -> harus ditolak karena max_users = 1
        $response = $this->actingAs($this->adminBimbel, 'sanctum')
            ->postJson('/api/users', [
                'name'     => 'Siswa Gagal',
                'email'    => 'gagal@siswa.com',
                'password' => 'secret123',
                'role'     => 'siswa',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_multi_tenant_isolation_prevents_accessing_other_bimbel_users_er_2_2()
    {
        $otherTenant = Tenant::create([
            'name'   => 'Bimbel Lain',
            'slug'   => 'bimbel-lain',
            'status' => 'aktif',
        ]);

        $otherUser = User::create([
            'tenant_id' => $otherTenant->id,
            'name'      => 'Siswa Bimbel Lain',
            'email'     => 'other@bimbellain.com',
            'password'  => bcrypt('password123'),
            'role'      => 'siswa',
            'is_active' => true,
        ]);

        // Admin Bimbel Hebat mencoba akses siswa milik Bimbel Lain
        $response = $this->actingAs($this->adminBimbel, 'sanctum')
            ->getJson("/api/users/{$otherUser->id}");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_admin_bimbel_can_toggle_user_active_status()
    {
        $siswa = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Siswa Mau Dinonaktifkan',
            'email'     => 'nonaktif@siswa.com',
            'password'  => bcrypt('password123'),
            'role'      => 'siswa',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminBimbel, 'sanctum')
            ->patchJson("/api/users/{$siswa->id}/status", [
                'is_active' => false,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'is_active' => false,
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'id'        => $siswa->id,
            'is_active' => false,
        ]);
    }

    public function test_admin_bimbel_cannot_deactivate_or_delete_self()
    {
        // Deactivate self
        $toggleRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->patchJson("/api/users/{$this->adminBimbel->id}/status", [
                'is_active' => false,
            ]);
        $toggleRes->assertStatus(400);

        // Delete self
        $deleteRes = $this->actingAs($this->adminBimbel, 'sanctum')
            ->deleteJson("/api/users/{$this->adminBimbel->id}");
        $deleteRes->assertStatus(400);
    }

    public function test_siswa_cannot_access_user_management_endpoint()
    {
        $siswa = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Siswa Biasa',
            'email'     => 'biasa@siswa.com',
            'password'  => bcrypt('password123'),
            'role'      => 'siswa',
            'is_active' => true,
        ]);

        $response = $this->actingAs($siswa, 'sanctum')
            ->getJson('/api/users');

        $response->assertStatus(403);
    }
}
