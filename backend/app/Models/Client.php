<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasUuids;

    protected $table = 'clients';

    public $timestamps = false;

    protected $fillable = [
        'email',
        'nom',
        'prenom',
        'telephone',
        'entreprise',
    ];

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function commandes(): HasMany
    {
        return $this->hasMany(Commande::class, 'client');
    }
}
