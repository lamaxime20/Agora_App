<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TokenAdmin extends Model
{
    use HasUuids;

    protected $table = 'token_admin';

    public $timestamps = false;

    protected $fillable = [
        'token',
        'date_creation',
        'date_expiration',
        'validite',
        'admin',
    ];

    protected $hidden = [
        'token',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin');
    }
}
