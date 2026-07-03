<?php

namespace Database\Factories;

use App\Models\PaiementSalaire;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaiementSalaireFactory extends Factory
{
    protected $model = PaiementSalaire::class;

    public function definition(): array
    {
        return [
            'montant'               => $this->faker->randomFloat(2, 150000, 1200000),
            'date_paiement'         => $this->faker->dateTimeBetween('-5 months', 'now'),
            'mode_payement'         => $this->faker->randomElement(['virement', 'mobile_money', 'cash']),
            'reference_transaction' => strtoupper($this->faker->bothify('SAL-########')),
        ];
    }
}
