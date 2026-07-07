<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\ClientFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ClientSeeder extends Seeder
{
    public function run(Entreprise $entreprise): Collection
    {
        $clients = [
            ['prenom' => 'Jean',      'nom' => 'Mballa'],
            ['prenom' => 'Marie',     'nom' => 'Ngo Bell'],
            ['prenom' => 'Paul',      'nom' => 'Eyenga'],
            ['prenom' => 'Sandrine',  'nom' => 'Ateba'],
            ['prenom' => 'Emmanuel',  'nom' => 'Fouda'],
            ['prenom' => 'Christelle','nom' => 'Onana'],
            ['prenom' => 'Serge',     'nom' => 'Essomba'],
            ['prenom' => 'Larissa',   'nom' => 'Amougou'],
            ['prenom' => 'Bruno',     'nom' => 'Nkomo'],
            ['prenom' => 'Carine',    'nom' => 'Ekani'],
            ['prenom' => 'Cédric',    'nom' => 'Kamga'],
            ['prenom' => 'Aurélie',   'nom' => 'Fotso'],
            ['prenom' => 'Yannick',   'nom' => 'Talla'],
            ['prenom' => 'Estelle',   'nom' => 'Wandji'],
            ['prenom' => 'Arnaud',    'nom' => 'Ngassa'],
            ['prenom' => 'Nadège',    'nom' => 'Tchinda'],
            ['prenom' => 'Éric',      'nom' => 'Mbarga'],
            ['prenom' => 'Pauline',   'nom' => 'Owona'],
            ['prenom' => 'Christian', 'nom' => 'Mvondo'],
            ['prenom' => 'Vanessa',   'nom' => 'Abanda'],
            ['prenom' => 'Rodrigue',  'nom' => 'Bikoi'],
            ['prenom' => 'Solange',   'nom' => 'Ngo Nyeck'],
            ['prenom' => 'Franck',    'nom' => 'Njoya'],
            ['prenom' => 'Divine',    'nom' => 'Ashu'],
        ];

        return collect($clients)->map(function (array $c) use ($entreprise) {
            $emailDomaine = collect(['gmail.com', 'yahoo.fr', 'outlook.com'])->random();
            $email = Str::slug($c['prenom']) . '.' . Str::slug($c['nom']) . '@' . $emailDomaine;

            return ClientFactory::new()->create([
                'nom'        => $c['nom'],
                'prenom'     => $c['prenom'],
                'email'      => $email,
                'entreprise' => $entreprise->id,
            ]);
        });
    }
}
