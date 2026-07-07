<?php

namespace Database\Factories;

use App\Models\FraisMensuel;
use Illuminate\Database\Eloquent\Factories\Factory;

class FraisMensuelFactory extends Factory
{
    protected $model = FraisMensuel::class;

    /**
     * Abonnement => fournisseur réel cohérent avec le service payé.
     */
    private const ABONNEMENTS = [
        'Hébergement cloud'                  => 'OVHcloud',
        'Abonnement logiciel comptable'      => 'Sage Africa',
        'Licence antivirus'                  => 'ESET Afrique',
        'Abonnement internet professionnel'  => 'Orange Cameroun',
        'Abonnement téléphonie'              => 'MTN Cameroun',
        'Maintenance serveur'                => 'Global Technologies Cameroun',
        'Abonnement Microsoft 365'           => 'Microsoft Corporation',
        'Abonnement Google Workspace'        => 'Google LLC',
    ];

    public function definition(): array
    {
        $service = $this->faker->randomElement(array_keys(self::ABONNEMENTS));

        return [
            'service_paye'     => $service,
            'fournisseur'      => self::ABONNEMENTS[$service],
            'montant_mensuel'  => $this->faker->randomFloat(2, 5000, 150000),
            'depense_active'   => true,
            'date_abonnement'  => $this->faker->dateTimeBetween('-1 year', '-1 month'),
            'actif'            => true,
        ];
    }
}
