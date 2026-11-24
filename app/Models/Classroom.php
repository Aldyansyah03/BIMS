<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classroom extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'academic_year',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function members()
    {
        return $this->hasMany(ClassroomMember::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'classroom_members')
            ->withPivot(['id', 'role_in_class', 'joined_at']);
    }

    public function tutors()
    {
        return $this->belongsToMany(User::class, 'classroom_members')
            ->wherePivot('role_in_class', 'tutor')
            ->withPivot(['id', 'role_in_class', 'joined_at']);
    }

    public function students()
    {
        return $this->belongsToMany(User::class, 'classroom_members')
            ->wherePivot('role_in_class', 'siswa')
            ->withPivot(['id', 'role_in_class', 'joined_at']);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
}
