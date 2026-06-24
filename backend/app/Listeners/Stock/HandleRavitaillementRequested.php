<?php

namespace App\Listeners\Stock;

use App\Enums\NotificationType;
use App\Events\Stock\RavitaillementRequested;
use App\Support\NotificationService;

class HandleRavitaillementRequested
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(RavitaillementRequested $event): void
    {
        $this->notifService->notifyByType(
            NotificationType::RESTOCK_REQUESTED,
            $event->companyId,
            'Demande de ravitaillement',
            "Une demande de ravitaillement a été soumise pour « {$event->produitNom} » ({$event->quantiteDemandee} unités).",
            'medium',
            [
                'ravitaillement_id' => $event->ravitaillementId,
                'produit_id'        => $event->produitId,
                'produit_nom'       => $event->produitNom,
                'quantite'          => $event->quantiteDemandee,
            ]
        );
    }
}
