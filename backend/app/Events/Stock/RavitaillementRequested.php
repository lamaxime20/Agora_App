<?php

namespace App\Events\Stock;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RavitaillementRequested
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $companyId,
        public readonly string $ravitaillementId,
        public readonly string $produitId,
        public readonly string $produitNom,
        public readonly float  $quantiteDemandee,
        public readonly string $demandeParUserId
    ) {}
}
