<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Dossier extends Model
{
    protected $fillable = ['nom', 'client_id', 'statut', 'etat', 'documents'];

    protected $casts = [
        'statut' => 'string',
        'etat' => 'string',
        'documents' => 'array',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function proforma(): HasOne
    {
        return $this->hasOne(Proforma::class);
    }
}