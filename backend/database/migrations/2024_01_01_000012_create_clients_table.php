<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('email', 255)->nullable();

            $table->string('nom', 100);
            $table->string('prenom', 100)->nullable();

            $table->string('telephone', 30)->nullable();

            $table->uuid('entreprise');

            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};

