<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Subscription;
use App\Models\SubscriptionPackage;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;

class PaymentController extends Controller
{
    public function __construct()
    {
        Config::$serverKey    = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production');
        Config::$isSanitized  = config('services.midtrans.is_sanitized');
        Config::$is3ds        = config('services.midtrans.is_3ds');
    }

    // 0. Publik: Inisiasi pembayaran registrasi — data belum disimpan ke DB
    //    Data disimpan di cache dengan key = order_id, baru masuk DB saat webhook berhasil
    public function initiateRegistration(Request $request)
    {
        $request->validate([
            'tenant_name'  => 'required|string|max:150',
            'name'         => 'required|string|max:100',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:6|confirmed',
            'phone'        => 'nullable|string|max:20',
            'package_id'   => 'required|exists:subscription_packages,id',
        ]);

        $package = SubscriptionPackage::findOrFail($request->package_id);

        // Buat order ID unik — dipakai sebagai key cache dan order Midtrans
        $orderId = 'REG-' . strtoupper(Str::random(8)) . '-' . time();

        // Simpan semua data pendaftaran ke cache (TTL 24 jam)
        // Data ini BELUM masuk database sama sekali
        Cache::put('pending_registration_' . $orderId, [
            'tenant_name' => $request->tenant_name,
            'name'        => $request->name,
            'email'       => $request->email,
            'password'    => Hash::make($request->password),
            'phone'       => $request->phone,
            'package_id'  => $package->id,
            'order_id'    => $orderId,
        ], now()->addHours(24));

        // Parameter untuk Midtrans Snap
        $params = [
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => (int) $package->price,
            ],
            'customer_details' => [
                'first_name' => $request->name,
                'email'      => $request->email,
                'phone'      => $request->phone ?? '08123456789',
            ],
            'item_details' => [
                [
                    'id'       => $package->id,
                    'price'    => (int) $package->price,
                    'quantity' => 1,
                    'name'     => $package->name,
                ]
            ],
        ];

        $snapToken = Snap::getSnapToken($params);

        return response()->json([
            'success' => true,
            'message' => 'Silakan selesaikan pembayaran.',
            'data'    => [
                'snap_token'   => $snapToken,
                'order_id'     => $orderId,
                'amount'       => $package->price,
                'package_name' => $package->name,
            ]
        ], 200);
    }

    // 1. Buat Tagihan & Dapatkan Snap Token Midtrans
    public function checkout(Request $request)
    {
        $request->validate([
            'package_id' => 'required|exists:subscription_packages,id',
        ]);

        $user = $request->user();
        $package = SubscriptionPackage::findOrFail($request->package_id);
        $orderId = 'INV-' . time() . '-' . $user->tenant_id;

        // Catat periode langganan baru (status menunggu)
        $subscription = Subscription::create([
            'tenant_id'   => $user->tenant_id,
            'package_id'  => $package->id,
            'start_date'  => now(),
            'end_date'    => now()->addDays($package->duration_days),
            'status'      => 'menunggu_verifikasi',
        ]);

        // Parameter Midtrans
        $params = [
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => (int) $package->price,
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email'      => $user->email,
                'phone'      => $user->phone ?? '08123456789',
            ],
            'item_details' => [
                [
                    'id'       => $package->id,
                    'price'    => (int) $package->price,
                    'quantity' => 1,
                    'name'     => $package->name,
                ]
            ]
        ];

        // Minta Snap Token dari Midtrans
        $snapToken = Snap::getSnapToken($params);

        // Simpan data invoice
        $invoice = Invoice::create([
            'tenant_id'       => $user->tenant_id,
            'subscription_id' => $subscription->id,
            'invoice_number'  => $orderId,
            'amount'          => $package->price,
            'status'          => 'unpaid',
            'snap_token'      => $snapToken,
            'due_date'        => now()->addDays(1),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Snap Token berhasil dibuat.',
            'data'    => [
                'snap_token'     => $snapToken,
                'invoice_number' => $orderId,
                'amount'         => $package->price,
                'package_name'   => $package->name,
            ]
        ], 201);
    }

    // 2. Webhook Callback Otomatis dari Midtrans
    public function callback(Request $request)
    {
        $notif = new Notification();

        $transactionStatus = $notif->transaction_status;
        $orderId           = $notif->order_id;
        $fraudStatus       = $notif->fraud_status;

        // --- Cek apakah ini pembayaran registrasi baru (dari cache) ---
        $pendingReg = Cache::get('pending_registration_' . $orderId);

        if ($pendingReg) {
            // Hanya proses kalau pembayaran berhasil
            if (
                ($transactionStatus == 'capture' || $transactionStatus == 'settlement') &&
                ($fraudStatus == 'accept' || empty($fraudStatus))
            ) {
                DB::transaction(function () use ($pendingReg, $orderId) {
                    $package = SubscriptionPackage::findOrFail($pendingReg['package_id']);

                    // Buat slug unik
                    $slug = Str::slug($pendingReg['tenant_name']);
                    $originalSlug = $slug;
                    $count = 1;
                    while (Tenant::where('slug', $slug)->exists()) {
                        $slug = "{$originalSlug}-{$count}";
                        $count++;
                    }

                    // Simpan Tenant dengan status langsung aktif
                    $tenant = Tenant::create([
                        'name'   => $pendingReg['tenant_name'],
                        'slug'   => $slug,
                        'status' => 'aktif',
                    ]);

                    // Simpan User Admin Bimbel
                    $user = User::create([
                        'tenant_id' => $tenant->id,
                        'name'      => $pendingReg['name'],
                        'email'     => $pendingReg['email'],
                        'password'  => $pendingReg['password'],
                        'role'      => 'admin_bimbel',
                        'phone'     => $pendingReg['phone'],
                        'is_active' => true,
                    ]);

                    // Simpan Subscription aktif
                    $subscription = Subscription::create([
                        'tenant_id'  => $tenant->id,
                        'package_id' => $package->id,
                        'start_date' => now(),
                        'end_date'   => now()->addDays($package->duration_days),
                        'status'     => 'aktif',
                    ]);

                    // Simpan Invoice sebagai paid
                    Invoice::create([
                        'tenant_id'       => $tenant->id,
                        'subscription_id' => $subscription->id,
                        'invoice_number'  => $orderId,
                        'amount'          => $package->price,
                        'status'          => 'paid',
                        'paid_at'         => now(),
                        'due_date'        => now()->addDays(1),
                    ]);
                });

                // Hapus data cache setelah berhasil disimpan
                Cache::forget('pending_registration_' . $orderId);
            }

            // Kalau pending/deny/expire — tidak simpan apapun, biarkan cache expire otomatis
            return response()->json(['success' => true, 'message' => 'Notifikasi registrasi diproses.']);
        }

        // --- Fallback: invoice yang sudah ada di DB (checkout biasa) ---
        $invoice = Invoice::with(['subscription', 'tenant'])->where('invoice_number', $orderId)->first();

        if (!$invoice) {
            return response()->json(['message' => 'Invoice tidak ditemukan'], 404);
        }

        if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
            if ($fraudStatus == 'accept' || empty($fraudStatus)) {
                $invoice->update(['status' => 'paid', 'paid_at' => now()]);

                if ($invoice->subscription) {
                    $invoice->subscription->update(['status' => 'aktif']);
                }
                if ($invoice->tenant) {
                    $invoice->tenant->update(['status' => 'aktif']);
                }
            }
        } elseif ($transactionStatus == 'pending') {
            $invoice->update(['status' => 'unpaid']);
        } elseif (in_array($transactionStatus, ['deny', 'expire', 'cancel'])) {
            $invoice->update(['status' => 'cancelled']);
            if ($invoice->subscription) {
                $invoice->subscription->update(['status' => 'kedaluwarsa']);
            }
        }

        return response()->json(['success' => true, 'message' => 'Notifikasi berhasil diproses.']);
    }
    
    // 1. Admin Bimbel: Melihat riwayat tagihan bimbel miliknya
    public function myInvoices(Request $request)
    {
        $user = $request->user();

        $invoices = Invoice::with(['subscription.package'])
            ->where('tenant_id', $user->tenant_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $invoices
        ]);
    }

    // 2. Super Admin: Melihat seluruh invoice global dari semua bimbel
    public function allInvoices(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $invoices = Invoice::with(['tenant', 'subscription.package'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $invoices
        ]);
    }
}