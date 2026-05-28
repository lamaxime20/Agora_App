<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ravitaillement extends BaseUuidModel
{
    protected $table = 'ravitaillements';

    protected function casts(): array
    {
        return [
            'date_creation' => 'datetime',
            'date_validation' => 'datetime',
            'date_execution' => 'datetime',
            'quantite' => 'decimal:2',
            'montant_a_depenser' => 'decimal:2',
            'actif' => 'boolean',
        ];
    }

    public function utilisateurDemande(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_demande');
    }

    public function userConfirmation(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_confirmation');
    }

    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class, 'produit');
    }
}
