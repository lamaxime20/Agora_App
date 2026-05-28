<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FraisMensuel extends BaseUuidModel
{
    protected $table = 'frais_mensuel';

    protected function casts(): array
    {
        return [
            'montant_mensuel' => 'decimal:2',
            'date_abonnement' => 'date',
            'depense_active' => 'boolean',
            'actif' => 'boolean',
        ];
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }
}
