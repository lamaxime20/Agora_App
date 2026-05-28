<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CodeCouleur extends BaseUuidModel
{
    protected $table = 'codes_couleurs';

    protected function casts(): array
    {
        return [];
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }
}
