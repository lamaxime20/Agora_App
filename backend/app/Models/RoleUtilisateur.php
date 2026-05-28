<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoleUtilisateur extends Model
{
    use HasUuids;

    protected $table = 'roles_utilisateur';

    public $timestamps = false;

    protected $fillable = [
        'role',
        'description',
    ];

    public function utilisateurs(): BelongsToMany
    {
        return $this->belongsToMany(Utilisateur::class, 'appartenir_entreprise', 'role_utilisateur_id', 'utilisateur_id')
            ->withPivot(['entreprise_id', 'date_enregistrement', 'statut']);
    }

    public function appartenances(): HasMany
    {
        return $this->hasMany(AppartenirEntreprise::class, 'role_utilisateur_id');
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
        return $this->hasMany(SessionApp::class, 'role');
    }
}
