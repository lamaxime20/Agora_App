<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MouvementFinancier extends Model
{
    use HasUuids;

    protected $table = 'mouvements_financiers';

    public $timestamps = false;

    protected $fillable = [
        'date_operation',
        'type_operation',
        'montant',
        'sens',
        'reference_id',
        'description',
        'entreprise_id',
        'utilisateur_id',
    ];

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise_id');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }
}
