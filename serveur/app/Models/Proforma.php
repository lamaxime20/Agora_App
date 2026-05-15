<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Proforma extends Model
{
    use HasFactory;

    protected $fillable = ['dossier_id', 'total_ttc'];

    public function dossier()
    {
        return $this->belongsTo(Dossier::class);
    }

    public function ligneProformas()
    {
        return $this->hasMany(LigneProforma::class);
    }
}