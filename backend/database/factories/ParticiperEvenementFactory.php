<?php

namespace Database\Factories;

use App\Models\ParticiperEvenement;
use Illuminate\Database\Eloquent\Factories\Factory;

class ParticiperEvenementFactory extends Factory
{
    protected $model = ParticiperEvenement::class;

    public function definition(): array
    {
        return [
            'date_participation' => $this->faker->dateTimeBetween('-2 months', 'now'),
            'statut_presence'    => $this->faker->randomElement(['present', 'absent', 'retard']),
        ];
    }
}
