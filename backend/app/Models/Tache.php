<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tache extends BaseUuidModel
{
    protected $table = 'taches';

    protected function casts(): array
    {
        return [
            'date_demande' => 'datetime',
            'date_limite' => 'datetime',
            'date_fin' => 'datetime',
            'pourcentage_avancement' => 'integer',
            'actif' => 'boolean',
        ];
    }

    public function utilisateurDefini(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_defini');
    }

    public function utilisateurAssigne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_assigne');
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
