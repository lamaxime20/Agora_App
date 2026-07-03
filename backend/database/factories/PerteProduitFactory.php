<?php

namespace Database\Factories;

use App\Models\PerteProduit;
use Illuminate\Database\Eloquent\Factories\Factory;

class PerteProduitFactory extends Factory
{
    protected $model = PerteProduit::class;

    public function definition(): array
    {
        return [
            'quantite_perdu' => $this->faker->randomFloat(2, 1, 50),
            'motif_perte'    => $this->faker->randomElement([
                'Produit périmé', 'Casse durant le transport', 'Vol constaté en entrepôt',
                'Défaut de fabrication', 'Erreur de manipulation en stock',
            ]),
            'date_perte'     => $this->faker->dateTimeBetween('-6 months', 'now'),
        ];
    }
}
