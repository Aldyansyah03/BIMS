<?php

namespace Tests\Feature;

use App\Models\SubscriptionPackage;
use App\Models\User;
use App\Models\Invoice;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnboardingFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_onboarding_registration_flow(): void
    {
        // Siapkan paket langganan aktif
        $package = SubscriptionPackage::firstOrCreate(
            ['name' => 'Paket Uji Onboarding'],
            [
                'price' => 150000,
                'duration_days' => 30,
                'max_users' => 50,
                'is_active' => true,
            ]
        );

        $testEmail = 'onboarding_test_' . time() . '@example.com';

        // 1. TAHAP 1: Registrasi Akun
        $registerRes = $this->postJson('/api/register', [
            'name'                  => 'Budi Prakoso',
            'email'                 => $testEmail,
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'phone'                 => '081298765432',
            'package_id'            => $package->id,
        ]);

        $registerRes->assertStatus(201);
        $registerRes->assertJsonPath('success', true);
        $this->assertEquals('verify_email', $registerRes->json('data.next_step'));

        $verificationToken = $registerRes->json('data.verification_token');
        $this->assertNotEmpty($verificationToken);

        // Sebelum verifikasi: Akun BELUM ada di database users (staging di Cache)!
        $this->assertNull(User::where('email', $testEmail)->first());

        // 2. TAHAP 2 (Gate): Pengguna belum terverifikasi ditolak saat mencoba checkout
        $checkoutFailRes = $this->postJson('/api/payment/checkout-registration', [
            'package_id' => $package->id,
        ]);
        $checkoutFailRes->assertStatus(401);

        // 2. TAHAP 2: Verifikasi Email Berhasil
        $verifyRes = $this->postJson('/api/verify-email', [
            'token' => $verificationToken,
            'email' => $testEmail,
        ]);

        $verifyRes->assertStatus(200);
        $this->assertTrue($verifyRes->json('success'));
        $this->assertEquals('payment', $verifyRes->json('data.next_step'));

        $token = $verifyRes->json('data.token');
        $this->assertNotEmpty($token);

        // BARU SEKARANG pengguna tersimpan resmi di database users dan sudah terverifikasi!
        $user = User::where('email', $testEmail)->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);
        $this->assertEquals('payment', $user->onboarding_step);

        // 3. TAHAP 3: Inisiasi Pembayaran setelah verifikasi email berhasil
        $checkoutRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payment/checkout-registration', [
                'package_id' => $package->id,
            ]);

        $checkoutRes->assertStatus(200);
        $this->assertTrue($checkoutRes->json('success'));
        $orderId = $checkoutRes->json('data.order_id');
        $this->assertNotEmpty($orderId);

        // Simulasi Pembayaran Sukses via check-registration
        $payConfirmRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payment/check-registration', [
                'order_id'     => $orderId,
                'mock_confirm' => true,
                'status'       => 'success',
            ]);

        $payConfirmRes->assertStatus(200);
        $this->assertTrue($payConfirmRes->json('paid'));
        $this->assertEquals('complete_profile', $payConfirmRes->json('next_step'));

        $user->refresh();
        $this->assertEquals('complete_profile', $user->onboarding_step);

        // 4. TAHAP 4: Melengkapi Profil Bimbel
        $uniqueSlug = 'pelita-uji-' . time();
        $completeProfileRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/complete-profile', [
                'bimbel_name'    => 'Bimbel Pelita Masa Depan',
                'city'           => 'Jakarta Selatan',
                'address'        => 'Jl. Rasuna Said No. 10',
                'workspace_slug' => $uniqueSlug,
                'phone'          => '081298765432',
                'description'    => 'Bimbingan belajar modern persiapan UTBK dan Kedinasan.',
            ]);

        $completeProfileRes->assertStatus(200);
        $this->assertTrue($completeProfileRes->json('success'));

        $user->refresh();
        $this->assertEquals('completed', $user->onboarding_step);
        $this->assertTrue((bool) $user->onboarding_completed);
        $this->assertFalse((bool) $user->welcome_shown); // Siap untuk trigger modal selamat datang di dashboard

        $tenant = $user->tenant;
        $this->assertNotNull($tenant);
        $this->assertEquals('aktif', $tenant->status); // Otomatis aktif tanpa perlu manual approval Super Admin!
        $this->assertEquals($uniqueSlug, $tenant->slug);

        // 5. TAHAP 5: Dismiss Sambutan di Dashboard
        $dismissRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/user/dismiss-welcome');

        $dismissRes->assertStatus(200);
        $this->assertTrue($dismissRes->json('success'));

        $user->refresh();
        $this->assertTrue((bool) $user->welcome_shown);
    }

    public function test_registration_rejects_fake_or_nonexistent_email_domains()
    {
        $package = SubscriptionPackage::firstOrCreate(
            ['name' => 'Paket Uji Email'],
            ['price' => 100000, 'duration_days' => 30, 'max_users' => 10, 'is_active' => true]
        );

        // 1. Coba daftar dengan domain typo (gmai.com)
        $typoRes = $this->postJson('/api/register', [
            'name'                  => 'Pengetik Typo',
            'email'                 => 'user@gmai.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'package_id'            => $package->id,
        ]);
        $typoRes->assertStatus(422);
        $typoRes->assertJsonValidationErrors('email');

        // 2. Coba daftar dengan domain palsu yang tidak ada di DNS
        $fakeDomainRes = $this->postJson('/api/register', [
            'name'                  => 'Domain Palsu',
            'email'                 => 'user@nonexistentdomain123987fakedomain.org',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'package_id'            => $package->id,
        ]);
        $fakeDomainRes->assertStatus(422);
        $fakeDomainRes->assertJsonValidationErrors('email');

        // 3. Coba daftar dengan disposable email (mailinator.com)
        $disposableRes = $this->postJson('/api/register', [
            'name'                  => 'Disposable User',
            'email'                 => 'user@mailinator.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'package_id'            => $package->id,
        ]);
        $disposableRes->assertStatus(422);
        $disposableRes->assertJsonValidationErrors('email');
    }

    public function test_verify_email_strictly_requires_token_and_rejects_bypass()
    {
        $package = SubscriptionPackage::firstOrCreate(
            ['name' => 'Paket Uji Verifikasi Token'],
            ['price' => 100000, 'duration_days' => 30, 'max_users' => 10, 'is_active' => true]
        );

        $testEmail = 'user_strict_' . time() . '@example.com';
        $registerRes = $this->postJson('/api/register', [
            'name'                  => 'User Verifikasi Ketat',
            'email'                 => $testEmail,
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'package_id'            => $package->id,
        ]);
        $registerRes->assertStatus(201);
        $verificationToken = $registerRes->json('data.verification_token');
        $this->assertNotEmpty($verificationToken);

        // Sebelum verifikasi: Akun BELUM ada di database users (database bersih)!
        $this->assertNull(User::where('email', $testEmail)->first());

        // 1. Coba verifikasi dengan token direct / bypass -> HARUS DITOLAK
        $bypassRes = $this->postJson('/api/verify-email', [
            'email' => $testEmail,
            'token' => 'direct',
        ]);
        $bypassRes->assertStatus(400);
        $bypassRes->assertJsonPath('success', false);

        // 2. Coba verifikasi dengan token salah -> HARUS DITOLAK
        $wrongTokenRes = $this->postJson('/api/verify-email', [
            'email' => $testEmail,
            'token' => 'token_palsu_yang_salah',
        ]);
        $wrongTokenRes->assertStatus(400);

        // Pastikan akun di database TETAP belum dibuat
        $this->assertNull(User::where('email', $testEmail)->first());

        // 3. Verifikasi dengan token asli dari email -> BERHASIL
        $validRes = $this->postJson('/api/verify-email', [
            'email' => $testEmail,
            'token' => $verificationToken,
        ]);
        $validRes->assertStatus(200);
        $validRes->assertJsonPath('success', true);

        // BARU SEKARANG pengguna tersimpan di database dan langsung terverifikasi
        $user = User::where('email', $testEmail)->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);
        $this->assertEquals('payment', $user->onboarding_step);
    }
}
