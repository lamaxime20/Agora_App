<?php

namespace App\Providers;

use App\Events\Commande\CommandeCancelled;
use App\Events\Commande\CommandeCreated;
use App\Events\Commande\CommandeValidated;
use App\Events\Livraison\LivraisonAnnulee;
use App\Events\Livraison\LivraisonCreated;
use App\Events\Livraison\LivraisonEchec;
use App\Events\Livraison\LivraisonLancee;
use App\Events\Livraison\LivraisonRetour;
use App\Events\Livraison\LivraisonValidee;
use App\Events\Stock\RavitaillementCancelled;
use App\Events\Stock\RavitaillementConfirmed;
use App\Events\Stock\RavitaillementRequested;
use App\Events\Stock\StockLossCreated;
use App\Events\Stock\StockLowAlert;
use App\Listeners\Commande\HandleCommandeCancelled;
use App\Listeners\Commande\HandleCommandeCreated;
use App\Listeners\Commande\HandleCommandeValidated;
use App\Listeners\Livraison\HandleLivraisonAnnulee;
use App\Listeners\Livraison\HandleLivraisonCreated;
use App\Listeners\Livraison\HandleLivraisonEchec;
use App\Listeners\Livraison\HandleLivraisonLancee;
use App\Listeners\Livraison\HandleLivraisonRetour;
use App\Listeners\Livraison\HandleLivraisonValidee;
use App\Listeners\Stock\HandleRavitaillementCancelled;
use App\Listeners\Stock\HandleRavitaillementConfirmed;
use App\Listeners\Stock\HandleRavitaillementRequested;
use App\Listeners\Stock\HandleStockLoss;
use App\Listeners\Stock\HandleStockLow;
use App\Support\NotificationService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(NotificationService::class);
    }

    public function boot(): void
    {
        // Stock
        Event::listen(StockLossCreated::class, HandleStockLoss::class);
        Event::listen(StockLowAlert::class, HandleStockLow::class);
        Event::listen(RavitaillementRequested::class, HandleRavitaillementRequested::class);
        Event::listen(RavitaillementCancelled::class, HandleRavitaillementCancelled::class);
        Event::listen(RavitaillementConfirmed::class, HandleRavitaillementConfirmed::class);

        // Commandes
        Event::listen(CommandeCreated::class, HandleCommandeCreated::class);
        Event::listen(CommandeCancelled::class, HandleCommandeCancelled::class);
        Event::listen(CommandeValidated::class, HandleCommandeValidated::class);

        // Livraisons
        Event::listen(LivraisonCreated::class, HandleLivraisonCreated::class);
        Event::listen(LivraisonLancee::class, HandleLivraisonLancee::class);
        Event::listen(LivraisonValidee::class, HandleLivraisonValidee::class);
        Event::listen(LivraisonEchec::class, HandleLivraisonEchec::class);
        Event::listen(LivraisonRetour::class, HandleLivraisonRetour::class);
        Event::listen(LivraisonAnnulee::class, HandleLivraisonAnnulee::class);
    }
}
