<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;
    public function up(): void
    {
        Schema::create('evenements', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('nom', 255);

            $table->text('description')->nullable();

            $table->timestamp('date_evenement');

            $table->string('lieu', 255)->nullable();

            $table->enum('statut', ['planifie', 'en_cours', 'termine', 'annule'])->default('planifie');

            $table->boolean('actif')->default(true);

            $table->uuid('creation');
            $table->uuid('entreprise');

            $table->foreign('creation')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evenements');
    }
};

