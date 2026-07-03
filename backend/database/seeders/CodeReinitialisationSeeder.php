<?php

namespace Database\Seeders;

use Database\Factories\CodeReinitialisationFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class CodeReinitialisationSeeder extends Seeder
{
    public function run(Collection $allStaff): void
    {
        collect(range(1, 10))->each(fn () => CodeReinitialisationFactory::new()->create([
            'utilisateur' => $allStaff->random()->id,
        ]));
    }
}
