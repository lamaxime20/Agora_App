<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasUuids;

    protected $table = 'notifications';

    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'company_id',
        'role_id',
        'type',
        'title',
        'message',
        'priority',
        'data',
        'read_at',
        'archived_at',
    ];

    protected $casts = [
        'data'        => 'array',
        'read_at'     => 'datetime',
        'archived_at' => 'datetime',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'company_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(RoleUtilisateur::class, 'role_id');
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function markAsRead(): void
    {
        if ($this->read_at === null) {
            $this->update(['read_at' => now()]);
        }
    }

    public function markAsArchived(): void
    {
        if ($this->archived_at === null) {
            $this->update(['archived_at' => now()]);
        }
    }
}
