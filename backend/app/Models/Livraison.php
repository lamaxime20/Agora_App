<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Livraison extends BaseUuidModel
{
    protected $table = 'livraisons';

    protected function casts(): array
    {
        return [
            'date_creation' => 'datetime',
            'date_livraison_effective' => 'datetime',
            'date_lancement' => 'datetime',
            'actif' => 'boolean',
        ];
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande');
    }

    public function livreur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'livreur');
    }
}
