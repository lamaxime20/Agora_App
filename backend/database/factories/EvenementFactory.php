<?php

namespace Database\Factories;

use App\Models\Evenement;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvenementFactory extends Factory
{
    protected $model = Evenement::class;

    public function definition(): array
    {
        $dateEvenement = $this->faker->dateTimeBetween('-2 months', '+3 months');
        $statut = $dateEvenement < now()
            ? $this->faker->randomElement(['termine', 'annule'])
            : $this->faker->randomElement(['planifie', 'en_cours']);

        return [
            'nom'            => $this->faker->randomElement([
                'Réunion mensuelle de direction', 'Formation sécurité au travail',
                'Séminaire commercial', 'Bilan trimestriel des ventes',
                'Journée d\'intégration des nouveaux employés', 'Point RH mensuel',
            ]),
            'description'    => $this->faker->sentence(),
            'date_evenement' => $dateEvenement,
            'lieu'           => $this->faker->randomElement(['Salle de conférence Bytes-Corp', 'Siège social', 'En ligne (visioconférence)']),
            'statut'         => $statut,
            'actif'          => true,
        ];
    }
}
