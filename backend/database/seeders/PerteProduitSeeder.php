<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\PerteProduitFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class PerteProduitSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $stockStaff, Collection $produits): Collection
    {
        return collect(range(1, 15))->map(fn () => PerteProduitFactory::new()->create([
            'user_signale' => $stockStaff->random()->id,
            'produit'      => $produits->random()->id,
            'entreprise'   => $entreprise->id,
        ]));
    }
}
