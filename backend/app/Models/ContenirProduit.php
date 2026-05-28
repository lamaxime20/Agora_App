<?php

namespace App\Models;

use App\Models\Concerns\BasePivotModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContenirProduit extends BasePivotModel
{
    protected $table = 'contenir_produit';

    protected function casts(): array
    {
        return [
            'quantite' => 'decimal:2',
            'prix_unitaire' => 'decimal:2',
            'reduction' => 'decimal:2',
            'montant' => 'decimal:2',
        ];
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande_id');
    }

    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class, 'produit_id');
    }
}
