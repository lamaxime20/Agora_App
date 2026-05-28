<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Salaire extends Model
{
    use HasUuids;

    protected $table = 'salaires';

    public $timestamps = false;

    protected $fillable = [
        'montant',
        'date_debut',
        'date_fin',
        'date_paiement',
        'actif',
        'statut',
        'utilisateur',
        'entreprise',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }
}
