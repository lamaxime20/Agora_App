<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Livraison extends Model
{
    use HasUuids;

    protected $table = 'livraisons';

    public $timestamps = false;

    protected $fillable = [
        'date_creation',
        'date_livraison_effective',
        'statut',
        'motif_echec',
        'motif_retour',
        'date_lancement',
        'actif',
        'commande',
        'livreur',
    ];

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'commande');
    }

    public function livreur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'livreur');
    }
}
