<?php

namespace App\Listeners\Commande;

use App\Enums\NotificationType;
use App\Events\Commande\CommandeValidated;
use App\Support\NotificationService;

class HandleCommandeValidated
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(CommandeValidated $event): void
    {
        $montant = number_format($event->montantTotal, 0, ',', ' ');

        $this->notifService->notifyByType(
            NotificationType::ORDER_VALIDATED,
            $event->companyId,
            'Commande validée',
            "La commande de {$montant} XAF pour le client « {$event->clientNom} » a été validée et est prête pour livraison.",
            'medium',
            [
                'commande_id' => $event->commandeId,
                'client_nom'  => $event->clientNom,
                'montant'     => $event->montantTotal,
            ]
        );
    }
}
