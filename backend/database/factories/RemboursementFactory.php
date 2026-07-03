<?php

namespace Database\Factories;

use App\Models\Remboursement;
use Illuminate\Database\Eloquent\Factories\Factory;

class RemboursementFactory extends Factory
{
    protected $model = Remboursement::class;

    public function definition(): array
    {
        return [
            'cause'              => $this->faker->randomElement([
                'Produit défectueux', 'Erreur de commande', 'Retard de livraison excessif',
                'Client insatisfait', 'Produit non conforme',
            ]),
            'montant'            => $this->faker->randomFloat(2, 1000, 150000),
            'date_remboursement' => $this->faker->dateTimeBetween('-5 months', 'now'),
            'actif'              => true,
        ];
    }
}
