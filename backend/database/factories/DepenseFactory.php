<?php

namespace Database\Factories;

use App\Models\Depense;
use Illuminate\Database\Eloquent\Factories\Factory;

class DepenseFactory extends Factory
{
    protected $model = Depense::class;

    public function definition(): array
    {
        return [
            'montant'     => $this->faker->randomFloat(2, 2000, 200000),
            'date_depense'=> $this->faker->dateTimeBetween('-6 months', 'now'),
            'raison'      => $this->faker->randomElement([
                'Achat de fournitures de bureau', 'Frais de maintenance informatique',
                "Facture d'électricité", 'Frais de transport', 'Achat de matériel réseau',
                'Frais de communication', 'Entretien des locaux',
                'Achat équipements réseau', 'Paiement fournisseur informatique',
                "Facture d'accès Internet professionnel",
            ]),
            'actif'       => true,
        ];
    }
}
