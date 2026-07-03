<?php

namespace Database\Seeders;

use App\Models\Admin;
use Database\Factories\CodeReinitialisationAdminFactory;
use Illuminate\Database\Seeder;

class CodeReinitialisationAdminSeeder extends Seeder
{
    public function run(Admin $admin): void
    {
        collect(range(1, 5))->each(fn () => CodeReinitialisationAdminFactory::new()->create([
            'admin' => $admin->id,
        ]));
    }
}
