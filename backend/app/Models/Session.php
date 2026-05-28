<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Session extends BaseUuidModel
{
    protected $table = 'sessions';

    protected function casts(): array
    {
        return [
            'date_creation' => 'datetime',
            'date_expiration' => 'datetime',
            'validite' => 'boolean',
        ];
    }

    public function roleUtilisateur(): BelongsTo
    {
        return $this->belongsTo(RoleUtilisateur::class, 'role');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur');
    }
}
