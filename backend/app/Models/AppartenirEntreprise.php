<?php

namespace App\Models;

use App\Models\Concerns\BasePivotModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppartenirEntreprise extends BasePivotModel
{
    protected $table = 'appartenir_entreprise';

    protected function casts(): array
    {
        return [
            'date_enregistrement' => 'datetime',
        ];
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise_id');
    }

    public function roleUtilisateur(): BelongsTo
    {
        return $this->belongsTo(RoleUtilisateur::class, 'role_utilisateur_id');
    }
}
