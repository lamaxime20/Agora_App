<?php

namespace App\Models;

use App\Models\Concerns\BaseAuthenticatableUuidModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends BaseAuthenticatableUuidModel
{
    use HasFactory;

    protected $table = 'utilisateurs';

    public $timestamps = true;

    public const CREATED_AT = 'created_at';

    public const UPDATED_AT = 'modified_at';

    protected $hidden = [
        'password_hash',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'modified_at' => 'datetime',
            'password_hash' => 'hashed',
        ];
    }

    public function entreprisesDirigees(): HasMany
    {
        return $this->hasMany(Entreprise::class, 'directeur');
    }

    public function entreprises(): BelongsToMany
    {
        return $this->belongsToMany(
            Entreprise::class,
            'appartenir_entreprise',
            'utilisateur_id',
            'entreprise_id'
        )->withPivot(['role_utilisateur_id', 'date_enregistrement', 'statut']);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'utilisateur');
    }

    public function categoriesProduits(): HasMany
    {
        return $this->hasMany(CategorieProduit::class, 'utilisateur');
    }

    public function produits(): HasMany
    {
        return $this->hasMany(Produit::class, 'utilisateur');
    }

    public function ravitaillementsDemandes(): HasMany
    {
        return $this->hasMany(Ravitaillement::class, 'utilisateur_demande');
    }

    public function ravitaillementsConfirmes(): HasMany
    {
        return $this->hasMany(Ravitaillement::class, 'user_confirmation');
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

    public function livraisons(): HasMany
    {
        return $this->hasMany(Livraison::class, 'livreur');
    }

    public function payementsEnregistres(): HasMany
    {
        return $this->hasMany(Payement::class, 'user_enregistre');
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

    public function tachesDefinies(): HasMany
    {
        return $this->hasMany(Tache::class, 'utilisateur_defini');
    }

    public function tachesAssignees(): HasMany
    {
        return $this->hasMany(Tache::class, 'utilisateur_assigne');
    }

    public function evenementsCreees(): HasMany
    {
        return $this->hasMany(Evenement::class, 'creation');
    }

    public function historiques(): HasMany
    {
        return $this->hasMany(Historique::class, 'utilisateur');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class, 'utilisateur');
    }

    public function tokenChoixRoles(): HasMany
    {
        return $this->hasMany(TokenChoixRole::class, 'utilisateur');
    }

    public function codesReinitialisation(): HasMany
    {
        return $this->hasMany(CodeReinitialisation::class, 'utilisateur');
    }
}
