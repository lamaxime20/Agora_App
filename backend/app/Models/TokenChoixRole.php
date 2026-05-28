<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TokenChoixRole extends BaseUuidModel
{
    protected $table = 'token_choix_role';

    protected function casts(): array
    {
        return [
            'date_creation' => 'datetime',
            'date_expiration' => 'datetime',
            'validite' => 'boolean',
        ];
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur');
    }
}
