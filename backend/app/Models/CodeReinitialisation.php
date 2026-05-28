<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CodeReinitialisation extends Model
{
    use HasUuids;

    protected $table = 'codes_reinitialisation';

    public $timestamps = false;

    protected $fillable = [
        'code',
        'date_creation',
        'date_expiration',
        'utilise',
        'actif',
        'utilisateur',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur');
    }
}
