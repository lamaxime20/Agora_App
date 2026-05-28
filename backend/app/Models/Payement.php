<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payement extends BaseUuidModel
{
    protected $table = 'payements';

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'date_payement' => 'datetime',
            'actif' => 'boolean',
        ];
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande');
    }

    public function userEnregistre(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_enregistre');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }
}
