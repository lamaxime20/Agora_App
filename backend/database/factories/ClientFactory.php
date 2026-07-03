<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        return [
            'email'     => $this->faker->optional(0.7)->safeEmail(),
            'nom'       => $this->faker->lastName(),
            'prenom'    => $this->faker->optional(0.8)->firstName(),
            'telephone' => $this->faker->optional(0.8)->phoneNumber(),
        ];
    }
}
