<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Admin extends Authenticatable
{
    use HasUuids;

    protected $table = 'admins';

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'modified_at';

    protected $fillable = [
        'email',
        'password_hash',
        'originel',
        'statut',
    ];

    protected $hidden = [
        'password_hash',
    ];

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function tokens(): HasMany
    {
        return $this->hasMany(TokenAdmin::class, 'admin');
    }

    public function codesReinitialisation(): HasMany
    {
        return $this->hasMany(CodeReinitialisationAdmin::class, 'admin');
    }
}
