<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\DepenseFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class DepenseSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $financeStaff): Collection
    {
        return collect(range(1, 20))->map(fn () => DepenseFactory::new()->create([
            'entreprise'          => $entreprise->id,
            'utilisateur_marque'  => $financeStaff->random()->id,
        ]));
    }
}
