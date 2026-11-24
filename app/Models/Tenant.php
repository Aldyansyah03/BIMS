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
        return $this->getLogoAttribute($this->attributes['logo'] ?? null);
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

        $supabaseBucketUrl = env('AWS_URL', 'https://isxkzbrswxqdlswmupzt.supabase.co/storage/v1/object/public/materials');
        $cleanPath = ltrim(preg_replace('/^\/?storage\//', '', $value), '/');

        // Jika diawali dengan logos/ atau materials/, arahkan langsung ke Supabase Storage publik
        if (str_starts_with($cleanPath, 'logos/') || str_starts_with($cleanPath, 'materials/')) {
            return rtrim($supabaseBucketUrl, '/') . '/' . $cleanPath;
        }

        $backendUrl = config('app.url') && config('app.url') !== 'http://localhost'
            ? config('app.url')
            : (env('APP_URL') ?: 'https://bims-bice.vercel.app');

        return rtrim($backendUrl, '/') . '/storage/' . $cleanPath;
    }
}
