<?php

namespace Database\Factories;

use App\Models\EntreeArgent;
use Illuminate\Database\Eloquent\Factories\Factory;

class EntreeArgentFactory extends Factory
{
    protected $model = EntreeArgent::class;

    public function definition(): array
    {
        return [
            'montant'    => $this->faker->randomFloat(2, 5000, 400000),
            'raison'     => $this->faker->randomElement([
                'Apport en capital', 'Vente de matériel usagé', 'Subvention reçue',
                'Remboursement fournisseur', 'Recette exceptionnelle',
                "Prestation de conseil facturée hors commande", 'Vente de matériel informatique réformé',
            ]),
            'date_entree'=> $this->faker->dateTimeBetween('-6 months', 'now'),
            'actif'      => true,
        ];
    }
}
