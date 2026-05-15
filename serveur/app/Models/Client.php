<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $fillable = ['nom_entreprise', 'contact', 'email', 'adresse', 'etat', 'commercial_id'];

    protected $casts = [
        'etat' => 'string',
    ];

    public function commercial(): BelongsTo
    {
        return $this->belongsTo(User::class, 'commercial_id');
    }

    public function dossiers(): HasMany
    {
        return $this->hasMany(Dossier::class);
    }

    public function visiteClients(): HasMany
    {
        return $this->hasMany(VisiteClient::class);
    }
}