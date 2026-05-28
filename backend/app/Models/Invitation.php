<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invitation extends Model
{
    use HasUuids;

    protected $table = 'invitations';

    public $timestamps = false;

    protected $fillable = [
        'email_invite',
        'date_invitation',
        'statut',
        'date_expiration',
        'actif',
        'role',
        'entreprise',
    ];

    public function role(): BelongsTo
    {
        return $this->belongsTo(RoleUtilisateur::class, 'role');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise');
    }
}
