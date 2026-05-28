<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerteArgent extends Model
{
    use HasUuids;

    protected $table = 'pertes_argent';

    public $timestamps = false;

    protected $fillable = [
        'cause',
        'montant',
        'date_constat',
        'actif',
        'entreprise',
        'utilisateur_signale',
    ];

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function utilisateurSignale(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_signale');
    }
}
