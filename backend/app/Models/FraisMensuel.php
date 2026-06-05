<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FraisMensuel extends Model
{
    use HasUuids;

    protected $table = 'frais_mensuel';

    public $timestamps = false;

    protected $fillable = [
        'service_paye',
        'fournisseur',
        'montant_mensuel',
        'depense_active',
        'date_abonnement',
        'actif',
        'entreprise',
    ];

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(PaiementAbonnement::class, 'abonnement');
    }
}
