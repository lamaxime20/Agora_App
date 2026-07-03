<?php

namespace Database\Factories;

use App\Models\CodeReinitialisation;
use Illuminate\Database\Eloquent\Factories\Factory;

class CodeReinitialisationFactory extends Factory
{
    protected $model = CodeReinitialisation::class;

    public function definition(): array
    {
        $dateCreation = $this->faker->dateTimeBetween('-2 months', 'now');

        return [
            'code'            => str_pad((string) $this->faker->numberBetween(0, 999999), 6, '0', STR_PAD_LEFT),
            'date_creation'   => $dateCreation,
            'date_expiration' => (clone $dateCreation)->modify('+1 hour'),
            'utilise'         => $this->faker->boolean(50),
            'actif'           => false,
        ];
    }
}
