<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BonLivraison extends Model
{
    protected $fillable = ['bon_commande_id', 'etat', 'delai_livraison', 'bon_livraison_scan_pdf'];

    protected $casts = [
        'etat' => 'string',
        'delai_livraison' => 'string',
    ];

    public function bonCommande(): BelongsTo
    {
        return $this->belongsTo(BonCommande::class);
    }
}