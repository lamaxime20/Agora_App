<?php

namespace Database\Seeders;

use Database\Factories\TokenChoixRoleFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class TokenChoixRoleSeeder extends Seeder
{
    public function run(Collection $allStaff): void
    {
        collect(range(1, 10))->each(fn () => TokenChoixRoleFactory::new()->create([
            'utilisateur' => $allStaff->random()->id,
        ]));
    }
}
