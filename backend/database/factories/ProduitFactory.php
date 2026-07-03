<?php

namespace Database\Factories;

use App\Models\Produit;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProduitFactory extends Factory
{
    protected $model = Produit::class;

    public function definition(): array
    {
        $dateCreation = $this->faker->dateTimeBetween('-1 year', '-1 month');

        return [
            'nom'               => ucfirst($this->faker->words(3, true)),
            'date_creation'     => $dateCreation,
            'date_modification' => $this->faker->optional(0.4)->dateTimeBetween($dateCreation, 'now'),
            'image'             => null,
            'prix_unitaire'     => $this->faker->randomFloat(2, 500, 250000),
            'seuil_alerte'      => $this->faker->randomFloat(2, 5, 20),
            'type_produit'      => $this->faker->randomElement(['physique', 'service']),
            'stock_actuel'      => $this->faker->randomFloat(2, 0, 500),
            'unite_mesure'      => $this->faker->randomElement(['pièce', 'kg', 'litre', 'carton', 'unité']),
            'description'       => $this->faker->sentence(),
            'statut'            => 'actif',
        ];
    }
}
