<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\CommandeFactory;
use Database\Factories\ContenirProduitFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class CommandeSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $venteStaff, Collection $clients, Collection $produits): Collection
    {
        return collect(range(1, 25))->map(function () use ($entreprise, $venteStaff, $clients, $produits) {
            $commande = CommandeFactory::new()->create([
                'entreprise'             => $entreprise->id,
                'utilisateur_enregistre' => $venteStaff->random()->id,
                'client'                 => $clients->random()->id,
                'utilisateur_valide'     => null,
            ]);

            $lignesCount = random_int(1, 4);
            $total       = 0.0;

            $produits->random(min($lignesCount, $produits->count()))->each(function ($produit) use ($commande, &$total) {
                $ligne = ContenirProduitFactory::new()->create([
                    'commande_id' => $commande->id,
                    'produit_id'  => $produit->id,
                ]);
                $total += (float) $ligne->montant;
            });

            $updates = ['montant_commande' => round($total, 2)];
            if ($commande->statut === 'validee') {
                $updates['utilisateur_valide'] = $venteStaff->random()->id;
            }
            $commande->update($updates);

            return $commande->refresh();
        });
    }
}
