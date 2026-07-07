<?php

namespace Database\Factories;

use App\Models\MouvementFinancier;
use Illuminate\Database\Eloquent\Factories\Factory;

class MouvementFinancierFactory extends Factory
{
    protected $model = MouvementFinancier::class;

    public function definition(): array
    {
        return [
            'date_operation' => $this->faker->dateTimeBetween('-6 months', 'now'),
            'type_operation' => 'depense_generale',
            'montant'        => $this->faker->randomFloat(2, 1000, 300000),
            'sens'           => 'sortie',
            'reference_id'   => null,
            'description'    => 'Mouvement financier enregistré dans le journal de l\'entreprise.',
        ];
    }
}
