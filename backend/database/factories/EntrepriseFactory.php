<?php

namespace Database\Factories;

use App\Models\Entreprise;
use Illuminate\Database\Eloquent\Factories\Factory;

class EntrepriseFactory extends Factory
{
    protected $model = Entreprise::class;

    public function definition(): array
    {
        return [
            'nom'                  => $this->faker->company(),
            'logo'                 => null,
            'code_couleur'         => $this->faker->hexColor(),
            'email'                => $this->faker->companyEmail(),
            'telephone'            => $this->faker->phoneNumber(),
            'site_web'             => 'https://' . $this->faker->domainName(),
            'pays'                 => 'République Démocratique du Congo',
            'ville'                => $this->faker->city(),
            'adresse'              => $this->faker->streetAddress(),
            'secteur_activite'     => $this->faker->randomElement([
                'Services Informatiques', 'Commerce général', 'Distribution', 'Agroalimentaire',
            ]),
            'description'          => $this->faker->catchPhrase(),
            'politique_entreprise' => "Notre politique d'entreprise repose sur la transparence, la responsabilité et le respect des équipes.",
            'argent_virtuel'       => 0,
            'statut'               => 'actif',
        ];
    }
}
