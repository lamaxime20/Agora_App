<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invitation extends BaseUuidModel
{
    protected $table = 'invitations';

    protected function casts(): array
    {
        return [
            'date_invitation' => 'datetime',
            'date_expiration' => 'datetime',
            'actif' => 'boolean',
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
}
