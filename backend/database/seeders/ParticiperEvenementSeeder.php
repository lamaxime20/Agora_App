<?php

namespace Database\Seeders;

use Database\Factories\ParticiperEvenementFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class ParticiperEvenementSeeder extends Seeder
{
    public function run(Collection $allStaff, Collection $evenements): void
    {
        $evenements->each(function ($evenement) use ($allStaff) {
            $participantsCount = min(random_int(3, 6), $allStaff->count());

            $allStaff->random($participantsCount)->each(fn ($utilisateur) => ParticiperEvenementFactory::new()->create([
                'utilisateur_id' => $utilisateur->id,
                'evenement_id'   => $evenement->id,
            ]));
        });
    }
}
