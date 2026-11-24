<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPackage;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    // Publik: Daftar paket untuk FE
    public function index()
    {
        $packages = SubscriptionPackage::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data'    => $packages
        ]);
    }

    // Super Admin: Menambah paket baru
    public function store(Request $request)
    {
        // 1. Cek role Super Admin
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Super Admin yang berhak menambah paket.'
            ], 403);
        }

        // 2. Validasi input
        $request->validate([
            'name'          => 'required|string|max:100',
            'price'         => 'required|numeric|min:0',
            'duration_days' => 'required|integer|min:1',
            'max_users'     => 'required|integer|min:1',
            'description'   => 'nullable|string',
        ]);

        // 3. Simpan ke database
        $package = SubscriptionPackage::create([
            'name'          => $request->name,
            'price'         => $request->price,
            'duration_days' => $request->duration_days,
            'max_users'     => $request->max_users,
            'description'   => $request->description,
            'is_active'     => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Paket langganan berhasil dibuat.',
            'data'    => $package
        ], 201);
    }
}