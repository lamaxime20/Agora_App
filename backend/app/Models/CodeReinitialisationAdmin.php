<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CodeReinitialisationAdmin extends Model
{
    use HasUuids;

    protected $table = 'codes_reinitialisation_admin';

    public $timestamps = false;

    protected $fillable = [
        'code',
        'date_creation',
        'date_expiration',
        'utilise',
        'actif',
        'admin',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin');
    }
}
