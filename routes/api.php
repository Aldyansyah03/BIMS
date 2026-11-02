<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\TenantApprovalController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Endpoint Publik
Route::post('/login', [AuthController::class, 'login']);
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
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::patch('/users/{id}/status', [UserController::class, 'toggleStatus']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });
});
