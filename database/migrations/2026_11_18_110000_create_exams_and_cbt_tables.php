<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Modul 5: CBT Online (Exams, Questions, Options, Attempts, Answers) & Modul 6: Exam Results
     */
    public function up(): void
    {
        // 1. Tabel Ujian / Tryout (exams)
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('classroom_id')->constrained('classrooms')->onDelete('cascade');
            $table->foreignId('tutor_id')->constrained('users')->onDelete('cascade');
            $table->string('title', 200);
            $table->timestamp('start_time');
            $table->timestamp('end_time');
            $table->integer('duration_minutes');
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        // 2. Tabel Butir Soal (questions)
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->text('text');
            $table->timestamps();
        });

        // 3. Tabel Opsi Jawaban (options)
        Schema::create('options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->char('letter', 1); // 'A', 'B', 'C', 'D'
            $table->text('text');
            $table->boolean('is_correct')->default(false);
            $table->timestamps();
        });

        // 4. Tabel Sesi Pengerjaan Siswa (exam_attempts)
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('deadline_at');
            $table->timestamp('finished_at')->nullable();
            $table->enum('status', ['in_progress', 'completed', 'timed_out'])->default('in_progress');
            $table->timestamps();

            // ER-5.2: Maksimal 1 percobaan pengerjaan per siswa per ujian
            $table->unique(['exam_id', 'user_id']);
        });

        // 5. Tabel Jawaban Siswa (student_answers)
        Schema::create('student_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->foreignId('option_id')->nullable()->constrained('options')->onDelete('cascade');
            $table->boolean('is_correct')->nullable();
            $table->timestamp('answered_at')->useCurrent();

            $table->unique(['attempt_id', 'question_id']);
        });

        // 6. Tabel Rekap Hasil & Nilai Akhir (exam_results - MR-6)
        Schema::create('exam_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->unique()->constrained('exam_attempts')->onDelete('cascade');
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->integer('total_questions');
            $table->integer('correct_answers');
            $table->decimal('score', 5, 2); // 0.00 - 100.00
            $table->timestamp('graded_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_results');
        Schema::dropIfExists('student_answers');
        Schema::dropIfExists('exam_attempts');
        Schema::dropIfExists('options');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('exams');
    }
};
