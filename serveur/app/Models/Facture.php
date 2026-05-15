<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Facture extends Model
{
    protected $fillable = ['bon_commande_id', 'etat', 'recu_paiement_pdf', 'validee_par'];

    protected $casts = [
        'etat' => 'string',
    ];

    public function bonCommande(): BelongsTo
    {
        return $this->belongsTo(BonCommande::class);
    }

    public function valideePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validee_par');
    }
}