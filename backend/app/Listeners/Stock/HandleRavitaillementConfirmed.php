<?php

namespace App\Listeners\Stock;

use App\Enums\NotificationType;
use App\Events\Stock\RavitaillementConfirmed;
use App\Support\NotificationService;

class HandleRavitaillementConfirmed
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(RavitaillementConfirmed $event): void
    {
        $this->notifService->notifyByType(
            NotificationType::RESTOCK_COMPLETED,
            $event->companyId,
            'Ravitaillement confirmé',
            "Le ravitaillement de « {$event->produitNom} » a été confirmé : {$event->quantiteAjoutee} unités ajoutées au stock.",
            'medium',
            [
                'ravitaillement_id' => $event->ravitaillementId,
                'produit_id'        => $event->produitId,
                'produit_nom'       => $event->produitNom,
                'quantite'          => $event->quantiteAjoutee,
            ]
        );
    }
}
