<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;
    public function up(): void
    {
        Schema::create('codes_couleurs', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('couleur_primaire', 20)->default('#FFF');
            $table->string('couleur_secondaire', 20)->default('#000');
            $table->string('couleur_tertiaire', 20)->default('#F0F0F0');

            $table->uuid('entreprise');
            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('codes_couleurs');
    }
};

