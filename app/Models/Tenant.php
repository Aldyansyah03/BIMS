<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'logo',
        'slug',
        'city',
        'address',
        'phone',
        'description',
        'status',
    ];

    protected $appends = ['logo_url'];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Dapatkan URL lengkap logo bimbel (mendukung Supabase Storage bucket & Local Public disk).
     */
    public function getLogoUrlAttribute(): ?string
    {
        $rawLogo = $this->attributes['logo'] ?? null;
        if (empty($rawLogo)) {
            return null;
        }

        if (filter_var($rawLogo, FILTER_VALIDATE_URL)) {
            return $rawLogo;
        }

        // Jika terhubung ke bucket Supabase S3 dan diawali dengan materials/ atau logos/
        $supabaseBucketUrl = env('AWS_URL');
        if (!empty($supabaseBucketUrl) && !str_starts_with($rawLogo, '/storage/')) {
            return rtrim($supabaseBucketUrl, '/') . '/' . ltrim($rawLogo, '/');
        }

        $backendUrl = config('app.url', 'http://127.0.0.1:8000');
        $cleanPath = str_starts_with($rawLogo, '/storage/') ? $rawLogo : '/storage/' . ltrim($rawLogo, '/');

        return rtrim($backendUrl, '/') . $cleanPath;
    }

    /**
     * Pastikan attribute logo selalu mengembalikan URL yang dapat diakses browser.
     */
    public function getLogoAttribute($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        $backendUrl = config('app.url', 'http://127.0.0.1:8000');
        $cleanPath = str_starts_with($value, '/storage/') ? $value : '/storage/' . ltrim($value, '/');

        return rtrim($backendUrl, '/') . $cleanPath;
    }
}
