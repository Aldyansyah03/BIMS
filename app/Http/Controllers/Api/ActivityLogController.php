<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Tampilkan riwayat log aktivitas (Audit Trail MR-7).
     * Khusus Admin Bimbel (tenant terkait) & Super Admin (seluruh platform).
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = ActivityLog::with('user:id,name,email,role');

        if ($request->filled('action')) {
            $query->where('action', strtoupper($request->action));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => $logs,
        ], 200);
    }

    /**
     * Detail satu log aktivitas.
     */
    public function show($id)
    {
        $log = ActivityLog::with(['user:id,name,email,role', 'tenant:id,name'])->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Catatan aktivitas tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $log,
        ], 200);
    }
}
