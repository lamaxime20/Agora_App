<?php

namespace Database\Factories;

use App\Models\Livraison;
use Illuminate\Database\Eloquent\Factories\Factory;

class LivraisonFactory extends Factory
{
    protected $model = Livraison::class;

    public function definition(): array
    {
        $dateCreation = $this->faker->dateTimeBetween('-5 months', 'now');
        $statut       = $this->faker->randomElement(['en_cours', 'livree', 'livree', 'echec', 'retour']);

        return [
            'date_creation'             => $dateCreation,
            'date_livraison_effective'  => in_array($statut, ['livree', 'retour']) ? (clone $dateCreation)->modify('+2 days') : null,
            'statut'                    => $statut,
            'motif_echec'               => $statut === 'echec' ? $this->faker->randomElement(['Client injoignable', 'Adresse introuvable', 'Colis refusé']) : null,
            'motif_retour'              => $statut === 'retour' ? $this->faker->randomElement(['Produit non conforme', 'Client absent']) : null,
            'date_lancement'            => (clone $dateCreation)->modify('+1 hour'),
            'date_annulation'           => null,
            'raison_annulation'         => null,
            'actif'                     => true,
        ];
    }
}
