<?php

namespace App\Traits;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait BelongsToTenant
{
    /**
     * Boot the BelongsToTenant trait.
     * Otomatis pasang Global Scope untuk filter tenant_id (ER-2.2)
     * dan otomatis isi tenant_id saat create record baru.
     */
    protected static function bootBelongsToTenant(): void
    {
        // 1. Global Scope: filter otomatis query berdasarkan tenant_id user yang login
        static::addGlobalScope('tenant_isolation', function (Builder $builder) {
            if (auth()->check()) {
                $user = auth()->user();
                // Jika bukan super_admin dan memiliki tenant_id, batasi query hanya untuk tenant miliknya
                if ($user->role !== 'super_admin' && !empty($user->tenant_id)) {
                    $builder->where($builder->getModel()->getTable() . '.tenant_id', $user->tenant_id);
                }
            }
        });

        // 2. Event Creating: otomatis set tenant_id jika belum diisi
        static::creating(function (Model $model) {
            if (auth()->check()) {
                $user = auth()->user();
                if ($user->role !== 'super_admin' && empty($model->tenant_id) && !empty($user->tenant_id)) {
                    $model->tenant_id = $user->tenant_id;
                }
            }
        });
    }

    /**
     * Relasi ke model Tenant.
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
