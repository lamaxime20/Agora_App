<?php

namespace Database\Seeders;

use Database\Factories\CodeOtpFactory;
use Illuminate\Database\Seeder;

class CodeOtpSeeder extends Seeder
{
    public function run(): void
    {
        collect(range(1, 10))->each(fn () => CodeOtpFactory::new()->create());
    }
}
