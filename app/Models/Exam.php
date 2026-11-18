<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'classroom_id',
        'tutor_id',
        'title',
        'start_time',
        'end_time',
        'duration_minutes',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'start_time'       => 'datetime',
            'end_time'         => 'datetime',
            'duration_minutes' => 'integer',
            'is_published'     => 'boolean',
        ];
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }

    public function tutor()
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    public function attempts()
    {
        return $this->hasMany(ExamAttempt::class);
    }

    public function results()
    {
        return $this->hasMany(ExamResult::class);
    }
}
