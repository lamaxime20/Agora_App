<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\PerteArgentFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class PerteArgentSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $financeStaff): Collection
    {
        return collect(range(1, 12))->map(fn () => PerteArgentFactory::new()->create([
            'entreprise'          => $entreprise->id,
            'utilisateur_signale' => $financeStaff->random()->id,
        ]));
    }
}
