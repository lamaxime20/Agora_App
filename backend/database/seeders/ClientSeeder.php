<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\ClientFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class ClientSeeder extends Seeder
{
    public function run(Entreprise $entreprise): Collection
    {
        return collect(range(1, 20))->map(fn () => ClientFactory::new()->create([
            'entreprise' => $entreprise->id,
        ]));
    }
}
