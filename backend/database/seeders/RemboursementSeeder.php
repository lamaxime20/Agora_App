<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\RemboursementFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class RemboursementSeeder extends Seeder
{
    /**
     * @param Collection $commandesValidees Commandes au statut "validee" uniquement.
     */
    public function run(Entreprise $entreprise, Collection $financeStaff, Collection $commandesValidees): Collection
    {
        if ($commandesValidees->isEmpty()) {
            return collect();
        }

        return collect(range(1, 12))->map(fn () => RemboursementFactory::new()->create([
            'commande'            => $commandesValidees->random()->id,
            'utilisateur_engage'  => $financeStaff->random()->id,
            'entreprise'          => $entreprise->id,
        ]));
    }
}
