<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BonCommande extends Model
{
    protected $fillable = ['proforma_id', 'date_livraison_prevue', 'fichier_scan', 'statut_livraison'];

    protected $casts = [
        'date_livraison_prevue' => 'date',
    ];

    public function proforma(): BelongsTo
    {
        return $this->belongsTo(Proforma::class);
    }

    public function facture(): HasOne
    {
        return $this->hasOne(Facture::class);
    }

    public function bonLivraisons(): HasMany
    {
        return $this->hasMany(BonLivraison::class);
    }
}