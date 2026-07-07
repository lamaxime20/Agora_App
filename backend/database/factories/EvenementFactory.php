<?php

namespace Database\Factories;

use App\Models\Evenement;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvenementFactory extends Factory
{
    protected $model = Evenement::class;

    private const EVENEMENTS = [
        'Réunion mensuelle de direction' => "Point mensuel avec la direction sur les objectifs et les résultats de l'entreprise.",
        'Formation sécurité au travail' => "Session de sensibilisation du personnel aux règles de sécurité au travail.",
        'Séminaire commercial' => "Rencontre de l'équipe commerciale pour ajuster la stratégie de vente du trimestre.",
        'Bilan trimestriel des ventes' => "Présentation des résultats commerciaux du trimestre à l'ensemble des équipes.",
        "Journée d'intégration des nouveaux employés" => "Accueil et présentation de l'entreprise aux employés récemment recrutés.",
        'Point RH mensuel' => "Suivi mensuel des sujets liés au personnel avec les responsables RH.",
    ];

    public function definition(): array
    {
        $dateEvenement = $this->faker->dateTimeBetween('-2 months', '+3 months');
        $statut = $dateEvenement < now()
            ? $this->faker->randomElement(['termine', 'annule'])
            : $this->faker->randomElement(['planifie', 'en_cours']);

        $nom = $this->faker->randomElement(array_keys(self::EVENEMENTS));

        return [
            'nom'            => $nom,
            'description'    => self::EVENEMENTS[$nom],
            'date_evenement' => $dateEvenement,
            'lieu'           => $this->faker->randomElement(['Salle de conférence Bytes-Corp', 'Siège social', 'En ligne (visioconférence)']),
            'statut'         => $statut,
            'actif'          => true,
        ];
    }
}
