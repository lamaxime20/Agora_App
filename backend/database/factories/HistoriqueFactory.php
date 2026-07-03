<?php

namespace Database\Factories;

use App\Models\Historique;
use Illuminate\Database\Eloquent\Factories\Factory;

class HistoriqueFactory extends Factory
{
    protected $model = Historique::class;

    public function definition(): array
    {
        return [
            'module'          => $this->faker->randomElement(['stock', 'ventes', 'finances', 'rh', 'livraison']),
            'table_concernee' => 'produits',
            'action'          => 'creation',
            'details_action'  => $this->faker->sentence(),
            'ancienne_valeur' => null,
            'nouvelle_valeur' => null,
            'ip'              => $this->faker->ipv4(),
            'user_agent'      => $this->faker->userAgent(),
            'date_action'     => $this->faker->dateTimeBetween('-6 months', 'now'),
        ];
    }
}
