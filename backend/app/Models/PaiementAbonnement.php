<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaiementAbonnement extends Model
{
    use HasUuids;

    protected $table = 'paiements_abonnements';

    public $timestamps = false;

    protected $fillable = [
        'abonnement',
        'montant',
        'date_paiement',
        'reference_transaction',
        'user_enregistre',
        'entreprise',
    ];

    public function abonnement(): BelongsTo
    {
        return $this->belongsTo(FraisMensuel::class, 'abonnement');
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
