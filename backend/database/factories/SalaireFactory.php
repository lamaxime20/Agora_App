<?php

namespace Database\Factories;

use App\Models\Salaire;
use Illuminate\Database\Eloquent\Factories\Factory;

class SalaireFactory extends Factory
{
    protected $model = Salaire::class;

    public function definition(): array
    {
        $debut = $this->faker->dateTimeBetween('-6 months', '-1 month');

        return [
            'montant'       => $this->faker->randomFloat(2, 150000, 1200000),
            'date_debut'    => $debut,
            'date_fin'      => (clone $debut)->modify('+1 month'),
            'date_paiement' => null,
            'actif'         => true,
            'statut'        => 'actif',
        ];
    }
}
