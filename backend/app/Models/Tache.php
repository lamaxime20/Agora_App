<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tache extends Model
{
    use HasUuids;

    protected $table = 'taches';

    public $timestamps = false;

    protected $fillable = [
        'nom',
        'description',
        'date_demande',
        'date_limite',
        'statut',
        'pourcentage_avancement',
        'raison_annulation',
        'raison_report',
        'date_fin',
        'actif',
        'utilisateur_defini',
        'utilisateur_assigne',
        'role_associe',
        'entreprise',
    ];

    public function utilisateurDefini(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_defini');
    }

    public function utilisateurAssigne(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_assigne');
    }

    public function roleAssocie(): BelongsTo
    {
        return $this->belongsTo(RoleUtilisateur::class, 'role_associe');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }
}
