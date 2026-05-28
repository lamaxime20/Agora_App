<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Produit extends Model
{
    use HasUuids;

    protected $table = 'produits';

    public $timestamps = false;

    protected $fillable = [
        'nom',
        'date_creation',
        'date_modification',
        'image',
        'prix_unitaire',
        'type_produit',
        'stock_actuel',
        'unite_mesure',
        'description',
        'statut',
        'utilisateur',
        'entreprise',
        'categorie',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(CategorieProduit::class, 'categorie');
    }

    public function ravitaillements(): HasMany
    {
        return $this->hasMany(Ravitaillement::class, 'produit');
    }

    public function pertesProduit(): HasMany
    {
        return $this->hasMany(PerteProduit::class, 'produit');
    }

    public function commandes(): BelongsToMany
    {
        return $this->belongsToMany(Commande::class, 'contenir_produit', 'produit_id', 'commande_id')
            ->withPivot(['quantite', 'prix_unitaire', 'reduction', 'montant']);
    }

    public function lignesCommande(): HasMany
    {
        return $this->hasMany(ContenirProduit::class, 'produit_id');
    }
}
