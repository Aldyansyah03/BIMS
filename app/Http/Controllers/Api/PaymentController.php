<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Subscription;
use App\Models\SubscriptionPackage;
use Illuminate\Http\Request;
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

        $invoice = Invoice::with(['subscription', 'tenant'])->where('invoice_number', $orderId)->first();

        if (!$invoice) {
            return response()->json(['message' => 'Invoice tidak ditemukan'], 404);
        }

        // Jika status transaksi sukses/settlement
        if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
            if ($fraudStatus == 'accept' || empty($fraudStatus)) {
                $invoice->update([
                    'status'  => 'paid',
                    'paid_at' => now(),
                ]);

                // Aktifkan masa aktif langganan & bimbel
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