<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;

class TenantApprovalController extends Controller
{
    // Super Admin: Melihat daftar pendaftaran bimbel (tenant)
    public function index(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya Super Admin yang berhak mengakses menu ini.'
            ], 403);
        }

        $query = Tenant::with(['users' => function ($q) {
            $q->where('role', 'admin_bimbel');
        }]);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $tenants = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data'    => $tenants
        ]);
    }

    // Super Admin: Menyetujui / Menolak pendaftaran bimbel (ER-1.1)
    public function updateStatus(Request $request, $id)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya Super Admin yang berhak menyetujui bimbel.'
            ], 403);
        }

        $request->validate([
            'status' => 'required|in:menunggu,aktif,ditolak,nonaktif',
        ]);

        $tenant = Tenant::findOrFail($id);

        $data = [
            'status' => $request->status,
        ];

        // Jika disetujui (aktif), catat approval metadata bila kolom tersedia
        if ($request->status === 'aktif') {
            $data['approved_at'] = now();
            $data['approved_by'] = $request->user()->id;
        }

        $tenant->update($data);

        return response()->json([
            'success' => true,
            'message' => "Status bimbel {$tenant->name} berhasil diubah menjadi {$request->status}.",
            'data'    => $tenant
        ]);
    }
}
