<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evenement extends BaseUuidModel
{
    protected $table = 'evenements';

    protected function casts(): array
    {
        return [
            'date_evenement' => 'datetime',
            'actif' => 'boolean',
        ];
    }

    public function creation(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creation');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ParticiperEvenement::class, 'evenement_id');
    }
}
