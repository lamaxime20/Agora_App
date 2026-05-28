<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;
    public function up(): void
    {
        Schema::create('codes_otp', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('code', 10);

            $table->string('email', 255);

            $table->timestamp('date_creation')->default(DB::raw('NOW()'));

            $table->timestamp('date_expiration');

            $table->boolean('utilise')->default(false);

            $table->boolean('actif')->default(true);

            $table->index('email', 'codes_otp_email_index');
            $table->index('date_expiration', 'codes_otp_expiration_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('codes_otp');
    }
};

