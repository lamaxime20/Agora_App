<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\PayementFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class PayementSeeder extends Seeder
{
    /**
     * @param Collection $commandesValidees Commandes au statut "validee" uniquement.
     */
    public function run(Entreprise $entreprise, Collection $staff, Collection $commandesValidees): Collection
    {
        $payements = collect();

        $commandesValidees->each(function ($commande) use ($entreprise, $staff, $payements) {
            $nbPaiements = collect([0, 1, 1, 1, 2])->random();
            $montantCommande = (float) $commande->montant_commande;

            if ($nbPaiements === 0 || $montantCommande <= 0) {
                return;
            }

            $sommePayee = 0.0;

            for ($i = 0; $i < $nbPaiements; $i++) {
                $estDernier = $i === $nbPaiements - 1;
                $montant = $estDernier
                    ? round($montantCommande - $sommePayee, 2)
                    : round($montantCommande * 0.5, 2);

                if ($montant <= 0) {
                    continue;
                }

                $payements->push(PayementFactory::new()->create([
                    'montant'         => $montant,
                    'commande'        => $commande->id,
                    'user_enregistre' => $staff->random()->id,
                    'entreprise'      => $entreprise->id,
                ]));

                $sommePayee += $montant;
            }

            $etatPayement = $sommePayee <= 0
                ? 'non_paye'
                : ($sommePayee >= $montantCommande ? 'paye' : 'partiellement_paye');

            $commande->update(['etat_payement' => $etatPayement]);
        });

        while ($payements->count() < 20 && $commandesValidees->isNotEmpty()) {
            $commande = $commandesValidees->random();
            $payements->push(PayementFactory::new()->create([
                'montant'         => max(round((float) $commande->montant_commande * 0.1, 2), 1000),
                'commande'        => $commande->id,
                'user_enregistre' => $staff->random()->id,
                'entreprise'      => $entreprise->id,
            ]));
        }

        return $payements;
    }
}
