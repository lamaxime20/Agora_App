<?php

namespace App\Listeners\Stock;

use App\Enums\NotificationType;
use App\Events\Stock\StockLowAlert;
use App\Support\NotificationService;
use App\Support\NotificationTargetResolver;

class HandleStockLow
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(StockLowAlert $event): void
    {
        $roles = NotificationTargetResolver::rolesFor(NotificationType::STOCK_LOW);

        $this->notifService->createForRoles(
            NotificationType::STOCK_LOW,
            $event->companyId,
            'Stock faible',
            "Le stock de « {$event->produitNom} » est bas ({$event->stockActuel} unités restantes, seuil d'alerte : {$event->seuilAlerte}).",
            'high',
            [
                'produit_id'   => $event->produitId,
                'produit_nom'  => $event->produitNom,
                'stock_actuel' => $event->stockActuel,
                'seuil_alerte' => $event->seuilAlerte,
            ],
            $roles ?? []
        );
    }
}
