<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ravitaillement extends Model
{
    use HasUuids;

    protected $table = 'ravitaillements';

    public $timestamps = false;

    protected $fillable = [
        'date_creation',
        'statut',
        'quantite',
        'montant_a_depenser',
        'date_validation',
        'date_execution',
        'date_annulation',
        'raison_annulation',
        'actif',
        'utilisateur_demande',
        'user_confirmation',
        'produit',
    ];

    public function utilisateurDemande(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_demande');
    }

    public function utilisateurConfirmation(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_confirmation');
    }

    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class, 'produit');
    }
}
