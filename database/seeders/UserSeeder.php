<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat Bimbel / Tenant Contoh
        $tenant = Tenant::create([
            'name'   => 'Bimbel Geya Nawasena',
            'slug'   => 'geya-nawasena',
            'status' => 'aktif',
        ]);

        // 2. Akun Super Admin Platform (tanpa tenant)
        User::create([
            'name'      => 'Super Admin BIMS',
            'email'     => 'superadmin@bims.com',
            'password'  => Hash::make('password123'),
            'role'      => 'super_admin',
            'is_active' => true,
        ]);

        // 3. Akun Admin Bimbel
        User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Admin Bimbel Geya',
            'email'     => 'admin@geya.com',
            'password'  => Hash::make('password123'),
            'role'      => 'admin_bimbel',
            'is_active' => true,
        ]);

        // 4. Akun Tutor
        User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Tutor Budi',
            'email'     => 'tutor@geya.com',
            'password'  => Hash::make('password123'),
            'role'      => 'tutor',
            'is_active' => true,
        ]);

        // 5. Akun Siswa
        User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Siswa Rani',
            'email'     => 'siswa@geya.com',
            'password'  => Hash::make('password123'),
            'role'      => 'siswa',
            'is_active' => true,
        ]);
    }
}