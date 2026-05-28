<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Commande extends BaseUuidModel
{
    protected $table = 'commandes';

    protected function casts(): array
    {
        return [
            'date_commande' => 'datetime',
            'date_validation' => 'datetime',
            'date_annulation' => 'datetime',
            'montant_commande' => 'decimal:2',
            'actif' => 'boolean',
        ];
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function utilisateurEnregistre(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_enregistre');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client');
    }

    public function utilisateurValide(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_valide');
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(ContenirProduit::class, 'commande_id');
    }

    public function livraisons(): HasMany
    {
        return $this->hasMany(Livraison::class, 'commande');
    }

    public function payements(): HasMany
    {
        return $this->hasMany(Payement::class, 'commande');
    }

    public function remboursements(): HasMany
    {
        return $this->hasMany(Remboursement::class, 'commande');
    }
}
