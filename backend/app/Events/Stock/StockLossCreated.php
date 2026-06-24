<?php

namespace App\Events\Stock;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockLossCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $companyId,
        public readonly string $produitId,
        public readonly string $produitNom,
        public readonly float  $quantitePerdue,
        public readonly string $motif,
        public readonly string $signaleParUserId
    ) {}
}
