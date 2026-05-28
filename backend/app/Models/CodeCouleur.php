<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CodeCouleur extends Model
{
    use HasUuids;

    protected $table = 'codes_couleurs';

    public $timestamps = false;

    protected $fillable = [
        'couleur_primaire',
        'couleur_secondaire',
        'couleur_tertiaire',
        'entreprise',
    ];

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }
}
