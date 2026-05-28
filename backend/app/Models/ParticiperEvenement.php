<?php

namespace App\Models;

use App\Models\Concerns\BasePivotModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParticiperEvenement extends BasePivotModel
{
    protected $table = 'participer_evenement';

    protected function casts(): array
    {
        return [
            'date_participation' => 'datetime',
        ];
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }

    public function evenement(): BelongsTo
    {
        return $this->belongsTo(Evenement::class, 'evenement_id');
    }
}
