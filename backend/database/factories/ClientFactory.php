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
            'nom'       => 'Client',
            'prenom'    => 'Divers',
            'telephone' => $this->faker->optional(0.8)->numerify('+237 6## ## ## ##'),
        ];
    }
}
