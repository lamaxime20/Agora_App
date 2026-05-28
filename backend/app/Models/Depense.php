<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Depense extends BaseUuidModel
{
    protected $table = 'depenses';

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'date_depense' => 'datetime',
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
