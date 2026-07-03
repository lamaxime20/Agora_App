<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use App\Models\RoleUtilisateur;
use Database\Factories\NotificationFactory;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    /**
     * @param array<int, array{user: \App\Models\Utilisateur, role_slug: string}> $utilisateurRoster
     */
    public function run(Entreprise $entreprise, array $utilisateurRoster): void
    {
        $roleIdsBySlug = RoleUtilisateur::pluck('id', 'role');

        $events = [
            ['type' => 'INVITATION',        'title' => 'Nouvelle invitation',           'message' => 'Vous avez été invité à rejoindre Bytes-Corp.'],
            ['type' => 'TASK_ASSIGNED',      'title' => 'Nouvelle tâche assignée',       'message' => 'Une nouvelle tâche vous a été assignée.'],
            ['type' => 'STOCK_LOW',          'title' => 'Stock bas',                     'message' => 'Le stock d\'un produit est en dessous du seuil d\'alerte.'],
            ['type' => 'ORDER_CREATED',      'title' => 'Nouvelle commande',             'message' => 'Une nouvelle commande a été enregistrée.'],
            ['type' => 'PAYMENT_RECEIVED',   'title' => 'Paiement reçu',                 'message' => 'Un paiement a été enregistré pour une commande.'],
            ['type' => 'DELIVERY_STARTED',   'title' => 'Livraison en cours',            'message' => 'Une livraison vient d\'être lancée.'],
            ['type' => 'RESTOCK_REQUESTED',  'title' => 'Réapprovisionnement demandé',   'message' => 'Une demande de réapprovisionnement a été soumise.'],
        ];

        collect(range(1, 30))->each(function () use ($entreprise, $utilisateurRoster, $roleIdsBySlug, $events) {
            $entry = $utilisateurRoster[array_rand($utilisateurRoster)];
            $event = $events[array_rand($events)];

            NotificationFactory::new()->create([
                'user_id'    => $entry['user']->id,
                'company_id' => $entreprise->id,
                'role_id'    => $roleIdsBySlug[$entry['role_slug']],
                'type'       => $event['type'],
                'title'      => $event['title'],
                'message'    => $event['message'],
                'priority'   => collect(['low', 'medium', 'high', 'critical'])->random(),
                'read_at'    => collect([null, now()->subDays(random_int(0, 10))])->random(),
            ]);
        });
    }
}
