<?php

namespace App\Models;

use App\Models\Concerns\BaseUuidModel;

class CodeOtp extends BaseUuidModel
{
    protected $table = 'codes_otp';

    protected function casts(): array
    {
        return [
            'date_creation' => 'datetime',
            'date_expiration' => 'datetime',
            'utilise' => 'boolean',
            'actif' => 'boolean',
        ];
    }
}
