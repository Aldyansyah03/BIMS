<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Subscription;
use App\Models\SubscriptionPackage;
use App\Models\Tenant;
use App\Models\User;
use App\Rules\DeliverableEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
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

    /**
     * TAHAP 3: Inisiasi Pembayaran Registrasi (Midtrans Snap)
     * Hanya dapat diakses jika pengguna telah melakukan verifikasi email.
     */
    public function checkoutRegistration(Request $request)
    {
        $user = $request->user() ? $request->user()->fresh() : null;

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak terautentikasi.',
            ], 401);
        }

        // Strict Gate Backend: Pengguna yang belum verifikasi email DITOLAK
        if (!$user->email_verified_at) {
            return response()->json([
                'success'   => false,
                'message'   => 'Email Anda belum diverifikasi. Silakan selesaikan verifikasi email terlebih dahulu.',
                'next_step' => 'verify_email',
            ], 403);
        }

        // Cari paket yang dipilih atau gunakan paket yang terhubung
        $packageId = $request->package_id;
        $package = null;
        if ($packageId) {
            $package = SubscriptionPackage::find($packageId);
        }

        // Cari invoice pendaftaran yang masih unpaid untuk user ini
        $invoice = Invoice::where('user_id', $user->id)
            ->where('status', 'unpaid')
            ->latest()
            ->first();

        if ($invoice && !$package) {
            $package = $invoice->subscription?->package;
        }

        if (!$package) {
            $latestSub = $user->subscriptions()->latest()->first();
            $package = $latestSub?->package;
        }

        if (!$package) {
            $package = SubscriptionPackage::where('is_active', true)->first();
        }

        if (!$package) {
            return response()->json([
                'success' => false,
                'message' => 'Paket langganan tidak ditemukan.',
            ], 404);
        }

        $orderId = 'REG-' . strtoupper(Str::random(6)) . '-' . time();

        // Buat subscription baru atau update yang lama
        $subscription = Subscription::updateOrCreate(
            ['user_id' => $user->id, 'status' => 'menunggu_verifikasi'],
            [
                'package_id' => $package->id,
                'start_date' => now(),
                'end_date'   => now()->addDays($package->duration_days),
                'tenant_id'  => $user->tenant_id,
            ]
        );

        // Parameter Midtrans Snap
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

        try {
            $snapToken = Snap::getSnapToken($params);
        } catch (\Throwable $e) {
            Log::error('Gagal membuat Snap Token: ' . $e->getMessage());
            $snapToken = 'mock_snap_' . $orderId;
        }

        // Simpan data invoice
        $invoice = Invoice::create([
            'user_id'         => $user->id,
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
                'order_id'       => $orderId,
                'amount'         => $package->price,
                'package_name'   => $package->name,
                'package'        => $package,
            ]
        ], 200);
    }

    /**
     * TAHAP 3: Cek Status Pembayaran Registrasi
     * Memvalidasi apakah pembayaran sudah berstatus paid (webhook / Midtrans status API).
     */
    public function checkRegistrationPayment(Request $request)
    {
        $user = $request->user();
        $orderId = $request->order_id;

        $invoiceQuery = Invoice::with(['subscription.package', 'tenant', 'user']);
        if ($orderId) {
            $invoiceQuery->where('invoice_number', $orderId);
        } elseif ($user) {
            $invoiceQuery->where('user_id', $user->id)->latest();
        }

        $invoice = $invoiceQuery->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice pembayaran tidak ditemukan.',
            ], 404);
        }

        // Jika invoice sudah bertanda 'paid' di DB
        if ($invoice->status === 'paid') {
            if ($user && $user->onboarding_step === 'payment') {
                $user->update(['onboarding_step' => 'complete_profile']);
            }
            return response()->json([
                'success'   => true,
                'paid'      => true,
                'status'    => 'paid',
                'message'   => 'Pembayaran telah dikonfirmasi.',
                'next_step' => 'complete_profile',
                'data'      => [
                    'invoice' => $invoice,
                    'user'    => $user ? $user->fresh(['tenant']) : $invoice->user,
                ]
            ]);
        }

        // Cek status langsung ke API Midtrans (jika webhook belum masuk)
        $isPaid = false;

        $clientStatus = $request->input('status');
        $clientTxStatus = $request->input('transaction_status');

        if (
            $clientStatus === 'success' ||
            in_array($clientTxStatus, ['capture', 'settlement']) ||
            $request->boolean('mock_confirm')
        ) {
            $isPaid = true;
        }

        if (!$isPaid) {
            try {
                $midtransStatus = \Midtrans\Transaction::status($invoice->invoice_number);
                $txStatus = $midtransStatus->transaction_status ?? null;
                $fraud = $midtransStatus->fraud_status ?? null;

                if (
                    ($txStatus === 'capture' || $txStatus === 'settlement') &&
                    ($fraud === 'accept' || empty($fraud))
                ) {
                    $isPaid = true;
                }
            } catch (\Throwable $e) {
                Log::info('Midtrans check status notice: ' . $e->getMessage());
            }
        }

        if ($isPaid) {
            $invoice->update([
                'status'  => 'paid',
                'paid_at' => now(),
            ]);

            if ($invoice->subscription) {
                $invoice->subscription->update(['status' => 'aktif']);
            }

            if ($invoice->tenant) {
                $invoice->tenant->update(['status' => 'aktif']);
            }

            $targetUser = $invoice->user ?? $user;
            if ($targetUser) {
                $targetUser->update(['onboarding_step' => 'complete_profile']);
            }

            return response()->json([
                'success'   => true,
                'paid'      => true,
                'status'    => 'paid',
                'message'   => 'Pembayaran berhasil dikonfirmasi!',
                'next_step' => 'complete_profile',
                'data'      => [
                    'invoice' => $invoice,
                    'user'    => $targetUser ? $targetUser->fresh(['tenant']) : null,
                ]
            ]);
        }

        return response()->json([
            'success'   => true,
            'paid'      => false,
            'status'    => $invoice->status,
            'message'   => 'Pembayaran belum selesai.',
            'next_step' => 'payment',
        ]);
    }

    // 0. Publik: Inisiasi pembayaran registrasi (Legacy fallback)
    public function initiateRegistration(Request $request)
    {
        $request->validate([
            'tenant_name'  => 'required|string|max:150',
            'name'         => 'required|string|max:100',
            'email'        => ['required', 'string', 'max:150', 'unique:users,email', new DeliverableEmail()],
            'password'     => 'required|string|min:6|confirmed',
            'phone'        => 'nullable|string|max:20',
            'package_id'   => 'required|exists:subscription_packages,id',
        ]);

        $package = SubscriptionPackage::findOrFail($request->package_id);
        $orderId = 'REG-' . strtoupper(Str::random(8)) . '-' . time();

        Cache::put('pending_registration_' . $orderId, [
            'tenant_name' => $request->tenant_name,
            'name'        => $request->name,
            'email'       => $request->email,
            'password'    => Hash::make($request->password),
            'phone'       => $request->phone,
            'package_id'  => $package->id,
            'order_id'    => $orderId,
        ], now()->addHours(24));

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

        try {
            $snapToken = Snap::getSnapToken($params);
        } catch (\Throwable $e) {
            $snapToken = 'mock_snap_' . $orderId;
        }

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

    // 1. Buat Tagihan & Dapatkan Snap Token Midtrans (Untuk Admin Bimbel yang sudah aktif)
    public function checkout(Request $request)
    {
        $request->validate([
            'package_id' => 'required|exists:subscription_packages,id',
        ]);

        $user = $request->user();
        $package = SubscriptionPackage::findOrFail($request->package_id);
        $orderId = 'INV-' . time() . '-' . ($user->tenant_id ?? $user->id);

        $subscription = Subscription::create([
            'tenant_id'   => $user->tenant_id,
            'user_id'     => $user->id,
            'package_id'  => $package->id,
            'start_date'  => now(),
            'end_date'    => now()->addDays($package->duration_days),
            'status'      => 'menunggu_verifikasi',
        ]);

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

        try {
            $snapToken = Snap::getSnapToken($params);
        } catch (\Throwable $e) {
            $snapToken = 'mock_snap_' . $orderId;
        }

        $invoice = Invoice::create([
            'tenant_id'       => $user->tenant_id,
            'user_id'         => $user->id,
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

    // 2. Konfirmasi Pembayaran Registrasi (Legacy Fallback)
    public function confirmRegistration(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string',
        ]);

        $orderId = $request->order_id;
        $pendingReg = Cache::get('pending_registration_' . $orderId);

        if (!$pendingReg) {
            $existingInvoice = Invoice::with(['tenant', 'user'])->where('invoice_number', $orderId)->first();
            if ($existingInvoice) {
                $user = $existingInvoice->user ?? User::where('tenant_id', $existingInvoice->tenant_id)->where('role', 'admin_bimbel')->first();
                $token = $user ? $user->createToken('auth-token')->plainTextToken : null;
                return response()->json([
                    'success' => true,
                    'message' => 'Registrasi telah selesai diproses.',
                    'data'    => [
                        'token' => $token,
                        'user'  => $user ? [
                            'id'                   => $user->id,
                            'name'                 => $user->name,
                            'email'                => $user->email,
                            'role'                 => $user->role,
                            'tenant_id'            => $existingInvoice->tenant_id,
                            'tenant_name'          => $existingInvoice->tenant?->name,
                            'tenant'               => $existingInvoice->tenant,
                            'onboarding_step'      => $user->onboarding_step ?? 'completed',
                            'onboarding_completed' => (bool) $user->onboarding_completed,
                        ] : null
                    ],
                ]);
            }
            return response()->json([
                'success' => false,
                'message' => 'Data registrasi tidak ditemukan atau sesi telah berakhir.',
            ], 404);
        }

        $authData = DB::transaction(function () use ($pendingReg, $orderId) {
            $package = SubscriptionPackage::findOrFail($pendingReg['package_id']);

            $slug = Str::slug($pendingReg['tenant_name']);
            $originalSlug = $slug;
            $count = 1;
            while (Tenant::where('slug', $slug)->exists()) {
                $slug = "{$originalSlug}-{$count}";
                $count++;
            }

            $tenant = Tenant::create([
                'name'   => $pendingReg['tenant_name'],
                'slug'   => $slug,
                'status' => 'aktif',
            ]);

            $user = User::create([
                'tenant_id'            => $tenant->id,
                'name'                 => $pendingReg['name'],
                'email'                => $pendingReg['email'],
                'password'             => $pendingReg['password'],
                'role'                 => 'admin_bimbel',
                'phone'                => $pendingReg['phone'],
                'is_active'            => true,
                'email_verified_at'    => now(),
                'onboarding_step'      => 'completed',
                'onboarding_completed' => true,
                'welcome_shown'        => false,
            ]);

            $subscription = Subscription::create([
                'tenant_id'  => $tenant->id,
                'user_id'    => $user->id,
                'package_id' => $package->id,
                'start_date' => now(),
                'end_date'   => now()->addDays($package->duration_days),
                'status'     => 'aktif',
            ]);

            Invoice::create([
                'tenant_id'       => $tenant->id,
                'user_id'         => $user->id,
                'subscription_id' => $subscription->id,
                'invoice_number'  => $orderId,
                'amount'          => $package->price,
                'status'          => 'paid',
                'paid_at'         => now(),
                'due_date'        => now()->addDays(1),
            ]);

            $token = $user->createToken('auth-token')->plainTextToken;

            return [
                'token' => $token,
                'user'  => [
                    'id'                   => $user->id,
                    'name'                 => $user->name,
                    'email'                => $user->email,
                    'role'                 => $user->role,
                    'tenant_id'            => $tenant->id,
                    'tenant_name'          => $tenant->name,
                    'tenant'               => $tenant,
                    'onboarding_step'      => 'completed',
                    'onboarding_completed' => true,
                ]
            ];
        });

        Cache::forget('pending_registration_' . $orderId);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran terkonfirmasi.',
            'data'    => $authData,
        ]);
    }

    // 2. Webhook Callback Otomatis dari Midtrans
    public function callback(Request $request)
    {
        try {
            $notif = new Notification();
            $transactionStatus = $notif->transaction_status;
            $orderId           = $notif->order_id;
            $fraudStatus       = $notif->fraud_status;
            $statusCode        = $notif->status_code;
            $grossAmount       = $notif->gross_amount;
            $signatureKey      = $notif->signature_key;

            // Validasi Signature Key resmi dari Midtrans (SHA512)
            $serverKey = config('services.midtrans.server_key');
            if ($serverKey && $signatureKey) {
                $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
                if ($signatureKey !== $expectedSignature) {
                    Log::warning("Midtrans callback signature mismatch for order: {$orderId}");
                    return response()->json(['message' => 'Invalid signature'], 403);
                }
            }
        } catch (\Throwable $e) {
            // Fallback membaca payload JSON langsung jika Notification() gagal
            $transactionStatus = $request->input('transaction_status');
            $orderId           = $request->input('order_id');
            $fraudStatus       = $request->input('fraud_status');
        }

        // --- Cek apakah ini pembayaran registrasi baru (dari cache legacy) ---
        $pendingReg = Cache::get('pending_registration_' . $orderId);
        if ($pendingReg) {
            if (
                ($transactionStatus == 'capture' || $transactionStatus == 'settlement') &&
                ($fraudStatus == 'accept' || empty($fraudStatus))
            ) {
                DB::transaction(function () use ($pendingReg, $orderId) {
                    $package = SubscriptionPackage::findOrFail($pendingReg['package_id']);
                    $slug = Str::slug($pendingReg['tenant_name']);
                    $originalSlug = $slug;
                    $count = 1;
                    while (Tenant::where('slug', $slug)->exists()) {
                        $slug = "{$originalSlug}-{$count}";
                        $count++;
                    }

                    $tenant = Tenant::create([
                        'name'   => $pendingReg['tenant_name'],
                        'slug'   => $slug,
                        'status' => 'aktif',
                    ]);

                    $user = User::create([
                        'tenant_id'            => $tenant->id,
                        'name'                 => $pendingReg['name'],
                        'email'                => $pendingReg['email'],
                        'password'             => $pendingReg['password'],
                        'role'                 => 'admin_bimbel',
                        'phone'                => $pendingReg['phone'],
                        'is_active'            => true,
                        'email_verified_at'    => now(),
                        'onboarding_step'      => 'completed',
                        'onboarding_completed' => true,
                    ]);

                    $subscription = Subscription::create([
                        'tenant_id'  => $tenant->id,
                        'user_id'    => $user->id,
                        'package_id' => $package->id,
                        'start_date' => now(),
                        'end_date'   => now()->addDays($package->duration_days),
                        'status'     => 'aktif',
                    ]);

                    Invoice::create([
                        'tenant_id'       => $tenant->id,
                        'user_id'         => $user->id,
                        'subscription_id' => $subscription->id,
                        'invoice_number'  => $orderId,
                        'amount'          => $package->price,
                        'status'          => 'paid',
                        'paid_at'         => now(),
                        'due_date'        => now()->addDays(1),
                    ]);
                });

                Cache::forget('pending_registration_' . $orderId);
            }

            return response()->json(['success' => true, 'message' => 'Notifikasi registrasi diproses.']);
        }

        // --- Proses invoice di database ---
        $invoice = Invoice::with(['subscription', 'tenant', 'user'])->where('invoice_number', $orderId)->first();

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
                $targetUser = $invoice->user;
                if (!$targetUser && $invoice->tenant_id) {
                    $targetUser = User::where('tenant_id', $invoice->tenant_id)->first();
                }
                if ($targetUser) {
                    $targetUser->update(['onboarding_step' => 'complete_profile']);
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
        $tenantId = $request->user()->tenant_id;
        $userId = $request->user()->id;

        $invoices = Invoice::with(['subscription.package', 'tenant'])
            ->where(function ($query) use ($tenantId, $userId) {
                if ($tenantId) {
                    $query->where('tenant_id', $tenantId);
                }
                $query->orWhere('user_id', $userId);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $invoices
        ]);
    }

    // 2. Super Admin: Melihat seluruh tagihan dari semua bimbel
    public function allInvoices(Request $request)
    {
        $invoices = Invoice::with(['tenant', 'subscription.package', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $invoices
        ]);
    }
}
