<?php

namespace Database\Seeders;

use Database\Factories\UtilisateurFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * ~21 utilisateurs couvrant les 11 rôles imposés (1 directeur, 5 managers,
 * 10 employés) + comptes de test supplémentaires.
 */
class UtilisateurSeeder extends Seeder
{
    /**
     * @return array<int, array{user: \App\Models\Utilisateur, role_slug: string, credentials: array{nom: string, email: string, password: string}}>
     */
    public function run(): array
    {
        $roster = [
            ['role' => 'directeur',              'prenom' => 'Jonathan',    'nom' => 'Mwamba'],
            ['role' => 'manager_gestion_stock',   'prenom' => 'Alice',      'nom' => 'Kalombo'],
            ['role' => 'employe_gestion_stock',   'prenom' => 'Blaise',     'nom' => 'Mukendi'],
            ['role' => 'employe_gestion_stock',   'prenom' => 'Christelle','nom' => 'Ilunga'],
            ['role' => 'manager_vente',           'prenom' => 'David',      'nom' => 'Tshibangu'],
            ['role' => 'employe_vente',           'prenom' => 'Emmanuella','nom' => 'Kasongo'],
            ['role' => 'employe_vente',           'prenom' => 'Fabrice',   'nom' => 'Mbayo'],
            ['role' => 'manager_finances',        'prenom' => 'Grace',      'nom' => 'Kabeya'],
            ['role' => 'employe_finances',        'prenom' => 'Herve',     'nom' => 'Ngoyi'],
            ['role' => 'employe_finances',        'prenom' => 'Irene',     'nom' => 'Mutombo'],
            ['role' => 'manager_rh',              'prenom' => 'Joel',       'nom' => 'Kanyinda'],
            ['role' => 'employe_rh',              'prenom' => 'Karen',      'nom' => 'Lubaki'],
            ['role' => 'employe_rh',              'prenom' => 'Landry',     'nom' => 'Mabika'],
            ['role' => 'manager_livraison',       'prenom' => 'Marceline', 'nom' => 'Nkulu'],
            ['role' => 'employe_livraison',       'prenom' => 'Nathan',     'nom' => 'Kalala'],
            ['role' => 'employe_livraison',       'prenom' => 'Olivia',     'nom' => 'Banza'],
            // Comptes de test supplémentaires (répartis sur divers rôles)
            ['role' => 'employe_vente',           'prenom' => 'Patrick',    'nom' => 'Ilunga'],
            ['role' => 'employe_gestion_stock',   'prenom' => 'Queen',      'nom' => 'Mbuyi'],
            ['role' => 'employe_finances',        'prenom' => 'Robert',     'nom' => 'Kabongo'],
            ['role' => 'manager_vente',           'prenom' => 'Sarah',      'nom' => 'Tshilombo'],
            ['role' => 'employe_livraison',       'prenom' => 'Thierry',    'nom' => 'Kasongo'],
        ];

        $created = [];

        foreach ($roster as $entry) {
            $plainPassword = Str::password(14);
            $email = Str::slug($entry['prenom']) . '.' . Str::slug($entry['nom']) . '@bytes-corp.com';

            $user = UtilisateurFactory::new()->create([
                'email'         => $email,
                'name'          => $entry['nom'],
                'prename'       => $entry['prenom'],
                'password_hash' => Hash::make($plainPassword),
                'statut'        => 'actif',
            ]);

            $created[] = [
                'user'      => $user,
                'role_slug' => $entry['role'],
                'credentials' => [
                    'nom'      => $entry['prenom'] . ' ' . $entry['nom'],
                    'email'    => $email,
                    'password' => $plainPassword,
                ],
            ];
        }

        return $created;
    }
}
