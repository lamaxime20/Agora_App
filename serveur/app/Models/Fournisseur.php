<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fournisseur extends Model
{
    protected $fillable = ['nom_entreprise', 'contact', 'email', 'adresse'];

    public function documentFournisseurs(): HasMany
    {
        return $this->hasMany(DocumentFournisseur::class);
    }
}