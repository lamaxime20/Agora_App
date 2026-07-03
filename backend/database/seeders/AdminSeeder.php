<?php

namespace Database\Seeders;

use Database\Factories\AdminFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Administrateur unique de la plateforme : Prisca NYANDU.
 */
class AdminSeeder extends Seeder
{
    /**
     * @return array{nom: string, email: string, password: string}
     */
    public function run(): array
    {
        $plainPassword = Str::password(16);

        AdminFactory::new()->create([
            'email'         => 'prisca.nyandu@bytes-corp.com',
            'password_hash' => Hash::make($plainPassword),
            'originel'      => true,
            'statut'        => 'actif',
        ]);

        return [
            'nom'      => 'NYANDU Prisca',
            'email'    => 'prisca.nyandu@bytes-corp.com',
            'password' => $plainPassword,
        ];
    }
}
