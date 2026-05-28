<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Produit extends BaseUuidModel
{
    protected $table = 'produits';

    protected function casts(): array
    {
        return [
            'date_creation' => 'datetime',
            'date_modification' => 'datetime',
            'prix_unitaire' => 'decimal:2',
            'stock_actuel' => 'decimal:2',
        ];
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(CategorieProduit::class, 'categorie');
    }

    public function ravitaillements(): HasMany
    {
        return $this->hasMany(Ravitaillement::class, 'produit');
    }

    public function pertesProduits(): HasMany
    {
        return $this->hasMany(PerteProduit::class, 'produit');
    }

    public function lignesCommande(): HasMany
    {
        return $this->hasMany(ContenirProduit::class, 'produit_id');
    }
}
