<?php

namespace Database\Factories;

use App\Models\Commande;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommandeFactory extends Factory
{
    protected $model = Commande::class;

    public function definition(): array
    {
        $dateCommande = $this->faker->dateTimeBetween('-6 months', 'now');
        $statut       = $this->faker->randomElement(['brouillon', 'validee', 'validee', 'validee', 'annulee']);

        return [
            'date_commande'               => $dateCommande,
            'statut'                      => $statut,
            'etat_payement'               => 'non_paye',
            'montant_commande'            => 0,
            'montant_minimum_validation'  => null,
            'adresse_livraison'           => $this->faker->address(),
            'date_livraison_prevue'       => (clone $dateCommande)->modify('+' . $this->faker->numberBetween(1, 10) . ' days'),
            'notes_supplementaires'       => $this->faker->optional(0.3)->sentence(),
            'date_validation'             => $statut === 'validee' ? (clone $dateCommande)->modify('+1 day') : null,
            'date_annulation'             => $statut === 'annulee' ? (clone $dateCommande)->modify('+1 day') : null,
            'raison_annulation'           => $statut === 'annulee' ? $this->faker->sentence() : null,
            'actif'                       => true,
        ];
    }
}
