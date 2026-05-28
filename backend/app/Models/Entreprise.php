<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entreprise extends BaseUuidModel
{
    protected $table = 'entreprises';

    protected function casts(): array
    {
        return [
            'argent_virtuel' => 'decimal:2',
        ];
    }

    public function directeur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'directeur');
    }

    public function codesCouleurs(): HasMany
    {
        return $this->hasMany(CodeCouleur::class, 'entreprise');
    }

    public function membres(): HasMany
    {
        return $this->hasMany(AppartenirEntreprise::class, 'entreprise_id');
    }

    public function utilisateurs(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'appartenir_entreprise',
            'entreprise_id',
            'utilisateur_id'
        )->withPivot(['role_utilisateur_id', 'date_enregistrement', 'statut']);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class, 'entreprise');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'entreprise');
    }

    public function categoriesProduits(): HasMany
    {
        return $this->hasMany(CategorieProduit::class, 'entreprise');
    }

    public function produits(): HasMany
    {
        return $this->hasMany(Produit::class, 'entreprise');
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class, 'entreprise');
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
        return $this->hasMany(Session::class, 'entreprise');
    }
}
