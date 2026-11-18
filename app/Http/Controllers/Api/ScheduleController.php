<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    /**
     * Tampilkan jadwal belajar.
     * Siswa melihat jadwal kelas yang diikutinya.
     * Tutor melihat jadwal kelas yang diajarnya.
     * Admin melihat seluruh jadwal tenant.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Schedule::with([
            'classroom:id,name,academic_year,is_active',
            'subject:id,name,code',
            'tutor:id,name,email,phone',
        ]);

        if ($user->role === 'tutor') {
            $query->where('tutor_id', $user->id);
        } elseif ($user->role === 'siswa') {
            $classroomIds = $user->classrooms()->pluck('classrooms.id');
            $query->whereIn('classroom_id', $classroomIds);
        }

        if ($request->filled('classroom_id')) {
            $query->where('classroom_id', $request->classroom_id);
        }

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->filled('tutor_id')) {
            $query->where('tutor_id', $request->tutor_id);
        }

        if ($request->filled('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }

        $schedules = $query->orderBy('day_of_week', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $schedules,
        ], 200);
    }

    /**
     * Tambah jadwal baru dengan validasi bentrok (ER-3.2).
     */
    public function store(Request $request)
    {
        $request->validate([
            'classroom_id' => 'required|exists:classrooms,id',
            'subject_id'   => 'required|exists:subjects,id',
            'tutor_id'     => 'required|exists:users,id',
            'day_of_week'  => 'required|integer|between:1,7',
            'start_time'   => 'required|date_format:H:i',
            'end_time'     => 'required|date_format:H:i|after:start_time',
            'room_or_link' => 'nullable|string|max:255',
            'tenant_id'    => 'nullable|exists:tenants,id',
        ]);

        $classroom = Classroom::find($request->classroom_id);
        $subject   = Subject::find($request->subject_id);
        $tutor     = User::find($request->tutor_id);

        // Pastikan tutor berstatus role 'tutor'
        if ($tutor->role !== 'tutor') {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna yang dipilih bukan seorang Tutor.',
            ], 422);
        }

        // Validasi kesesuaian tenant
        $tenantId = auth()->user()->tenant_id;
        if ($classroom->tenant_id && $classroom->tenant_id !== $tenantId && auth()->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak valid untuk tenant Anda.',
            ], 422);
        }

        // ================= ER-3.2 VALIDASI BENTROK JADWAL =================

        // 1. Validasi Bentrok Pengajar (Tutor)
        $tutorClash = Schedule::where('tutor_id', $request->tutor_id)
            ->where('day_of_week', $request->day_of_week)
            ->where(function ($q) use ($request) {
                $q->where('start_time', '<', $request->end_time)
                  ->where('end_time', '>', $request->start_time);
            })
            ->with(['classroom:id,name', 'subject:id,name'])
            ->first();

        if ($tutorClash) {
            return response()->json([
                'success' => false,
                'message' => "Jadwal bentrok: Tutor {$tutor->name} sudah memiliki jadwal mengajar di {$tutorClash->classroom->name} ({$tutorClash->start_time} - {$tutorClash->end_time}).",
            ], 422);
        }

        // 2. Validasi Bentrok Kelas
        $classroomClash = Schedule::where('classroom_id', $request->classroom_id)
            ->where('day_of_week', $request->day_of_week)
            ->where(function ($q) use ($request) {
                $q->where('start_time', '<', $request->end_time)
                  ->where('end_time', '>', $request->start_time);
            })
            ->with(['subject:id,name', 'tutor:id,name'])
            ->first();

        if ($classroomClash) {
            return response()->json([
                'success' => false,
                'message' => "Jadwal bentrok: Kelas {$classroom->name} sudah memiliki jadwal mapel {$classroomClash->subject->name} pada jam tersebut ({$classroomClash->start_time} - {$classroomClash->end_time}).",
            ], 422);
        }

        $scheduleData = [
            'classroom_id' => $request->classroom_id,
            'subject_id'   => $request->subject_id,
            'tutor_id'     => $request->tutor_id,
            'day_of_week'  => $request->day_of_week,
            'start_time'   => $request->start_time,
            'end_time'     => $request->end_time,
            'room_or_link' => $request->room_or_link,
        ];

        if (auth()->user()->role === 'super_admin' && $request->filled('tenant_id')) {
            $scheduleData['tenant_id'] = $request->tenant_id;
        }

        $schedule = Schedule::create($scheduleData);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal belajar berhasil ditambahkan.',
            'data'    => $schedule->load(['classroom', 'subject', 'tutor:id,name,email,phone']),
        ], 201);
    }

    /**
     * Detail satu jadwal.
     */
    public function show($id)
    {
        $schedule = Schedule::with([
            'classroom',
            'subject',
            'tutor:id,name,email,phone',
        ])->find($id);

        if (!$schedule) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $schedule,
        ], 200);
    }

    /**
     * Perbarui jadwal dengan validasi bentrok (ER-3.2).
     */
    public function update(Request $request, $id)
    {
        $schedule = Schedule::find($id);

        if (!$schedule) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal tidak ditemukan.',
            ], 404);
        }

        $request->validate([
            'classroom_id' => 'sometimes|required|exists:classrooms,id',
            'subject_id'   => 'sometimes|required|exists:subjects,id',
            'tutor_id'     => 'sometimes|required|exists:users,id',
            'day_of_week'  => 'sometimes|required|integer|between:1,7',
            'start_time'   => 'sometimes|required|date_format:H:i',
            'end_time'     => 'sometimes|required|date_format:H:i',
            'room_or_link' => 'nullable|string|max:255',
        ]);

        $classroomId = $request->input('classroom_id', $schedule->classroom_id);
        $subjectId   = $request->input('subject_id', $schedule->subject_id);
        $tutorId     = $request->input('tutor_id', $schedule->tutor_id);
        $dayOfWeek   = $request->input('day_of_week', $schedule->day_of_week);
        $startTime   = $request->input('start_time', substr($schedule->start_time, 0, 5));
        $endTime     = $request->input('end_time', substr($schedule->end_time, 0, 5));

        if ($startTime >= $endTime) {
            return response()->json([
                'success' => false,
                'message' => 'Waktu selesai harus lebih besar dari waktu mulai.',
            ], 422);
        }

        // Cek bentrok Tutor (abaikan jadwal ini sendiri)
        $tutorClash = Schedule::where('id', '!=', $schedule->id)
            ->where('tutor_id', $tutorId)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where('start_time', '<', $endTime)
                  ->where('end_time', '>', $startTime);
            })
            ->with('classroom:id,name')
            ->first();

        if ($tutorClash) {
            return response()->json([
                'success' => false,
                'message' => "Jadwal bentrok: Tutor sudah memiliki jadwal mengajar di {$tutorClash->classroom->name} ({$tutorClash->start_time} - {$tutorClash->end_time}).",
            ], 422);
        }

        // Cek bentrok Kelas (abaikan jadwal ini sendiri)
        $classroomClash = Schedule::where('id', '!=', $schedule->id)
            ->where('classroom_id', $classroomId)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where('start_time', '<', $endTime)
                  ->where('end_time', '>', $startTime);
            })
            ->with('subject:id,name')
            ->first();

        if ($classroomClash) {
            return response()->json([
                'success' => false,
                'message' => "Jadwal bentrok: Kelas sudah memiliki jadwal sesi lain pada rentang jam tersebut.",
            ], 422);
        }

        $schedule->update([
            'classroom_id' => $classroomId,
            'subject_id'   => $subjectId,
            'tutor_id'     => $tutorId,
            'day_of_week'  => $dayOfWeek,
            'start_time'   => $startTime,
            'end_time'     => $endTime,
            'room_or_link' => $request->has('room_or_link') ? $request->room_or_link : $schedule->room_or_link,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil diperbarui.',
            'data'    => $schedule->load(['classroom', 'subject', 'tutor:id,name,email,phone']),
        ], 200);
    }

    /**
     * Hapus jadwal.
     */
    public function destroy($id)
    {
        $schedule = Schedule::find($id);

        if (!$schedule) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal tidak ditemukan.',
            ], 404);
        }

        $schedule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil dihapus.',
        ], 200);
    }
}
