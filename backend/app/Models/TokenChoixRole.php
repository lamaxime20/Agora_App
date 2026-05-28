<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TokenChoixRole extends Model
{
    use HasUuids;

    protected $table = 'token_choix_role';

    public $timestamps = false;

    protected $fillable = [
        'token',
        'date_creation',
        'date_expiration',
        'validite',
        'utilisateur',
    ];

    protected $hidden = [
        'token',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur');
    }
}
