<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\HistoriqueFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class HistoriqueSeeder extends Seeder
{
    private const DETAILS_PAR_TABLE_ACTION = [
        'produits'        => ['creation' => "Un nouveau produit a été ajouté au catalogue."],
        'ravitaillements' => ['validation' => "Une demande de réapprovisionnement a été validée."],
        'commandes'       => ['validation' => "Une commande a été validée par un responsable des ventes."],
        'payements'       => ['creation' => "Un paiement a été enregistré pour une commande."],
        'taches'          => ['assignation' => "Une tâche a été assignée à un employé."],
    ];

    /**
     * @param array<int, array{module: string, table: string, action: string, ids: Collection}> $targets
     */
    public function run(Entreprise $entreprise, Collection $allStaff, array $targets): void
    {
        collect(range(1, 30))->each(function () use ($entreprise, $allStaff, $targets) {
            $target = $targets[array_rand($targets)];
            $details = self::DETAILS_PAR_TABLE_ACTION[$target['table']][$target['action']]
                ?? "Une action a été effectuée sur le module {$target['module']}.";

            HistoriqueFactory::new()->create([
                'module'          => $target['module'],
                'table_concernee' => $target['table'],
                'id_element'      => $target['ids']->random(),
                'action'          => $target['action'],
                'details_action'  => $details,
                'utilisateur'     => $allStaff->random()->id,
                'entreprise'      => $entreprise->id,
            ]);
        });
    }
}
