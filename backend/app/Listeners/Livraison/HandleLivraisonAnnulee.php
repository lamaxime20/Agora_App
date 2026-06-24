<?php

namespace App\Listeners\Livraison;

use App\Enums\NotificationType;
use App\Events\Livraison\LivraisonAnnulee;
use App\Support\NotificationService;

class HandleLivraisonAnnulee
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(LivraisonAnnulee $event): void
    {
        $motif = $event->motif ? " Motif : {$event->motif}." : '';

        $this->notifService->notifyByType(
            NotificationType::DELIVERY_CANCELLED,
            $event->companyId,
            'Livraison annulée',
            "La livraison de la commande pour le client « {$event->clientNom} » a été annulée.{$motif}",
            'medium',
            [
                'livraison_id' => $event->livraisonId,
                'commande_id'  => $event->commandeId,
                'client_nom'   => $event->clientNom,
                'motif'        => $event->motif,
            ]
        );
    }
}
