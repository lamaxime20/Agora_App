<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\LivraisonFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class LivraisonSeeder extends Seeder
{
    /**
     * @param Collection $commandesValidees Commandes au statut "validee" uniquement.
     */
    public function run(Entreprise $entreprise, Collection $livraisonStaff, Collection $commandesValidees): Collection
    {
        $count = min(18, $commandesValidees->count());

        return $commandesValidees->shuffle()->take($count)->map(fn ($commande) => LivraisonFactory::new()->create([
            'commande' => $commande->id,
            'livreur'  => $livraisonStaff->random()->id,
        ]));
    }
}
