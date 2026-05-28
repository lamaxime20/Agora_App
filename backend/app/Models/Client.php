<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends BaseUuidModel
{
    protected $table = 'clients';

    protected function casts(): array
    {
        return [];
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function commandes(): HasMany
    {
        return $this->hasMany(Commande::class, 'client');
    }
}
