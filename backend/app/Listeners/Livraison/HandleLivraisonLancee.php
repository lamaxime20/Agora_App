<?php

namespace App\Listeners\Livraison;

use App\Enums\NotificationType;
use App\Events\Livraison\LivraisonLancee;
use App\Support\NotificationService;

class HandleLivraisonLancee
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(LivraisonLancee $event): void
    {
        $this->notifService->notifyByType(
            NotificationType::DELIVERY_STARTED,
            $event->companyId,
            'Livraison en cours',
            "La livraison de la commande pour le client « {$event->clientNom} » a été lancée.",
            'low',
            [
                'livraison_id' => $event->livraisonId,
                'commande_id'  => $event->commandeId,
                'client_nom'   => $event->clientNom,
            ]
        );
    }
}
