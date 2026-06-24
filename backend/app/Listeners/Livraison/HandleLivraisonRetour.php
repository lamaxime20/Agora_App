<?php

namespace App\Listeners\Livraison;

use App\Enums\NotificationType;
use App\Events\Livraison\LivraisonRetour;
use App\Support\NotificationService;

class HandleLivraisonRetour
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(LivraisonRetour $event): void
    {
        $motif = $event->motif ? " Motif : {$event->motif}." : '';

        $this->notifService->notifyByType(
            NotificationType::DELIVERY_RETURNED,
            $event->companyId,
            'Retour de livraison',
            "La livraison de la commande pour le client « {$event->clientNom} » a été retournée.{$motif}",
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
