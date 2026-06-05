<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaiementSalaire extends Model
{
    use HasUuids;

    protected $table = 'paiements_salaires';

    public $timestamps = false;

    protected $fillable = [
        'salaire',
        'montant',
        'date_paiement',
        'mode_payement',
        'reference_transaction',
        'user_enregistre',
        'entreprise',
    ];

    public function salaire(): BelongsTo
    {
        return $this->belongsTo(Salaire::class, 'salaire');
    }

    public function utilisateurEnregistre(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_enregistre');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }
}
