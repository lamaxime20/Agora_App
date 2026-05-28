<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Foundation\Auth\User as Authenticatable;

abstract class BaseAuthenticatableUuidModel extends Authenticatable
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }
}
