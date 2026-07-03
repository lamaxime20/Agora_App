<?php

namespace Database\Factories;

use App\Models\AppartenirEntreprise;
use Illuminate\Database\Eloquent\Factories\Factory;

class AppartenirEntrepriseFactory extends Factory
{
    protected $model = AppartenirEntreprise::class;

    public function definition(): array
    {
        return [
            'date_enregistrement' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'statut'              => 'actif',
        ];
    }
}
