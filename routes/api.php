<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\ExamResultController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\StudentExamController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TenantApprovalController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Endpoint Publik
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
Route::post('/check-email-verified', [AuthController::class, 'checkEmailVerified']);
Route::post('/register/initiate', [PaymentController::class, 'initiateRegistration']); // Inisiasi pembayaran tanpa simpan ke DB
Route::post('/payment/confirm-registration', [PaymentController::class, 'confirmRegistration']); // Konfirmasi pembayaran client
Route::get('/packages', [PackageController::class, 'index']);
Route::post('/midtrans-callback', [PaymentController::class, 'callback']);

// Endpoint Terproteksi Token
Route::middleware('auth:sanctum')->group(function () {
    // Profil & Sesi
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/user/dismiss-welcome', [AuthController::class, 'dismissWelcome']);

    // Alur Onboarding (Verifikasi -> Pembayaran -> Profil)
    Route::post('/payment/checkout-registration', [PaymentController::class, 'checkoutRegistration']);
    Route::post('/payment/check-registration', [PaymentController::class, 'checkRegistrationPayment']);
    Route::post('/complete-profile', [AuthController::class, 'completeProfile']);

    // ========== FITUR INVOICE & LANGGANAN (MODUL 1) ==========
    Route::post('/checkout', [PaymentController::class, 'checkout']);
    Route::get('/my-invoices', [PaymentController::class, 'myInvoices']);      // Untuk Admin Bimbel
    Route::get('/admin/invoices', [PaymentController::class, 'allInvoices']);   // Untuk Super Admin
    
    // Khusus Super Admin (Paket & Approval Bimbel)
    Route::post('/admin/packages', [PackageController::class, 'store']);
    Route::get('/admin/tenants', [TenantApprovalController::class, 'index']);
    Route::patch('/admin/tenants/{id}/status', [TenantApprovalController::class, 'updateStatus']);

    // ========== FITUR PENGGUNA & HAK AKSES (MODUL 2) ==========
    Route::middleware('role:admin_bimbel,super_admin')->group(function () {
        // Format Standard /users
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::patch('/users/{id}/status', [UserController::class, 'toggleStatus']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        // Format /admin/users (Kompatibel dengan Frontend & Spesifikasi Khusus Admin)
        Route::prefix('admin')->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::get('/users/{id}', [UserController::class, 'show']);
            Route::put('/users/{id}', [UserController::class, 'update']);
            Route::patch('/users/{id}/toggle-active', [UserController::class, 'toggleStatus']);
            Route::patch('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
            Route::delete('/users/{id}', [UserController::class, 'destroy']);
        });

        // Subjects CRUD
        Route::post('/subjects', [SubjectController::class, 'store']);
        Route::put('/subjects/{id}', [SubjectController::class, 'update']);
        Route::delete('/subjects/{id}', [SubjectController::class, 'destroy']);

        // Classrooms CRUD
        Route::post('/classrooms', [ClassroomController::class, 'store']);
        Route::put('/classrooms/{id}', [ClassroomController::class, 'update']);
        Route::delete('/classrooms/{id}', [ClassroomController::class, 'destroy']);

        // Classroom Members (ER-3.1)
        Route::post('/classrooms/{id}/members', [ClassroomController::class, 'addMember']);
        Route::delete('/classrooms/{id}/members/{userId}', [ClassroomController::class, 'removeMember']);

        // Schedules CRUD (ER-3.2)
        Route::post('/schedules', [ScheduleController::class, 'store']);
        Route::put('/schedules/{id}', [ScheduleController::class, 'update']);
        Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy']);
    });

    // ========== FITUR AKADEMIK & MANAJEMEN PEMBELAJARAN (MODUL 3) ==========
    // Endpoint Baca (Admin, Tutor, Siswa)
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/subjects/{id}', [SubjectController::class, 'show']);

    Route::get('/classrooms', [ClassroomController::class, 'index']);
    Route::get('/classrooms/{id}', [ClassroomController::class, 'show']);
    Route::get('/classrooms/{id}/members', [ClassroomController::class, 'getMembers']);

    Route::get('/schedules', [ScheduleController::class, 'index']);
    Route::get('/schedules/{id}', [ScheduleController::class, 'show']);

    // ========== FITUR CBT ONLINE & EVALUASI NILAI (MODUL 5 & 6) ==========
    // Khusus Tutor, Admin Bimbel, Super Admin
    Route::middleware('role:tutor,admin_bimbel,super_admin')->group(function () {
        Route::get('/exams', [ExamController::class, 'index']);
        Route::post('/exams', [ExamController::class, 'store']);
        Route::get('/exams/{id}', [ExamController::class, 'show']);
        Route::put('/exams/{id}', [ExamController::class, 'update']);
        Route::delete('/exams/{id}', [ExamController::class, 'destroy']);
        Route::patch('/exams/{id}/publish', [ExamController::class, 'togglePublish']);

        // Bank Soal
        Route::get('/exams/{id}/questions', [ExamController::class, 'getQuestions']);
        Route::post('/exams/{id}/questions', [ExamController::class, 'addQuestion']);
        Route::delete('/exams/{id}/questions/{questionId}', [ExamController::class, 'deleteQuestion']);

        // Rekap Nilai
        Route::get('/exams/{id}/results', [ExamController::class, 'getResults']);
    });

    // Khusus Siswa
    Route::middleware('role:siswa')->prefix('student')->group(function () {
        Route::get('/exams', [StudentExamController::class, 'index']);
        Route::post('/exams/{id}/start', [StudentExamController::class, 'start']);
        Route::get('/exams/{id}/questions', [StudentExamController::class, 'getQuestions']);
        Route::post('/exams/{id}/answer', [StudentExamController::class, 'saveAnswer']);
        Route::post('/exams/{id}/submit', [StudentExamController::class, 'submit']);

        // Hasil Ujian Siswa (MR-6)
        Route::get('/exam-results', [ExamResultController::class, 'getStudentHistory']);
        Route::get('/exam-results/{resultId}', [ExamResultController::class, 'getStudentResult']);

        // Materi Belajar Siswa (MR-4)
        Route::get('/materials', [MaterialController::class, 'getStudentMaterials']);
    });

    // ========== FITUR DISTRIBUSI MATERI & REKAP KELAS TUTOR (MODUL 4 & 6) ==========
    Route::middleware('role:tutor,admin_bimbel,super_admin')->prefix('tutor')->group(function () {
        // Materi Belajar (MR-4)
        Route::get('/classes/{classId}/materials', [MaterialController::class, 'getMaterialsByClass']);
        Route::post('/classes/{classId}/materials', [MaterialController::class, 'publishMaterial']);
        Route::delete('/materials/{materialId}', [MaterialController::class, 'deleteMaterial']);

        // Rekap Nilai (MR-6)
        Route::get('/classes/{classId}/results', [ExamResultController::class, 'getClassResults']);
        Route::get('/classes/{classId}/results/export', [ExamResultController::class, 'exportClassResults']);
    });

    // ========== FITUR DASHBOARD & AUDIT LOG ADMIN (MODUL 6 & 7) ==========
    Route::middleware('role:admin_bimbel,super_admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [ExamResultController::class, 'getAdminDashboard']);
        Route::get('/performance/export', [ExamResultController::class, 'exportPerformance']);

        // Audit Trail & Activity Logs (MR-7)
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
        Route::get('/activity-logs/{id}', [ActivityLogController::class, 'show']);
    });
});
