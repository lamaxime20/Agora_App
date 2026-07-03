<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\SalaireFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class SalaireSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $allStaff): Collection
    {
        return collect(range(1, 20))->map(fn () => SalaireFactory::new()->create([
            'entreprise'  => $entreprise->id,
            'utilisateur' => $allStaff->random()->id,
        ]));
    }
}
