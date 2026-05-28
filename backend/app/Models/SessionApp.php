<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionApp extends Model
{
    use HasUuids;

    protected $table = 'sessions';

    public $timestamps = false;

    protected $fillable = [
        'token',
        'date_creation',
        'date_expiration',
        'validite',
        'role',
        'entreprise',
        'utilisateur',
    ];

    protected $hidden = [
        'token',
    ];

    public function role(): BelongsTo
    {
        return $this->belongsTo(RoleUtilisateur::class, 'role');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur');
    }
}
