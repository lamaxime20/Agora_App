<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('dossiers', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 150);
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->enum('statut', ['Nouveau', 'Encours', 'Cloture']);
            $table->enum('etat', ['Demande', 'Proforma', 'Bon de commande', 'Facturation', 'Bon de livraison', 'Termine']);
            $table->json('documents')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dossiers');
    }
};
