<?php

namespace App\Listeners\Livraison;

use App\Enums\NotificationType;
use App\Events\Livraison\LivraisonCreated;
use App\Support\NotificationService;

class HandleLivraisonCreated
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(LivraisonCreated $event): void
    {
        // Notifier uniquement le livreur assigné
        $this->notifService->createForUser(
            NotificationType::DELIVERY_CREATED,
            $event->livreurUserId,
            $event->companyId,
            $event->livreurRoleId,
            'Livraison assignée',
            "Vous avez été assigné à la livraison de la commande pour le client « {$event->clientNom} ».",
            'medium',
            [
                'livraison_id' => $event->livraisonId,
                'commande_id'  => $event->commandeId,
                'client_nom'   => $event->clientNom,
            ]
        );
    }
}
