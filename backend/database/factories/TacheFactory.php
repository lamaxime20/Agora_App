<?php

namespace Database\Factories;

use App\Models\Tache;
use Illuminate\Database\Eloquent\Factories\Factory;

class TacheFactory extends Factory
{
    protected $model = Tache::class;

    private const TACHES = [
        'Préparer le rapport mensuel' => "Compiler les indicateurs clés du mois et rédiger le rapport pour la direction.",
        'Réapprovisionner le rayon principal' => "Vérifier les niveaux de stock du rayon principal et lancer les demandes de réapprovisionnement nécessaires.",
        'Contacter les clients en retard de paiement' => "Relancer par téléphone ou par email les clients ayant des paiements en attente.",
        "Mettre à jour l'inventaire" => "Effectuer un contrôle physique du stock et corriger les écarts constatés dans le système.",
        'Former le nouvel employé' => "Accompagner le nouvel employé dans la prise en main des outils et des procédures de l'entreprise.",
        'Organiser la tournée de livraison' => "Planifier l'itinéraire et l'ordre des livraisons du jour pour les livreurs.",
        'Auditer les dépenses du mois' => "Vérifier la cohérence des dépenses enregistrées avec les justificatifs disponibles.",
        'Relancer les factures impayées' => "Identifier les factures impayées et engager les relances auprès des clients concernés.",
    ];

    private const RAISONS_ANNULATION = [
        'Tâche annulée : priorité changée par la direction.',
        "Tâche devenue inutile suite à un changement de contexte.",
        "Doublon avec une autre tâche déjà en cours.",
    ];

    private const RAISONS_REPORT = [
        "Reportée en raison d'une indisponibilité du client.",
        "Reportée faute de ressources disponibles cette semaine.",
        'Reportée à la demande du responsable du service.',
    ];

    public function definition(): array
    {
        $dateDemande = $this->faker->dateTimeBetween('-4 months', 'now');
        $statut      = $this->faker->randomElement(['en_attente', 'en_cours', 'terminee', 'annulee', 'reportee']);
        $nom         = $this->faker->randomElement(array_keys(self::TACHES));

        return [
            'nom'                    => $nom,
            'description'            => self::TACHES[$nom],
            'date_demande'           => $dateDemande,
            'date_limite'            => (clone $dateDemande)->modify('+' . $this->faker->numberBetween(3, 21) . ' days'),
            'statut'                 => $statut,
            'pourcentage_avancement' => $statut === 'terminee' ? 100 : ($statut === 'en_cours' ? $this->faker->numberBetween(10, 90) : 0),
            'raison_annulation'      => $statut === 'annulee' ? $this->faker->randomElement(self::RAISONS_ANNULATION) : null,
            'raison_report'          => $statut === 'reportee' ? $this->faker->randomElement(self::RAISONS_REPORT) : null,
            'date_fin'               => $statut === 'terminee' ? (clone $dateDemande)->modify('+' . $this->faker->numberBetween(1, 20) . ' days') : null,
            'actif'                  => true,
        ];
    }
}
