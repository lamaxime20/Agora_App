<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\ProduitFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class ProduitSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $stockStaff, Collection $categories): Collection
    {
        return collect(range(1, 25))->map(fn () => ProduitFactory::new()->create([
            'entreprise'  => $entreprise->id,
            'utilisateur' => $stockStaff->random()->id,
            'categorie'   => $categories->random()->id,
        ]));
    }
}
