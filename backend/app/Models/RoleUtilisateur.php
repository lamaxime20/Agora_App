<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoleUtilisateur extends BaseUuidModel
{
    protected $table = 'roles_utilisateur';

    protected function casts(): array
    {
        return [];
    }

    public function entreprises(): HasMany
    {
        return $this->hasMany(AppartenirEntreprise::class, 'role_utilisateur_id');
    }

    public function utilisateurs(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'appartenir_entreprise',
            'role_utilisateur_id',
            'utilisateur_id'
        )->withPivot(['entreprise_id', 'date_enregistrement', 'statut']);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class, 'role');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'role');
    }

    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class, 'role_associe');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class, 'role');
    }
}
