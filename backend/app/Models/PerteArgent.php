<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerteArgent extends BaseUuidModel
{
    protected $table = 'pertes_argent';

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'date_constat' => 'datetime',
            'actif' => 'boolean',
        ];
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function utilisateurSignale(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_signale');
    }
}
