<?php

namespace Database\Seeders;

use App\Models\RoleUtilisateur;
use Illuminate\Database\Seeder;

/**
 * Insère exactement les 11 rôles définis dans
 * backend/database/base de données/role_db.sql — aucune variation.
 */
class RolesUtilisateurSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'role' => 'directeur',
                'description' => 'Le directeur est responsable de la gestion globale de l\'entreprise. Il prend des décisions stratégiques, supervise les opérations et assure la coordination entre les différents départements.',
            ],
            [
                'role' => 'manager_gestion_stock',
                'description' => 'Le manager de gestion de stock est responsable de la supervision des activités liées à la gestion des stocks. Il s\'assure que les niveaux de stock sont maintenus, gère les commandes et coordonne avec les fournisseurs pour garantir un approvisionnement efficace.',
            ],
            [
                'role' => 'employe_gestion_stock',
                'description' => 'L\'employé de gestion de stock est chargé de la réception, du stockage et de la distribution des produits. Il effectue des inventaires réguliers, met à jour les registres de stock et collabore avec le manager pour assurer une gestion efficace des stocks.',
            ],
            [
                'role' => 'manager_vente',
                'description' => 'Le manager de vente est responsable de la supervision des activités de vente. Il établit des objectifs de vente, forme et motive l\'équipe de vente, et analyse les performances pour atteindre les objectifs commerciaux.',
            ],
            [
                'role' => 'employe_vente',
                'description' => 'L\'employé de vente est chargé d\'interagir avec les clients, de promouvoir les produits et de conclure des ventes. Il fournit un excellent service client et travaille en étroite collaboration avec le manager de vente pour atteindre les objectifs de vente.',
            ],
            [
                'role' => 'manager_finances',
                'description' => 'Le manager de finances est responsable de la gestion financière de l\'entreprise. Il supervise les budgets, analyse les performances financières, et prend des décisions pour assurer la santé financière de l\'entreprise.',
            ],
            [
                'role' => 'employe_finances',
                'description' => 'L\'employé de finances est chargé de la tenue des registres financiers, de la préparation des rapports financiers et de l\'assistance dans la gestion des budgets. Il travaille en étroite collaboration avec le manager de finances pour assurer une gestion financière efficace.',
            ],
            [
                'role' => 'manager_rh',
                'description' => 'Le manager des ressources humaines est responsable de la gestion du personnel. Il supervise le recrutement, la formation, la gestion des performances et les relations avec les employés pour assurer un environnement de travail positif et productif.',
            ],
            [
                'role' => 'employe_rh',
                'description' => 'L\'employé des ressources humaines est chargé de soutenir les activités liées à la gestion du personnel. Il assiste dans le recrutement, la formation, la gestion des performances et les relations avec les employés pour contribuer à un environnement de travail positif.',
            ],
            [
                'role' => 'manager_livraison',
                'description' => 'Le manager de livraison s\'assure du bon déroulement des livraisons',
            ],
            [
                'role' => 'employe_livraison',
                'description' => 'L\'employé des livraison doit effectuer les livraison',
            ],
        ];

        foreach ($roles as $role) {
            RoleUtilisateur::updateOrCreate(['role' => $role['role']], ['description' => $role['description']]);
        }
    }
}
