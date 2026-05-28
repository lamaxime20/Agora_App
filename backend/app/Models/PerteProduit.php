<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerteProduit extends Model
{
    use HasUuids;

    protected $table = 'pertes_produits';

    public $timestamps = false;

    protected $fillable = [
        'quantite_perdu',
        'motif_perte',
        'date_perte',
        'user_signale',
        'produit',
    ];

    public function utilisateurSignale(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_signale');
    }

    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class, 'produit');
    }
}
