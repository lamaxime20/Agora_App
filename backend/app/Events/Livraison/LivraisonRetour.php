<?php

namespace App\Events\Livraison;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LivraisonRetour
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string  $companyId,
        public readonly string  $livraisonId,
        public readonly string  $commandeId,
        public readonly string  $clientNom,
        public readonly ?string $motif
    ) {}
}
