<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use App\Models\RoleUtilisateur;
use Database\Factories\InvitationFactory;
use Illuminate\Database\Seeder;

class InvitationSeeder extends Seeder
{
    public function run(Entreprise $entreprise): void
    {
        $roleIds = RoleUtilisateur::pluck('id');

        collect(range(1, 15))->each(fn () => InvitationFactory::new()->create([
            'role'       => $roleIds->random(),
            'entreprise' => $entreprise->id,
        ]));
    }
}
