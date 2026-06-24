<?php

namespace App\Listeners\Livraison;

use App\Enums\NotificationType;
use App\Events\Livraison\LivraisonValidee;
use App\Support\NotificationService;

class HandleLivraisonValidee
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(LivraisonValidee $event): void
    {
        $montant = number_format($event->montantTotal, 0, ',', ' ');

        $this->notifService->notifyByType(
            NotificationType::DELIVERY_COMPLETED,
            $event->companyId,
            'Livraison effectuée',
            "La livraison de la commande ({$montant} XAF) pour le client « {$event->clientNom} » a été complétée avec succès.",
            'medium',
            [
                'livraison_id' => $event->livraisonId,
                'commande_id'  => $event->commandeId,
                'client_nom'   => $event->clientNom,
                'montant'      => $event->montantTotal,
            ]
        );
    }
}
