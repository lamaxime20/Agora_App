<?php

namespace Database\Factories;

use App\Models\PaiementAbonnement;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaiementAbonnementFactory extends Factory
{
    protected $model = PaiementAbonnement::class;

    public function definition(): array
    {
        return [
            'montant'               => $this->faker->randomFloat(2, 5000, 150000),
            'date_paiement'         => $this->faker->dateTimeBetween('-5 months', 'now'),
            'reference_transaction' => strtoupper($this->faker->bothify('ABO-########')),
        ];
    }
}
