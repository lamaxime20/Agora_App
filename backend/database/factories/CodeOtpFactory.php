<?php

namespace Database\Factories;

use App\Models\CodeOtp;
use Illuminate\Database\Eloquent\Factories\Factory;

class CodeOtpFactory extends Factory
{
    protected $model = CodeOtp::class;

    public function definition(): array
    {
        $dateCreation = $this->faker->dateTimeBetween('-2 months', 'now');

        return [
            'code'            => str_pad((string) $this->faker->numberBetween(0, 999999), 6, '0', STR_PAD_LEFT),
            'email'           => $this->faker->unique()->safeEmail(),
            'date_creation'   => $dateCreation,
            'date_expiration' => (clone $dateCreation)->modify('+10 minutes'),
            'utilise'         => $this->faker->boolean(50),
            'actif'           => false,
        ];
    }
}
