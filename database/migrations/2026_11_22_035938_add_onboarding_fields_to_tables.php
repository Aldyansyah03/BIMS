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
        // 1. Kolom tambahan pada tabel users
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'verification_token')) {
                $table->string('verification_token')->nullable()->after('email_verified_at');
            }
            if (!Schema::hasColumn('users', 'onboarding_step')) {
                $table->string('onboarding_step', 50)->default('completed')->after('is_active');
            }
            if (!Schema::hasColumn('users', 'onboarding_completed')) {
                $table->boolean('onboarding_completed')->default(true)->after('onboarding_step');
            }
            if (!Schema::hasColumn('users', 'welcome_shown')) {
                $table->boolean('welcome_shown')->default(true)->after('onboarding_completed');
            }
        });

        // 2. Kolom tambahan pada tabel tenants
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'city')) {
                $table->string('city', 100)->nullable()->after('slug');
            }
            if (!Schema::hasColumn('tenants', 'address')) {
                $table->text('address')->nullable()->after('city');
            }
            if (!Schema::hasColumn('tenants', 'phone')) {
                $table->string('phone', 30)->nullable()->after('address');
            }
            if (!Schema::hasColumn('tenants', 'description')) {
                $table->text('description')->nullable()->after('phone');
            }
        });

        // 3. Kolom user_id pada subscriptions & invoices
        Schema::table('subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('subscriptions', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->onDelete('cascade');
            }
        });

        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->onDelete('cascade');
            }
        });

        // Ubah tenant_id menjadi nullable pada subscriptions dan invoices jika memungkinkan
        try {
            Schema::table('subscriptions', function (Blueprint $table) {
                $table->unsignedBigInteger('tenant_id')->nullable()->change();
            });
            Schema::table('invoices', function (Blueprint $table) {
                $table->unsignedBigInteger('tenant_id')->nullable()->change();
            });
        } catch (\Throwable $e) {
            // Abaikan jika database engine tidak mendukung change tanpa doctrine/dbal
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'user_id')) {
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            }
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('subscriptions', 'user_id')) {
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            }
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['city', 'address', 'phone', 'description']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['verification_token', 'onboarding_step', 'onboarding_completed', 'welcome_shown']);
        });
    }
};
