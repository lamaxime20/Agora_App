<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Historique extends Model
{
    use HasUuids;

    protected $table = 'historiques';

    public $timestamps = false;

    protected $fillable = [
        'module',
        'table_concernee',
        'id_element',
        'action',
        'details_action',
        'ancienne_valeur',
        'nouvelle_valeur',
        'ip',
        'user_agent',
        'date_action',
        'utilisateur',
        'entreprise',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }
}
