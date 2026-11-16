<?php

namespace Database\Seeders;

use App\Models\SubscriptionPackage;
use Illuminate\Database\Seeder;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        SubscriptionPackage::create([
            'name'          => 'Paket Bulanan Starter',
            'price'         => 150000,
            'duration_days' => 30,
            'max_users'     => 30,
            'description'   => 'Kapasitas 30 siswa, aktif selama 30 hari.',
            'is_active'     => true,
        ]);

        SubscriptionPackage::create([
            'name'          => 'Paket Bulanan Pro',
            'price'         => 350000,
            'duration_days' => 30,
            'max_users'     => 100,
            'description'   => 'Kapasitas 100 siswa, aktif selama 30 hari.',
            'is_active'     => true,
        ]);
    }
}