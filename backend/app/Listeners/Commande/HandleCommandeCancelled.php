<?php

namespace App\Listeners\Commande;

use App\Enums\NotificationType;
use App\Events\Commande\CommandeCancelled;
use App\Support\NotificationService;

class HandleCommandeCancelled
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(CommandeCancelled $event): void
    {
        $montant = number_format($event->montantTotal, 0, ',', ' ');
        $raison  = $event->raison ? " Raison : {$event->raison}." : '';

        $this->notifService->notifyByType(
            NotificationType::ORDER_CANCELLED,
            $event->companyId,
            'Commande annulée',
            "La commande de {$montant} XAF pour le client « {$event->clientNom} » a été annulée.{$raison}",
            'medium',
            [
                'commande_id' => $event->commandeId,
                'client_nom'  => $event->clientNom,
                'montant'     => $event->montantTotal,
                'raison'      => $event->raison,
            ]
        );
    }
}
