<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategorieProduit extends Model
{
    use HasUuids;

    protected $table = 'categories_produit';

    public $timestamps = false;

    protected $fillable = [
        'categorie',
        'description',
        'entreprise',
        'utilisateur',
    ];

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur');
    }

    public function produits(): HasMany
    {
        return $this->hasMany(Produit::class, 'categorie');
    }
}
