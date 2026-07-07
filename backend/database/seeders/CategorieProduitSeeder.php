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
        $categories = [
            'Matériel informatique'  => "Ordinateurs, écrans et périphériques vendus ou installés chez les clients.",
            'Logiciels'              => "Licences et solutions logicielles proposées aux entreprises clientes.",
            'Réseau & Connectivité'  => "Routeurs, switchs, câblage et équipements réseau pour les installations clients.",
            'Accessoires bureautique'=> "Imprimantes et accessoires complémentaires aux postes de travail.",
            'Consommables impression'=> "Cartouches, toners et papeterie utilisés pour l'impression courante.",
            'Services cloud'         => "Hébergement, noms de domaine et sauvegardes proposés en ligne aux clients.",
            'Sécurité informatique'  => "Vidéosurveillance, antivirus et prestations de sécurisation des systèmes.",
            'Mobilier de bureau'     => "Bureaux, chaises et rangements destinés aux espaces de travail.",
            'Téléphonie'             => "Téléphones fixes IP et mobiles utilisés par les équipes et les clients.",
            'Maintenance & Support'  => "Prestations de maintenance, de formation et de support technique.",
        ];

        return collect($categories)->map(function (string $description, string $nom) use ($entreprise, $stockStaff) {
            return CategorieProduitFactory::new()->create([
                'categorie'   => $nom,
                'description' => $description,
                'entreprise'  => $entreprise->id,
                'utilisateur' => $stockStaff->random()->id,
            ]);
        })->values();
    }
}
