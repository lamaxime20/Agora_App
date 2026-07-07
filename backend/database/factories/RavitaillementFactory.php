<?php

namespace Database\Factories;

use App\Models\Ravitaillement;
use Illuminate\Database\Eloquent\Factories\Factory;

class RavitaillementFactory extends Factory
{
    protected $model = Ravitaillement::class;

    private const RAISONS_ANNULATION = [
        'Fournisseur en rupture de stock.',
        'Budget insuffisant pour ce mois.',
        'Produit remplacé par un modèle plus récent.',
        'Demande faite en double.',
        'Besoin réévalué à la baisse par le service concerné.',
    ];

    public function definition(): array
    {
        $dateCreation = $this->faker->dateTimeBetween('-6 months', 'now');
        $statut       = $this->faker->randomElement(['en_attente', 'refuse', 'en_cours', 'annule', 'termine']);

        return [
            'date_creation'      => $dateCreation,
            'statut'             => $statut,
            'quantite'           => $this->faker->randomFloat(2, 10, 300),
            'montant_a_depenser' => $this->faker->randomFloat(2, 5000, 500000),
            'date_validation'    => in_array($statut, ['en_cours', 'termine']) ? (clone $dateCreation)->modify('+1 day') : null,
            'date_execution'     => $statut === 'termine' ? (clone $dateCreation)->modify('+3 days') : null,
            'date_annulation'    => $statut === 'annule' ? (clone $dateCreation)->modify('+1 day') : null,
            'raison_annulation'  => $statut === 'annule' ? $this->faker->randomElement(self::RAISONS_ANNULATION) : null,
            'actif'              => true,
        ];
    }
}
