<?php

namespace Database\Factories;

use App\Models\Utilisateur;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UtilisateurFactory extends Factory
{
    protected $model = Utilisateur::class;

    public function definition(): array
    {
        return [
            'email'         => $this->faker->unique()->safeEmail(),
            'password_hash' => Hash::make(Str::password(14)),
            'name'          => $this->faker->lastName(),
            'prename'       => $this->faker->firstName(),
            'statut'        => 'actif',
        ];
    }
}
