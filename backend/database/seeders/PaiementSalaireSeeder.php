<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\PaiementSalaireFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class PaiementSalaireSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $financeStaff, Collection $salaires): Collection
    {
        return $salaires->map(function ($salaire) use ($entreprise, $financeStaff) {
            $paiement = PaiementSalaireFactory::new()->create([
                'salaire'         => $salaire->id,
                'montant'         => $salaire->montant,
                'user_enregistre' => $financeStaff->random()->id,
                'entreprise'      => $entreprise->id,
            ]);

            $salaire->update(['date_paiement' => $paiement->date_paiement]);

            return $paiement;
        });
    }
}
