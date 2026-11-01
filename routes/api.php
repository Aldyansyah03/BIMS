<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\TenantApprovalController;
use Illuminate\Support\Facades\Route;

// Endpoint Publik
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/packages', [PackageController::class, 'index']);
Route::post('/midtrans-callback', [PaymentController::class, 'callback']);
// Endpoint Terproteksi Token
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/checkout', [PaymentController::class, 'checkout']);

       // ========== FITUR INVOICE (MODUL 1) ==========
    Route::get('/my-invoices', [PaymentController::class, 'myInvoices']);      // Untuk Admin Bimbel
    Route::get('/admin/invoices', [PaymentController::class, 'allInvoices']);   // Untuk Super Admin
    
    // Khusus Super Admin (Paket & Approval Bimbel)
    Route::post('/admin/packages', [PackageController::class, 'store']);
    Route::get('/admin/tenants', [TenantApprovalController::class, 'index']);
    Route::patch('/admin/tenants/{id}/status', [TenantApprovalController::class, 'updateStatus']);
});