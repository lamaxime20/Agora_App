<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerteProduit extends BaseUuidModel
{
    protected $table = 'pertes_produits';

    protected function casts(): array
    {
        return [
            'date_perte' => 'datetime',
            'quantite_perdu' => 'decimal:2',
        ];
    }

    public function userSignale(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_signale');
    }

    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class, 'produit');
    }
}
