<?php

namespace Database\Factories;

use App\Models\Admin;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminFactory extends Factory
{
    protected $model = Admin::class;

    public function definition(): array
    {
        return [
            'email'         => $this->faker->unique()->safeEmail(),
            'password_hash' => Hash::make(Str::password(16)),
            'originel'      => false,
            'statut'        => 'actif',
        ];
    }
}
