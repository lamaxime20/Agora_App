<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Relations\Pivot;

abstract class BasePivotModel extends Pivot
{
    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];
}
