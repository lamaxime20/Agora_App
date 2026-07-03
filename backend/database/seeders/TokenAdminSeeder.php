<?php

namespace Database\Seeders;

use App\Models\Admin;
use Database\Factories\TokenAdminFactory;
use Illuminate\Database\Seeder;

class TokenAdminSeeder extends Seeder
{
    public function run(Admin $admin): void
    {
        collect(range(1, 5))->each(fn () => TokenAdminFactory::new()->create([
            'admin' => $admin->id,
        ]));
    }
}
