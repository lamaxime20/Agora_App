<?php

namespace Database\Factories;

use App\Models\PerteArgent;
use Illuminate\Database\Eloquent\Factories\Factory;

class PerteArgentFactory extends Factory
{
    protected $model = PerteArgent::class;

    public function definition(): array
    {
        return [
            'cause'        => $this->faker->randomElement([
                'Erreur de caisse', 'Vol constaté', 'Pénalité de retard fournisseur',
                'Frais bancaires imprévus', 'Litige commercial perdu',
            ]),
            'montant'      => $this->faker->randomFloat(2, 2000, 100000),
            'date_constat' => $this->faker->dateTimeBetween('-6 months', 'now'),
            'actif'        => true,
        ];
    }
}
