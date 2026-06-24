<?php

namespace App\Listeners\Stock;

use App\Enums\NotificationType;
use App\Events\Stock\StockLossCreated;
use App\Support\NotificationService;

class HandleStockLoss
{
    public function __construct(private readonly NotificationService $notifService) {}

    public function handle(StockLossCreated $event): void
    {
        $this->notifService->notifyByType(
            NotificationType::STOCK_LOSS,
            $event->companyId,
            'Perte de stock enregistrée',
            "Une perte de {$event->quantitePerdue} unité(s) a été enregistrée pour « {$event->produitNom} ». Motif : {$event->motif}.",
            'high',
            [
                'produit_id'  => $event->produitId,
                'produit_nom' => $event->produitNom,
                'quantite'    => $event->quantitePerdue,
                'motif'       => $event->motif,
            ]
        );
    }
}
