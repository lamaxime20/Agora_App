<?php

namespace Database\Factories;

use App\Models\Invitation;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvitationFactory extends Factory
{
    protected $model = Invitation::class;

    public function definition(): array
    {
        $dateInvitation = $this->faker->dateTimeBetween('-3 months', 'now');

        return [
            'email_invite'    => $this->faker->unique()->safeEmail(),
            'date_invitation' => $dateInvitation,
            'statut'          => $this->faker->randomElement(['en_attente', 'acceptee', 'refusee', 'expiree', 'annulee']),
            'date_expiration' => (clone $dateInvitation)->modify('+7 days'),
            'actif'           => true,
        ];
    }
}
