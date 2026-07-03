<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\CodeCouleurFactory;
use Illuminate\Database\Seeder;

class CodeCouleurSeeder extends Seeder
{
    public function run(Entreprise $entreprise): void
    {
        CodeCouleurFactory::new()->create([
            'couleur_primaire'   => '#1D4ED8',
            'couleur_secondaire' => '#0F172A',
            'couleur_tertiaire'  => '#F1F5F9',
            'entreprise'         => $entreprise->id,
        ]);
    }
}
