<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use App\Models\Utilisateur;
use Database\Factories\EntrepriseFactory;
use Illuminate\Database\Seeder;

/**
 * Entreprise unique du jeu de test : Bytes-Corp.
 */
class EntrepriseSeeder extends Seeder
{
    public function run(Utilisateur $directeur): Entreprise
    {
        return EntrepriseFactory::new()->create([
            'nom'                  => 'Bytes-Corp',
            'logo'                 => null,
            'code_couleur'         => '#1D4ED8',
            'email'                => 'contact@bytes-corp.com',
            'telephone'            => '+243 81 234 5678',
            'site_web'             => 'https://bytes-corp.com',
            'pays'                 => 'République Démocratique du Congo',
            'ville'                => 'Kinshasa',
            'adresse'              => '12 Avenue de la Paix, Gombe',
            'secteur_activite'     => 'Services Informatiques',
            'description'          => 'Bytes-Corp est une entreprise de services informatiques spécialisée dans le conseil, le développement logiciel et l\'infogérance pour les PME.',
            'politique_entreprise' => 'Notre politique d\'entreprise repose sur la transparence, la responsabilité et le respect des équipes.',
            'argent_virtuel'       => 0,
            'statut'               => 'actif',
            'directeur'            => $directeur->id,
        ]);
    }
}
