<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CodeReinitialisation extends BaseUuidModel
{
    protected $table = 'codes_reinitialisation';

    protected function casts(): array
    {
        return [
            'date_creation' => 'datetime',
            'date_expiration' => 'datetime',
            'utilise' => 'boolean',
            'actif' => 'boolean',
        ];
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur');
    }
}
