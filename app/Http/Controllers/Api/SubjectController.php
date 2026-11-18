<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    /**
     * Tampilkan daftar mata pelajaran (terisolasi per tenant).
     */
    public function index(Request $request)
    {
        $query = Subject::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $subjects = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data'    => $subjects,
        ], 200);
    }

    /**
     * Buat mata pelajaran baru.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'      => 'required|string|max:100',
            'code'      => 'nullable|string|max:20',
            'tenant_id' => 'nullable|exists:tenants,id',
        ]);

        $subjectData = [
            'name' => $request->name,
            'code' => $request->code,
        ];

        // Jika super_admin menentukan tenant_id secara manual
        if (auth()->user()->role === 'super_admin' && $request->filled('tenant_id')) {
            $subjectData['tenant_id'] = $request->tenant_id;
        }

        $subject = Subject::create($subjectData);

        return response()->json([
            'success' => true,
            'message' => 'Mata pelajaran berhasil ditambahkan.',
            'data'    => $subject,
        ], 201);
    }

    /**
     * Detail satu mata pelajaran.
     */
    public function show($id)
    {
        $subject = Subject::find($id);

        if (!$subject) {
            return response()->json([
                'success' => false,
                'message' => 'Mata pelajaran tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $subject,
        ], 200);
    }

    /**
     * Perbarui mata pelajaran.
     */
    public function update(Request $request, $id)
    {
        $subject = Subject::find($id);

        if (!$subject) {
            return response()->json([
                'success' => false,
                'message' => 'Mata pelajaran tidak ditemukan.',
            ], 404);
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'code' => 'nullable|string|max:20',
        ]);

        $subject->update($request->only(['name', 'code']));

        return response()->json([
            'success' => true,
            'message' => 'Mata pelajaran berhasil diperbarui.',
            'data'    => $subject,
        ], 200);
    }

    /**
     * Hapus mata pelajaran.
     */
    public function destroy($id)
    {
        $subject = Subject::find($id);

        if (!$subject) {
            return response()->json([
                'success' => false,
                'message' => 'Mata pelajaran tidak ditemukan.',
            ], 404);
        }

        $subject->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mata pelajaran berhasil dihapus.',
        ], 200);
    }
}
