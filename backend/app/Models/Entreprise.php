<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Entreprise extends Model
{
    use HasUuids;

    protected $table = 'entreprises';

    public $timestamps = false;

    protected $fillable = [
        'nom',
        'logo',
        'code_couleur',
        'email',
        'telephone',
        'site_web',
        'pays',
        'ville',
        'adresse',
        'secteur_activite',
        'description',
        'politique_entreprise',
        'argent_virtuel',
        'statut',
        'directeur',
    ];

    public function directeur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'directeur');
    }

    public function codeCouleur(): HasOne
    {
        return $this->hasOne(CodeCouleur::class, 'entreprise');
    }

    public function membres(): BelongsToMany
    {
        return $this->belongsToMany(Utilisateur::class, 'appartenir_entreprise', 'entreprise_id', 'utilisateur_id')
            ->withPivot(['role_utilisateur_id', 'date_enregistrement', 'statut']);
    }

    public function appartenances(): HasMany
    {
        return $this->hasMany(AppartenirEntreprise::class, 'entreprise_id');
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class, 'entreprise');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'entreprise');
    }

    public function categoriesProduit(): HasMany
    {
        return $this->hasMany(CategorieProduit::class, 'entreprise');
    }

    public function produits(): HasMany
    {
        return $this->hasMany(Produit::class, 'entreprise');
    }

    public function commandes(): HasMany
    {
        return $this->hasMany(Commande::class, 'entreprise');
    }

    public function payements(): HasMany
    {
        return $this->hasMany(Payement::class, 'entreprise');
    }

    public function depenses(): HasMany
    {
        return $this->hasMany(Depense::class, 'entreprise');
    }

    public function entreesArgent(): HasMany
    {
        return $this->hasMany(EntreeArgent::class, 'entreprise');
    }

    public function salaires(): HasMany
    {
        return $this->hasMany(Salaire::class, 'entreprise');
    }

    public function fraisMensuels(): HasMany
    {
        return $this->hasMany(FraisMensuel::class, 'entreprise');
    }

    public function pertesArgent(): HasMany
    {
        return $this->hasMany(PerteArgent::class, 'entreprise');
    }

    public function remboursements(): HasMany
    {
        return $this->hasMany(Remboursement::class, 'entreprise');
    }

    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class, 'entreprise');
    }

    public function evenements(): HasMany
    {
        return $this->hasMany(Evenement::class, 'entreprise');
    }

    public function historiques(): HasMany
    {
        return $this->hasMany(Historique::class, 'entreprise');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(SessionApp::class, 'entreprise');
    }
}
