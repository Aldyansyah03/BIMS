<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory, BelongsToTenant;

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'action',
        'ip_address',
        'details',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'details'    => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Helper untuk mencatat log aktivitas secara konsisten.
     */
    public static function record(string $action, ?array $details = null, ?User $user = null): ?self
    {
        try {
            $currentUser = $user ?? auth()->user();
            $ip = request()->ip() ?? '127.0.0.1';

            return static::create([
                'tenant_id'  => $currentUser?->tenant_id,
                'user_id'    => $currentUser?->id,
                'action'     => strtoupper($action),
                'ip_address' => $ip,
                'details'    => $details,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Jangan gagalkan alur utama jika pencatatan log mengalami kendala
            return null;
        }
    }
}
