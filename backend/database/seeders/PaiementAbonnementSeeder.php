<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\PaiementAbonnementFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class PaiementAbonnementSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $financeStaff, Collection $abonnements): Collection
    {
        $paiements = collect();

        $abonnements->each(function ($abonnement) use ($entreprise, $financeStaff, $paiements) {
            $nb = collect([1, 1, 2])->random();

            for ($i = 0; $i < $nb; $i++) {
                $paiements->push(PaiementAbonnementFactory::new()->create([
                    'abonnement'      => $abonnement->id,
                    'montant'         => $abonnement->montant_mensuel,
                    'user_enregistre' => $financeStaff->random()->id,
                    'entreprise'      => $entreprise->id,
                ]));
            }
        });

        return $paiements;
    }
}
