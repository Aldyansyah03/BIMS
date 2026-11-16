<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscription_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->decimal('price', 12, 2);
            $table->integer('duration_days')->default(30);
            $table->integer('max_users')->default(50);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        // 2. Tabel Langganan Bimbel
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('package_id')->constrained('subscription_packages')->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['aktif', 'kedaluwarsa', 'menunggu_verifikasi'])->default('menunggu_verifikasi');
            $table->timestamps();
        });

        // 3. Tabel Invoice / Tagihan Midtrans
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->onDelete('set null');
            $table->string('invoice_number', 50)->unique();
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['unpaid', 'paid', 'cancelled'])->default('unpaid');
            $table->string('snap_token')->nullable(); // Token popup Midtrans
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_packages');
    }
};
