<?php

namespace Database\Factories;

use App\Models\CodeCouleur;
use Illuminate\Database\Eloquent\Factories\Factory;

class CodeCouleurFactory extends Factory
{
    protected $model = CodeCouleur::class;

    public function definition(): array
    {
        return [
            'couleur_primaire'   => $this->faker->hexColor(),
            'couleur_secondaire' => $this->faker->hexColor(),
            'couleur_tertiaire'  => $this->faker->hexColor(),
        ];
    }
}
