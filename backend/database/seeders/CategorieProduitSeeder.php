<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\CategorieProduitFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class CategorieProduitSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $stockStaff): Collection
    {
        $noms = [
            'Matériel informatique', 'Logiciels', 'Réseau & Connectivité', 'Accessoires bureautique',
            'Consommables impression', 'Services cloud', 'Sécurité informatique', 'Mobilier de bureau',
            'Téléphonie', 'Maintenance & Support',
        ];

        return collect($noms)->map(fn (string $nom) => CategorieProduitFactory::new()->create([
            'categorie'   => $nom,
            'entreprise'  => $entreprise->id,
            'utilisateur' => $stockStaff->random()->id,
        ]));
    }
}
