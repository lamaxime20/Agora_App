<?php

namespace Database\Factories;

use App\Models\ContenirProduit;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContenirProduitFactory extends Factory
{
    protected $model = ContenirProduit::class;

    public function definition(): array
    {
        $quantite     = $this->faker->numberBetween(1, 10);
        $prixUnitaire = $this->faker->randomFloat(2, 500, 250000);
        $reduction    = $this->faker->randomFloat(2, 0, $prixUnitaire * 0.1);

        return [
            'quantite'      => $quantite,
            'prix_unitaire' => $prixUnitaire,
            'reduction'     => $reduction,
            'montant'       => round($quantite * $prixUnitaire - $reduction, 2),
        ];
    }
}
