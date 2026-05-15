<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentFournisseur extends Model
{
    protected $fillable = ['fournisseur_id', 'type', 'fichier_pdf'];

    protected $casts = [
        'type' => 'string',
    ];

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class);
    }
}