<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EntreeArgent extends Model
{
    use HasUuids;

    protected $table = 'entrees_argent';

    public $timestamps = false;

    protected $fillable = [
        'montant',
        'raison',
        'date_entree',
        'actif',
        'entreprise',
        'utilisateur_marque',
    ];

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function utilisateurMarque(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_marque');
    }
}
