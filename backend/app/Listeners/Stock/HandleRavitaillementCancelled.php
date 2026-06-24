<?php

namespace App\Listeners\Stock;

use App\Enums\NotificationType;
use App\Events\Stock\RavitaillementCancelled;
use App\Support\NotificationService;

class HandleRavitaillementCancelled
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(RavitaillementCancelled $event): void
    {
        $raison = $event->raison ? " Raison : {$event->raison}." : '';

        $this->notifService->notifyByType(
            NotificationType::RESTOCK_REJECTED,
            $event->companyId,
            'Ravitaillement annulé',
            "La demande de ravitaillement pour « {$event->produitNom} » a été annulée.{$raison}",
            'medium',
            [
                'ravitaillement_id' => $event->ravitaillementId,
                'produit_id'        => $event->produitId,
                'produit_nom'       => $event->produitNom,
                'raison'            => $event->raison,
            ]
        );
    }
}
