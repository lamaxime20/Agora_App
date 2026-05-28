<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategorieProduit extends BaseUuidModel
{
    protected $table = 'categories_produit';

    protected function casts(): array
    {
        return [];
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur');
    }

    public function produits(): HasMany
    {
        return $this->hasMany(Produit::class, 'categorie');
    }
}
