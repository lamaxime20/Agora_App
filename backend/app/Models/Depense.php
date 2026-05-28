<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Depense extends Model
{
    use HasUuids;

    protected $table = 'depenses';

    public $timestamps = false;

    protected $fillable = [
        'montant',
        'date_depense',
        'raison',
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
