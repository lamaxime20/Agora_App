<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use App\Models\RoleUtilisateur;
use Database\Factories\AppartenirEntrepriseFactory;
use Illuminate\Database\Seeder;

class AppartenirEntrepriseSeeder extends Seeder
{
    /**
     * @param array<int, array{user: \App\Models\Utilisateur, role_slug: string}> $utilisateurs
     */
    public function run(array $utilisateurs, Entreprise $entreprise): void
    {
        $rolesById = RoleUtilisateur::pluck('id', 'role');

        foreach ($utilisateurs as $entry) {
            AppartenirEntrepriseFactory::new()->create([
                'utilisateur_id'       => $entry['user']->id,
                'entreprise_id'        => $entreprise->id,
                'role_utilisateur_id'  => $rolesById[$entry['role_slug']],
                'statut'               => 'actif',
            ]);
        }
    }
}
