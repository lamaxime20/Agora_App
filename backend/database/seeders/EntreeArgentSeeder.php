<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\EntreeArgentFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class EntreeArgentSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $financeStaff): Collection
    {
        return collect(range(1, 18))->map(fn () => EntreeArgentFactory::new()->create([
            'entreprise'          => $entreprise->id,
            'utilisateur_marque'  => $financeStaff->random()->id,
        ]));
    }
}
