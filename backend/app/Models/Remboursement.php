<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Remboursement extends BaseUuidModel
{
    protected $table = 'remboursements';

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'date_remboursement' => 'datetime',
            'actif' => 'boolean',
        ];
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande');
    }

    public function utilisateurEngage(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_engage');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }
}
