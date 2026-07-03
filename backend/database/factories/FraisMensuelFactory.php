<?php

namespace Database\Factories;

use App\Models\FraisMensuel;
use Illuminate\Database\Eloquent\Factories\Factory;

class FraisMensuelFactory extends Factory
{
    protected $model = FraisMensuel::class;

    public function definition(): array
    {
        return [
            'service_paye'     => $this->faker->randomElement([
                'Hébergement cloud', 'Abonnement logiciel comptable', 'Licence antivirus',
                'Abonnement internet professionnel', 'Abonnement téléphonie', 'Maintenance serveur',
            ]),
            'fournisseur'      => $this->faker->company(),
            'montant_mensuel'  => $this->faker->randomFloat(2, 5000, 150000),
            'depense_active'   => true,
            'date_abonnement'  => $this->faker->dateTimeBetween('-1 year', '-1 month'),
            'actif'            => true,
        ];
    }
}
