<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\FraisMensuelFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class FraisMensuelSeeder extends Seeder
{
    public function run(Entreprise $entreprise): Collection
    {
        return collect(range(1, 10))->map(fn () => FraisMensuelFactory::new()->create([
            'entreprise' => $entreprise->id,
        ]));
    }
}
