<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\RavitaillementFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class RavitaillementSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $stockStaff, Collection $produits): Collection
    {
        return collect(range(1, 20))->map(function () use ($entreprise, $stockStaff, $produits) {
            $ravitaillement = RavitaillementFactory::new()->create([
                'utilisateur_demande' => $stockStaff->random()->id,
                'produit'             => $produits->random()->id,
                'entreprise'          => $entreprise->id,
            ]);

            if (in_array($ravitaillement->statut, ['en_cours', 'termine'], true)) {
                $ravitaillement->update(['user_confirmation' => $stockStaff->random()->id]);
            } elseif ($ravitaillement->statut === 'annule') {
                $ravitaillement->update(['utilisateur_annulation' => $stockStaff->random()->id]);
            }

            return $ravitaillement;
        });
    }
}
