<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\EvenementFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class EvenementSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $allStaff): Collection
    {
        return collect(range(1, 12))->map(fn () => EvenementFactory::new()->create([
            'entreprise' => $entreprise->id,
            'creation'   => $allStaff->random()->id,
        ]));
    }
}
