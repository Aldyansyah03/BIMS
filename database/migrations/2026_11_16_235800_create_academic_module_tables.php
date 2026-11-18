<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Modul 3: Manajemen Akademik & Pembelajaran (MR-3)
     */
    public function up(): void
    {
        // 1. Tabel Mata Pelajaran (subjects)
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->string('name', 100);
            $table->string('code', 20)->nullable();
            $table->timestamps();
        });

        // 2. Tabel Kelas (classrooms)
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->string('name', 100);
            $table->string('academic_year', 20);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. Tabel Anggota Kelas (classroom_members - Pivot M:N)
        Schema::create('classroom_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained('classrooms')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role_in_class', ['tutor', 'siswa']);
            $table->timestamp('joined_at')->useCurrent();

            // Mencegah duplikasi siswa/tutor di kelas yang sama
            $table->unique(['classroom_id', 'user_id']);
        });

        // 4. Tabel Jadwal Belajar (schedules)
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('classroom_id')->constrained('classrooms')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('tutor_id')->constrained('users')->onDelete('cascade');
            $table->tinyInteger('day_of_week'); // 1: Senin s.d. 7: Minggu
            $table->time('start_time');
            $table->time('end_time');
            $table->string('room_or_link', 255)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
        Schema::dropIfExists('classroom_members');
        Schema::dropIfExists('classrooms');
        Schema::dropIfExists('subjects');
    }
};
