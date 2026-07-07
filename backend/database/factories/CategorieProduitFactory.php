<?php

namespace Database\Factories;

use App\Models\CategorieProduit;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategorieProduitFactory extends Factory
{
    protected $model = CategorieProduit::class;

    public function definition(): array
    {
        return [
            'categorie'   => 'Catégorie générale',
            'description' => "Catégorie de produits et services proposés par Bytes-Corp.",
        ];
    }
}
