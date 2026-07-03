<?php

namespace Database\Factories;

use App\Models\CategorieProduit;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategorieProduitFactory extends Factory
{
    protected $model = CategorieProduit::class;

    public function definition(): array
    {
        return [
            'categorie'   => $this->faker->unique()->words(2, true),
            'description' => $this->faker->sentence(),
        ];
    }
}
