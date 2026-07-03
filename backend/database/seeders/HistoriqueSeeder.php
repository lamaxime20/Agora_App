<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\HistoriqueFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class HistoriqueSeeder extends Seeder
{
    /**
     * @param array<int, array{module: string, table: string, action: string, ids: Collection}> $targets
     */
    public function run(Entreprise $entreprise, Collection $allStaff, array $targets): void
    {
        collect(range(1, 30))->each(function () use ($entreprise, $allStaff, $targets) {
            $target = $targets[array_rand($targets)];

            HistoriqueFactory::new()->create([
                'module'          => $target['module'],
                'table_concernee' => $target['table'],
                'id_element'      => $target['ids']->random(),
                'action'          => $target['action'],
                'utilisateur'     => $allStaff->random()->id,
                'entreprise'      => $entreprise->id,
            ]);
        });
    }
}
