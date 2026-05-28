<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CodeOtp extends Model
{
    use HasUuids;

    protected $table = 'codes_otp';

    public $timestamps = false;

    protected $fillable = [
        'code',
        'email',
        'date_creation',
        'date_expiration',
        'utilise',
        'actif',
    ];
}
