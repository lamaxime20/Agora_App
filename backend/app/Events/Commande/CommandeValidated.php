<?php

namespace App\Events\Commande;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommandeValidated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $companyId,
        public readonly string $commandeId,
        public readonly string $clientNom,
        public readonly float  $montantTotal
    ) {}
}
