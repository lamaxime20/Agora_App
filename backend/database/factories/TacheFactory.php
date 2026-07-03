<?php

namespace Database\Factories;

use App\Models\Tache;
use Illuminate\Database\Eloquent\Factories\Factory;

class TacheFactory extends Factory
{
    protected $model = Tache::class;

    public function definition(): array
    {
        $dateDemande = $this->faker->dateTimeBetween('-4 months', 'now');
        $statut      = $this->faker->randomElement(['en_attente', 'en_cours', 'terminee', 'annulee', 'reportee']);

        return [
            'nom'                    => $this->faker->randomElement([
                'Préparer le rapport mensuel', 'Réapprovisionner le rayon principal',
                'Contacter les clients en retard de paiement', 'Mettre à jour l\'inventaire',
                'Former le nouvel employé', 'Organiser la tournée de livraison',
                'Auditer les dépenses du mois', 'Relancer les factures impayées',
            ]),
            'description'            => $this->faker->sentence(),
            'date_demande'           => $dateDemande,
            'date_limite'            => (clone $dateDemande)->modify('+' . $this->faker->numberBetween(3, 21) . ' days'),
            'statut'                 => $statut,
            'pourcentage_avancement' => $statut === 'terminee' ? 100 : ($statut === 'en_cours' ? $this->faker->numberBetween(10, 90) : 0),
            'raison_annulation'      => $statut === 'annulee' ? $this->faker->sentence() : null,
            'raison_report'         => $statut === 'reportee' ? $this->faker->sentence() : null,
            'date_fin'               => $statut === 'terminee' ? (clone $dateDemande)->modify('+' . $this->faker->numberBetween(1, 20) . ' days') : null,
            'actif'                  => true,
        ];
    }
}
