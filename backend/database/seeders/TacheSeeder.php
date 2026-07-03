<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use App\Models\RoleUtilisateur;
use Database\Factories\TacheFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class TacheSeeder extends Seeder
{
    /**
     * @param array<int, array{user: \App\Models\Utilisateur, role_slug: string}> $utilisateurRoster
     */
    public function run(Entreprise $entreprise, array $utilisateurRoster, Collection $definisseurs): Collection
    {
        $roleIdsBySlug = RoleUtilisateur::pluck('id', 'role');

        return collect(range(1, 25))->map(function () use ($entreprise, $utilisateurRoster, $roleIdsBySlug, $definisseurs) {
            $assigneEntry = $utilisateurRoster[array_rand($utilisateurRoster)];

            return TacheFactory::new()->create([
                'entreprise'          => $entreprise->id,
                'utilisateur_defini'  => $definisseurs->random()->id,
                'utilisateur_assigne' => $assigneEntry['user']->id,
                'role_associe'        => $roleIdsBySlug[$assigneEntry['role_slug']],
            ]);
        });
    }
}
