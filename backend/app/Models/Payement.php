<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payement extends Model
{
    use HasUuids;

    protected $table = 'payements';

    public $timestamps = false;

    protected $fillable = [
        'montant',
        'date_payement',
        'mode_payement',
        'reference_transaction',
        'actif',
        'commande',
        'user_enregistre',
        'entreprise',
    ];

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande');
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
