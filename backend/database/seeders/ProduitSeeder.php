<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\ProduitFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Catalogue de produits et services cohérent avec l'activité de Bytes-Corp
 * (société de services informatiques) : chaque article est rattaché à la
 * catégorie qui correspond réellement à sa nature.
 */
class ProduitSeeder extends Seeder
{
    public function run(Entreprise $entreprise, Collection $stockStaff, Collection $categories): Collection
    {
        $catalogue = [
            'Matériel informatique' => [
                ['nom' => 'Ordinateur Portable HP ProBook 450', 'description' => "Ordinateur portable professionnel avec processeur Intel Core i5, idéal pour la bureautique et le développement.", 'prix' => 465000, 'unite' => 'pièce', 'stock' => 18, 'seuil' => 5],
                ['nom' => 'Ordinateur de Bureau Dell OptiPlex', 'description' => "Unité centrale fiable pour un usage bureautique intensif au sein des entreprises clientes.", 'prix' => 385000, 'unite' => 'pièce', 'stock' => 12, 'seuil' => 3],
                ['nom' => 'Écran Samsung 24 pouces', 'description' => "Moniteur Full HD 24 pouces recommandé pour les postes de travail.", 'prix' => 89000, 'unite' => 'pièce', 'stock' => 22, 'seuil' => 5],
                ['nom' => 'Disque SSD Samsung 500 Go', 'description' => "Disque à état solide rapide pour améliorer les performances des ordinateurs.", 'prix' => 42000, 'unite' => 'pièce', 'stock' => 30, 'seuil' => 8],
                ['nom' => 'Disque Dur Externe Seagate 1 To', 'description' => "Disque dur externe utilisé pour la sauvegarde des données des clients.", 'prix' => 38000, 'unite' => 'pièce', 'stock' => 20, 'seuil' => 5],
                ['nom' => 'Clavier Mécanique Logitech', 'description' => "Clavier mécanique rétroéclairé recommandé pour les postes de développement.", 'prix' => 27000, 'unite' => 'pièce', 'stock' => 40, 'seuil' => 8],
                ['nom' => 'Souris Logitech Sans Fil', 'description' => "Souris optique sans fil, confortable pour un usage prolongé.", 'prix' => 9000, 'unite' => 'pièce', 'stock' => 45, 'seuil' => 10],
                ['nom' => 'Webcam Logitech HD', 'description' => "Webcam Full HD utilisée pour les visioconférences et le télétravail.", 'prix' => 19500, 'unite' => 'pièce', 'stock' => 16, 'seuil' => 4],
            ],
            'Logiciels' => [
                ['nom' => 'Suite Bureautique Microsoft Office 2021', 'description' => "Licence perpétuelle de la suite bureautique Microsoft Office pour un poste.", 'prix' => 85000, 'unite' => 'licence', 'stock' => 20, 'seuil' => 5],
                ['nom' => 'Licence Windows 11 Pro', 'description' => "Licence d'activation du système d'exploitation Windows 11 Pro.", 'prix' => 95000, 'unite' => 'licence', 'stock' => 15, 'seuil' => 3],
                ['nom' => 'Logiciel de Comptabilité Sage 100', 'description' => "Logiciel de gestion comptable destiné aux PME clientes de Bytes-Corp.", 'prix' => 320000, 'unite' => 'licence', 'stock' => 8, 'seuil' => 2],
                ['nom' => 'Logiciel de Gestion Commerciale', 'description' => "Solution de gestion des ventes et des stocks pour les commerces clients.", 'prix' => 250000, 'unite' => 'licence', 'stock' => 10, 'seuil' => 2],
            ],
            'Réseau & Connectivité' => [
                ['nom' => 'Routeur MikroTik hAP ac2', 'description' => "Routeur Wi-Fi professionnel utilisé lors des installations réseau chez les clients.", 'prix' => 68000, 'unite' => 'pièce', 'stock' => 25, 'seuil' => 5],
                ['nom' => 'Switch Cisco 24 ports', 'description' => "Commutateur réseau 24 ports pour les infrastructures d'entreprise.", 'prix' => 215000, 'unite' => 'pièce', 'stock' => 15, 'seuil' => 3],
                ['nom' => 'Câble Réseau RJ45 (rouleau 100m)', 'description' => "Câble réseau catégorie 6 utilisé pour le câblage des bureaux clients.", 'prix' => 29500, 'unite' => 'rouleau', 'stock' => 60, 'seuil' => 10],
                ['nom' => "Point d'Accès Wi-Fi Ubiquiti", 'description' => "Borne Wi-Fi professionnelle permettant de couvrir de grands espaces de bureaux.", 'prix' => 57500, 'unite' => 'pièce', 'stock' => 14, 'seuil' => 3],
                ['nom' => 'Onduleur APC 1000VA', 'description' => "Onduleur protégeant les équipements informatiques contre les coupures de courant.", 'prix' => 76500, 'unite' => 'pièce', 'stock' => 10, 'seuil' => 3],
            ],
            'Sécurité informatique' => [
                ['nom' => 'Caméra IP Hikvision', 'description' => "Caméra de vidéosurveillance IP haute définition installée chez les clients.", 'prix' => 46000, 'unite' => 'pièce', 'stock' => 20, 'seuil' => 5],
                ['nom' => 'Licence Antivirus ESET Endpoint (1 an)', 'description' => "Licence annuelle de protection antivirus pour poste de travail.", 'prix' => 18500, 'unite' => 'licence', 'stock' => 35, 'seuil' => 8],
            ],
            'Accessoires bureautique' => [
                ['nom' => 'Imprimante Epson EcoTank L3250', 'description' => "Imprimante multifonction à réservoirs d'encre rechargeables.", 'prix' => 168000, 'unite' => 'pièce', 'stock' => 9, 'seuil' => 2],
                ['nom' => 'Chargeur Universel pour Ordinateur Portable', 'description' => "Chargeur compatible avec la plupart des ordinateurs portables du marché.", 'prix' => 15500, 'unite' => 'pièce', 'stock' => 28, 'seuil' => 6],
                ['nom' => 'Sac à Dos pour Ordinateur Portable', 'description' => "Sac de protection rembourré pour le transport des ordinateurs portables.", 'prix' => 21000, 'unite' => 'pièce', 'stock' => 24, 'seuil' => 5],
            ],
            'Consommables impression' => [
                ["nom" => "Cartouche d'Encre Epson Noir", 'description' => "Cartouche d'encre noire compatible avec les imprimantes Epson EcoTank.", 'prix' => 12500, 'unite' => 'pièce', 'stock' => 32, 'seuil' => 8],
                ["nom" => "Cartouche d'Encre Epson Couleur", 'description' => "Cartouche d'encre couleur compatible avec les imprimantes Epson EcoTank.", 'prix' => 15500, 'unite' => 'pièce', 'stock' => 26, 'seuil' => 6],
                ['nom' => 'Ramette de Papier A4 (500 feuilles)', 'description' => "Ramette de papier blanc A4 80g pour l'impression courante.", 'prix' => 4200, 'unite' => 'ramette', 'stock' => 80, 'seuil' => 15],
                ['nom' => 'Toner HP LaserJet', 'description' => "Toner d'impression laser pour imprimantes HP professionnelles.", 'prix' => 36500, 'unite' => 'pièce', 'stock' => 18, 'seuil' => 4],
            ],
            'Mobilier de bureau' => [
                ['nom' => 'Bureau Informatique', 'description' => "Bureau ergonomique conçu pour accueillir un poste informatique complet.", 'prix' => 97000, 'unite' => 'pièce', 'stock' => 8, 'seuil' => 2],
                ['nom' => 'Chaise de Bureau Ergonomique', 'description' => "Chaise de bureau réglable avec support lombaire.", 'prix' => 62000, 'unite' => 'pièce', 'stock' => 12, 'seuil' => 3],
                ['nom' => 'Armoire de Rangement Métallique', 'description' => "Armoire de rangement sécurisée pour les documents et le petit matériel.", 'prix' => 122000, 'unite' => 'pièce', 'stock' => 6, 'seuil' => 2],
            ],
            'Téléphonie' => [
                ['nom' => 'Téléphone IP Cisco', 'description' => "Téléphone de bureau IP utilisé pour les lignes professionnelles.", 'prix' => 56000, 'unite' => 'pièce', 'stock' => 14, 'seuil' => 3],
                ['nom' => 'Smartphone Samsung Galaxy A15', 'description' => "Smartphone Android utilisé par les équipes commerciales et de livraison.", 'prix' => 132000, 'unite' => 'pièce', 'stock' => 10, 'seuil' => 2],
            ],
            'Services cloud' => [
                ['nom' => 'Hébergement Web Pack Standard', 'description' => "Formule d'hébergement web mutualisé pour sites vitrines et boutiques en ligne.", 'prix' => 65000, 'unite' => null, 'service' => true],
                ['nom' => 'Nom de Domaine .cm (1 an)', 'description' => "Réservation et renouvellement annuel d'un nom de domaine en .cm.", 'prix' => 15000, 'unite' => null, 'service' => true],
                ['nom' => 'Sauvegarde Cloud Entreprise', 'description' => "Service de sauvegarde automatique des données de l'entreprise sur le cloud.", 'prix' => 45000, 'unite' => null, 'service' => true],
                ['nom' => 'Migration vers le Cloud', 'description' => "Accompagnement complet pour la migration de l'infrastructure d'un client vers le cloud.", 'prix' => 275000, 'unite' => null, 'service' => true],
            ],
            'Maintenance & Support' => [
                ['nom' => 'Maintenance Informatique Mensuelle', 'description' => "Contrat de maintenance préventive et corrective du parc informatique du client.", 'prix' => 85000, 'unite' => null, 'service' => true],
                ['nom' => 'Support Technique à Distance', 'description' => "Assistance technique à distance pour la résolution des incidents informatiques.", 'prix' => 32000, 'unite' => null, 'service' => true],
                ['nom' => 'Formation Réseau Cisco', 'description' => "Session de formation certifiante sur l'administration des réseaux Cisco.", 'prix' => 210000, 'unite' => null, 'service' => true],
                ['nom' => 'Formation Laravel', 'description' => "Formation pratique au développement d'applications web avec le framework Laravel.", 'prix' => 185000, 'unite' => null, 'service' => true],
                ['nom' => 'Conseil IT', 'description' => "Prestation de conseil pour accompagner la transformation numérique d'une entreprise.", 'prix' => 155000, 'unite' => null, 'service' => true],
                ['nom' => 'Installation de Caméras de Surveillance', 'description' => "Installation complète d'un système de vidéosurveillance chez le client.", 'prix' => 125000, 'unite' => null, 'service' => true],
                ['nom' => 'Développement Web', 'description' => "Conception et développement d'un site web sur mesure pour un client.", 'prix' => 780000, 'unite' => null, 'service' => true],
                ['nom' => 'Développement Mobile', 'description' => "Développement d'une application mobile Android et iOS pour un client.", 'prix' => 950000, 'unite' => null, 'service' => true],
                ['nom' => 'Audit Réseau', 'description' => "Diagnostic complet de l'infrastructure réseau d'une entreprise cliente.", 'prix' => 178000, 'unite' => null, 'service' => true],
            ],
        ];

        $categoriesParNom = $categories->keyBy('categorie');
        $produits = collect();

        foreach ($catalogue as $nomCategorie => $articles) {
            $categorie = $categoriesParNom->get($nomCategorie);

            if (!$categorie) {
                continue;
            }

            foreach ($articles as $article) {
                $estService = $article['service'] ?? false;

                $produits->push(ProduitFactory::new()->create([
                    'nom'               => $article['nom'],
                    'description'       => $article['description'],
                    'prix_unitaire'     => $article['prix'],
                    'type_produit'      => $estService ? 'service' : 'physique',
                    'stock_actuel'      => $estService ? 0 : $article['stock'],
                    'seuil_alerte'      => $estService ? 0 : $article['seuil'],
                    'unite_mesure'      => $article['unite'],
                    'entreprise'        => $entreprise->id,
                    'utilisateur'       => $stockStaff->random()->id,
                    'categorie'         => $categorie->id,
                ]));
            }
        }

        return $produits;
    }
}
