<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EntreeArgent extends BaseUuidModel
{
    protected $table = 'entrees_argent';

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'date_entree' => 'datetime',
            'actif' => 'boolean',
        ];
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function utilisateurMarque(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_marque');
    }
}
