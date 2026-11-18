<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TenantApprovalController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Endpoint Publik
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);
Route::get('/packages', [PackageController::class, 'index']);
Route::post('/midtrans-callback', [PaymentController::class, 'callback']);

// Endpoint Terproteksi Token
Route::middleware('auth:sanctum')->group(function () {
    // Profil & Sesi
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

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
});
