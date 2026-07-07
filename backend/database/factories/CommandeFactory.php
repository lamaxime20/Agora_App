<?php

namespace Database\Factories;

use App\Models\Commande;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommandeFactory extends Factory
{
    protected $model = Commande::class;

    /**
     * Quartiers de livraison réalistes (Douala et Yaoundé).
     */
    private const ADRESSES_LIVRAISON = [
        'Quartier Akwa, Douala',
        'Quartier Bonanjo, Douala',
        'Quartier Bonapriso, Douala',
        'Quartier Makepe, Douala',
        'Quartier Logpom, Douala',
        'Quartier Bépanda, Douala',
        'Quartier Ndogbong, Douala',
        'Quartier Bastos, Yaoundé',
        'Quartier Melen, Yaoundé',
        'Quartier Odza, Yaoundé',
    ];

    private const NOTES_SUPPLEMENTAIRES = [
        'Livrer avant 17h de préférence.',
        "Prévenir le client par téléphone à l'arrivée.",
        'Le client souhaite une facture détaillée.',
        "Accès à l'entrepôt par l'arrière du bâtiment.",
        'Commande urgente à traiter en priorité.',
    ];

    private const RAISONS_ANNULATION = [
        'Client injoignable après plusieurs tentatives.',
        'Produit indisponible en stock au moment de la validation.',
        'Commande annulée à la demande du client.',
        'Erreur de saisie lors de la création de la commande.',
        'Délai de livraison jugé trop long par le client.',
    ];

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
            'adresse_livraison'           => $this->faker->randomElement(self::ADRESSES_LIVRAISON),
            'date_livraison_prevue'       => (clone $dateCommande)->modify('+' . $this->faker->numberBetween(1, 10) . ' days'),
            'notes_supplementaires'       => $this->faker->optional(0.3)->randomElement(self::NOTES_SUPPLEMENTAIRES),
            'date_validation'             => $statut === 'validee' ? (clone $dateCommande)->modify('+1 day') : null,
            'date_annulation'             => $statut === 'annulee' ? (clone $dateCommande)->modify('+1 day') : null,
            'raison_annulation'           => $statut === 'annulee' ? $this->faker->randomElement(self::RAISONS_ANNULATION) : null,
            'actif'                       => true,
        ];
    }
}
