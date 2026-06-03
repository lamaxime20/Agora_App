<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Commande extends Model
{
    use HasUuids;

    protected $table = 'commandes';

    public $timestamps = false;

    protected $fillable = [
        'date_commande',
        'statut',
        'etat_payement',
        'montant_commande',
        'adresse_livraison',
        'date_livraison_prevue',
        'notes_supplementaires',
        'date_validation',
        'date_annulation',
        'raison_annulation',
        'actif',
        'entreprise',
        'utilisateur_enregistre',
        'client',
        'utilisateur_valide',
    ];

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function utilisateurEnregistre(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_enregistre');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client');
    }

    public function utilisateurValide(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_valide');
    }

    public function produits(): BelongsToMany
    {
        return $this->belongsToMany(Produit::class, 'contenir_produit', 'commande_id', 'produit_id')
            ->withPivot(['quantite', 'prix_unitaire', 'reduction', 'montant']);
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
