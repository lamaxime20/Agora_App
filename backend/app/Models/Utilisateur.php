<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Utilisateur extends Authenticatable
{
    use HasUuids;

    protected $table = 'utilisateurs';

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'modified_at';

    protected $fillable = [
        'email',
        'password_hash',
        'name',
        'prename',
        'statut',
    ];

    protected $hidden = [
        'password_hash',
    ];

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function entreprisesGerees(): HasMany
    {
        return $this->hasMany(Entreprise::class, 'directeur');
    }

    public function entreprises(): BelongsToMany
    {
        return $this->belongsToMany(Entreprise::class, 'appartenir_entreprise', 'utilisateur_id', 'entreprise_id')
            ->withPivot(['role_utilisateur_id', 'date_enregistrement', 'statut']);
    }

    public function appartenances(): HasMany
    {
        return $this->hasMany(AppartenirEntreprise::class, 'utilisateur_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'utilisateur');
    }

    public function categoriesProduit(): HasMany
    {
        return $this->hasMany(CategorieProduit::class, 'utilisateur');
    }

    public function produits(): HasMany
    {
        return $this->hasMany(Produit::class, 'utilisateur');
    }

    public function ravitaillementsDemandesParUtilisateur(): HasMany
    {
        return $this->hasMany(Ravitaillement::class, 'utilisateur_demande');
    }

    public function ravitaillementsConfirmesParUtilisateur(): HasMany
    {
        return $this->hasMany(Ravitaillement::class, 'user_confirmation');
    }

    public function ravitaillementsAnnulesParUtilisateur(): HasMany
    {
        return $this->hasMany(Ravitaillement::class, 'utilisateur_annulation');
    }

    public function pertesProduitsSignalees(): HasMany
    {
        return $this->hasMany(PerteProduit::class, 'user_signale');
    }

    public function commandesEnregistrees(): HasMany
    {
        return $this->hasMany(Commande::class, 'utilisateur_enregistre');
    }

    public function commandesValidees(): HasMany
    {
        return $this->hasMany(Commande::class, 'utilisateur_valide');
    }

    public function livraisonsEffectuees(): HasMany
    {
        return $this->hasMany(Livraison::class, 'livreur');
    }

    public function livraisonsAnnulees(): HasMany
    {
        return $this->hasMany(Livraison::class, 'utilisateur_annulation');
    }

    public function payementsEnregistres(): HasMany
    {
        return $this->hasMany(Payement::class, 'user_enregistre');
    }

    public function paiementsSalairesEnregistres(): HasMany
    {
        return $this->hasMany(PaiementSalaire::class, 'user_enregistre');
    }

    public function paiementsAbonnementsEnregistres(): HasMany
    {
        return $this->hasMany(PaiementAbonnement::class, 'user_enregistre');
    }

    public function depensesMarquees(): HasMany
    {
        return $this->hasMany(Depense::class, 'utilisateur_marque');
    }

    public function entreesArgentMarquees(): HasMany
    {
        return $this->hasMany(EntreeArgent::class, 'utilisateur_marque');
    }

    public function salaires(): HasMany
    {
        return $this->hasMany(Salaire::class, 'utilisateur');
    }

    public function pertesArgentSignalees(): HasMany
    {
        return $this->hasMany(PerteArgent::class, 'utilisateur_signale');
    }

    public function remboursementsEngages(): HasMany
    {
        return $this->hasMany(Remboursement::class, 'utilisateur_engage');
    }

    public function tachesDefinies(): HasMany
    {
        return $this->hasMany(Tache::class, 'utilisateur_defini');
    }

    public function tachesAssignees(): HasMany
    {
        return $this->hasMany(Tache::class, 'utilisateur_assigne');
    }

    public function evenementsCrees(): HasMany
    {
        return $this->hasMany(Evenement::class, 'creation');
    }

    public function evenements(): BelongsToMany
    {
        return $this->belongsToMany(Evenement::class, 'participer_evenement', 'utilisateur_id', 'evenement_id')
            ->withPivot(['date_participation', 'statut_presence']);
    }

    public function participations(): HasMany
    {
        return $this->hasMany(ParticiperEvenement::class, 'utilisateur_id');
    }

    public function historiques(): HasMany
    {
        return $this->hasMany(Historique::class, 'utilisateur');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(SessionApp::class, 'utilisateur');
    }

    public function tokensChoixRole(): HasMany
    {
        return $this->hasMany(TokenChoixRole::class, 'utilisateur');
    }

    public function codesReinitialisation(): HasMany
    {
        return $this->hasMany(CodeReinitialisation::class, 'utilisateur');
    }
}
