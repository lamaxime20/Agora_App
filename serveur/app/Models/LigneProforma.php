<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LigneProforma extends Model
{
    protected $fillable = ['proforma_id', 'designation', 'quantite', 'prix_unitaire'];

    public function proforma(): BelongsTo
    {
        return $this->belongsTo(Proforma::class);
    }
}