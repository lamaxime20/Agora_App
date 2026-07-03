<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use App\Models\RoleUtilisateur;
use Database\Factories\SessionAppFactory;
use Illuminate\Database\Seeder;

class SessionAppSeeder extends Seeder
{
    /**
     * @param array<int, array{user: \App\Models\Utilisateur, role_slug: string}> $utilisateurRoster
     */
    public function run(Entreprise $entreprise, array $utilisateurRoster): void
    {
        $roleIdsBySlug = RoleUtilisateur::pluck('id', 'role');

        collect(range(1, 15))->each(function () use ($entreprise, $utilisateurRoster, $roleIdsBySlug) {
            $entry = $utilisateurRoster[array_rand($utilisateurRoster)];

            SessionAppFactory::new()->create([
                'role'        => $roleIdsBySlug[$entry['role_slug']],
                'entreprise'  => $entreprise->id,
                'utilisateur' => $entry['user']->id,
            ]);
        });
    }
}
