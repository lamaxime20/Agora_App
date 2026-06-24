<?php

namespace App\Listeners\Commande;

use App\Enums\NotificationType;
use App\Events\Commande\CommandeCreated;
use App\Support\NotificationService;

class HandleCommandeCreated
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(CommandeCreated $event): void
    {
        $montant = number_format($event->montantTotal, 0, ',', ' ');

        $this->notifService->notifyByType(
            NotificationType::ORDER_CREATED,
            $event->companyId,
            'Nouvelle commande',
            "Une nouvelle commande de {$montant} XAF a été enregistrée pour le client « {$event->clientNom} ».",
            'medium',
            [
                'commande_id' => $event->commandeId,
                'client_nom'  => $event->clientNom,
                'montant'     => $event->montantTotal,
            ]
        );
    }
}
