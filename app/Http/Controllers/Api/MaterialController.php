<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Classroom;
use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MaterialController extends Controller
{
    /**
     * Ambil daftar materi per kelas (Tutor / Siswa / Admin).
     * Sesuai format tutorService.js -> getMaterials(classId)
     */
    public function getMaterialsByClass($classId)
    {
        $classroom = Classroom::find($classId);

        if (!$classroom) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan.',
            ], 404);
        }

        $materials = Material::where('classroom_id', $classroom->id)
            ->with('tutor:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $materials,
        ], 200);
    }

    /**
     * Unggah / terbitkan materi baru (PDF atau Tautan Video).
     * Sesuai format tutorService.js -> publishMaterial(classId, formData)
     * Aturan ER-4.1: Validasi mime-type application/pdf dan ukuran maksimal 20 MB (20480 KB).
     */
    public function publishMaterial(Request $request, $classId)
    {
        $classroom = Classroom::find($classId);

        if (!$classroom) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak ditemukan.',
            ], 404);
        }

        $request->validate([
            'title'     => 'required|string|max:200',
            'file'      => 'nullable|file|mimes:pdf|max:20480', // Maksimal 20 MB - ER-4.1
            'video_url' => 'nullable|url|max:255',
        ], [
            'file.mimes' => 'Format berkas harus berupa dokumen PDF.',
            'file.max'   => 'Ukuran file PDF melebihi batas maksimal 20 MB (ER-4.1).',
            'video_url.url' => 'Tautan video harus berupa URL yang valid (https://...).',
        ]);

        if (!$request->hasFile('file') && !$request->filled('video_url')) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan unggah berkas PDF atau masukkan tautan video pembelajaran.',
            ], 422);
        }

        $user = auth()->user();
        $filePath = null;
        $fileSizeKb = null;
        $type = 'video';

        if ($request->hasFile('file')) {
            $type = 'pdf';
            $file = $request->file('file');
            $fileSizeKb = (int) round($file->getSize() / 1024);

            // 1. Upload langsung ke Supabase Storage via REST API (bucket 'materials') jika bukan di environment testing
            $supabaseUrl = env('SUPABASE_URL', 'https://isxkzbrswxqdlswmupzt.supabase.co');
            $supabaseKey = env('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzeGt6YnJzd3hxZGxzd211cHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4OTA2MzUsImV4cCI6MjEwODQ2NjYzNX0.QezwvGIg3iqhJzwAmz_0PceU2nKYibuUflN_bE1vDOM');
            $bucket = env('AWS_BUCKET', 'materials');

            if (!app()->environment('testing') && !empty($supabaseUrl) && !empty($supabaseKey)) {
                try {
                    $ext = $file->getClientOriginalExtension() ?: 'pdf';
                    $filename = 'materials/' . Str::uuid() . '.' . $ext;
                    $endpoint = rtrim($supabaseUrl, '/') . "/storage/v1/object/{$bucket}/{$filename}";
                    $mimeType = $file->getMimeType() ?: 'application/pdf';

                    $response = Http::withHeaders([
                        'apikey'        => $supabaseKey,
                        'Authorization' => 'Bearer ' . $supabaseKey,
                        'Content-Type'  => $mimeType,
                    ])->withBody(file_get_contents($file->getRealPath()), $mimeType)
                      ->post($endpoint);

                    if ($response->successful()) {
                        $filePath = rtrim($supabaseUrl, '/') . "/storage/v1/object/public/{$bucket}/{$filename}";
                    } else {
                        Log::warning('Supabase Storage Material upload gagal: ' . $response->body());
                    }
                } catch (\Throwable $e) {
                    Log::warning('Supabase Storage Material upload exception: ' . $e->getMessage());
                }
            }

            // 2. Fallback ke disk S3 atau local public disk
            if (!$filePath) {
                $disk = config('filesystems.default') === 's3' && !empty(config('filesystems.disks.s3.key')) ? 's3' : 'public';
                $filePath = $file->store('materials', $disk);
            }
        }

        $material = Material::create([
            'tenant_id'    => $classroom->tenant_id,
            'classroom_id' => $classroom->id,
            'tutor_id'     => $user->id,
            'title'        => $request->title,
            'type'         => $type,
            'file_path'    => $filePath,
            'video_url'    => $request->video_url,
            'file_size_kb' => $fileSizeKb,
        ]);

        // Catat Audit Trail (MR-7)
        ActivityLog::record('UPLOAD_MATERIAL', [
            'material_id'  => $material->id,
            'classroom_id' => $classroom->id,
            'title'        => $material->title,
            'type'         => $material->type,
        ], $user);

        return response()->json([
            'success' => true,
            'message' => 'Materi pembelajaran berhasil diterbitkan.',
            'data'    => $material->load('tutor:id,name'),
        ], 201);
    }

    /**
     * Hapus materi belajar.
     * Sesuai format tutorService.js -> deleteMaterial(materialId)
     */
    public function deleteMaterial($materialId)
    {
        $material = Material::find($materialId);

        if (!$material) {
            return response()->json([
                'success' => false,
                'message' => 'Materi tidak ditemukan.',
            ], 404);
        }

        // Hapus file fisik jika berupa PDF
        $disk = config('filesystems.default') === 's3' || env('FILESYSTEM_DISK') === 's3' ? 's3' : 'public';
        if ($material->file_path && Storage::disk($disk)->exists($material->file_path)) {
            Storage::disk($disk)->delete($material->file_path);
        }

        $materialIdSaved = $material->id;
        $titleSaved = $material->title;
        $material->delete();

        // Catat Audit Trail (MR-7)
        ActivityLog::record('DELETE_MATERIAL', [
            'material_id' => $materialIdSaved,
            'title'       => $titleSaved,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Materi berhasil dihapus.',
        ], 200);
    }

    /**
     * Daftar materi terbaru untuk siswa di seluruh kelas yang diikutinya.
     * Sesuai format studentService.js -> getMyMaterials(limit)
     */
    public function getStudentMaterials(Request $request)
    {
        $user = auth()->user();
        $limit = (int) $request->query('limit', 10);

        // Ambil kelas yang diikuti oleh siswa
        $classroomIds = $user->classrooms()
            ->wherePivot('role_in_class', 'siswa')
            ->pluck('classrooms.id');

        $materials = Material::with(['classroom:id,name', 'tutor:id,name'])
            ->whereIn('classroom_id', $classroomIds)
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $materials,
        ], 200);
    }
}
