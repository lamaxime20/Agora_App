<?php

namespace Database\Factories;

use App\Models\SessionApp;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class SessionAppFactory extends Factory
{
    protected $model = SessionApp::class;

    public function definition(): array
    {
        $dateCreation = $this->faker->dateTimeBetween('-2 months', 'now');

        return [
            'token'           => bin2hex(Str::random(40)),
            'date_creation'   => $dateCreation,
            'date_expiration' => (clone $dateCreation)->modify('+24 hours'),
            'validite'        => $this->faker->boolean(60),
        ];
    }
}
