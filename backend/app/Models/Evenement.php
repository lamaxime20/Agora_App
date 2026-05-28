<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evenement extends Model
{
    use HasUuids;

    protected $table = 'evenements';

    public $timestamps = false;

    protected $fillable = [
        'nom',
        'description',
        'date_evenement',
        'lieu',
        'statut',
        'actif',
        'creation',
        'entreprise',
    ];

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'creation');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(Utilisateur::class, 'participer_evenement', 'evenement_id', 'utilisateur_id')
            ->withPivot(['date_participation', 'statut_presence']);
    }

    public function presences(): HasMany
    {
        return $this->hasMany(ParticiperEvenement::class, 'evenement_id');
    }
}
