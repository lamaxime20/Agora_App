<?php

namespace App\Listeners\Livraison;

use App\Enums\NotificationType;
use App\Events\Livraison\LivraisonEchec;
use App\Support\NotificationService;

class HandleLivraisonEchec
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(LivraisonEchec $event): void
    {
        $motif = $event->motif ? " Motif : {$event->motif}." : '';

        $this->notifService->notifyByType(
            NotificationType::DELIVERY_FAILED,
            $event->companyId,
            'Échec de livraison',
            "La livraison de la commande pour le client « {$event->clientNom} » a échoué.{$motif}",
            'high',
            [
                'livraison_id' => $event->livraisonId,
                'commande_id'  => $event->commandeId,
                'client_nom'   => $event->clientNom,
                'motif'        => $event->motif,
            ]
        );
    }
}
