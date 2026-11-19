<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Material extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'classroom_id',
        'tutor_id',
        'title',
        'type',
        'file_path',
        'video_url',
        'file_size_kb',
    ];

    protected $appends = [
        'file_url',
        'url',
    ];

    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }

    public function tutor()
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    /**
     * URL berkas PDF yang dapat diakses publik/browser.
     */
    protected function fileUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (empty($this->file_path)) {
                    return null;
                }
                if (filter_var($this->file_path, FILTER_VALIDATE_URL)) {
                    return $this->file_path;
                }
                $disk = config('filesystems.default') === 's3' || env('FILESYSTEM_DISK') === 's3' ? 's3' : 'public';
                return Storage::disk($disk)->url($this->file_path);
            }
        );
    }

    /**
     * Tautan umum materi (file PDF atau video link) untuk kompatibilitas frontend.
     */
    protected function url(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->type === 'video') {
                    return $this->video_url;
                }
                return $this->file_url;
            }
        );
    }
}
