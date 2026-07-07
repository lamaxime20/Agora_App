<?php

namespace Database\Factories;

use App\Models\Produit;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProduitFactory extends Factory
{
    protected $model = Produit::class;

    public function definition(): array
    {
        $dateCreation = $this->faker->dateTimeBetween('-1 year', '-1 month');

        return [
            'nom'               => 'Article informatique divers',
            'date_creation'     => $dateCreation,
            'date_modification' => $this->faker->optional(0.4)->dateTimeBetween($dateCreation, 'now'),
            'image'             => null,
            'prix_unitaire'     => $this->faker->randomFloat(2, 500, 250000),
            'seuil_alerte'      => $this->faker->randomFloat(2, 5, 20),
            'type_produit'      => 'physique',
            'stock_actuel'      => $this->faker->randomFloat(2, 0, 50),
            'unite_mesure'      => 'pièce',
            'description'       => "Article proposé par Bytes-Corp dans le cadre de son activité de services informatiques.",
            'statut'            => 'actif',
        ];
    }
}
