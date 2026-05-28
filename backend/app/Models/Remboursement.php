<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Remboursement extends Model
{
    use HasUuids;

    protected $table = 'remboursements';

    public $timestamps = false;

    protected $fillable = [
        'cause',
        'montant',
        'date_remboursement',
        'actif',
        'commande',
        'utilisateur_engage',
        'entreprise',
    ];

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande');
    }

    public function utilisateurEngage(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_engage');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }
}
