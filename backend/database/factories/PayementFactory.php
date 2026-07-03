<?php

namespace Database\Factories;

use App\Models\Payement;
use Illuminate\Database\Eloquent\Factories\Factory;

class PayementFactory extends Factory
{
    protected $model = Payement::class;

    public function definition(): array
    {
        return [
            'montant'               => $this->faker->randomFloat(2, 1000, 300000),
            'date_payement'         => $this->faker->dateTimeBetween('-5 months', 'now'),
            'mode_payement'         => $this->faker->randomElement(['cash', 'mobile_money', 'carte_bancaire', 'virement', 'cheque', 'virtuel', 'autre']),
            'reference_transaction' => strtoupper($this->faker->bothify('PAY-########')),
            'actif'                 => true,
        ];
    }
}
