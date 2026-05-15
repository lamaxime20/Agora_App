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
        Schema::create('bon_commandes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proforma_id')->constrained('proformas')->onDelete('cascade');
            $table->date('date_livraison_prevue');
            $table->text('fichier_scan')->nullable();
            $table->enum('statut_livraison', ['En attente de livraison', 'Livraison dans les délais', 'Livraison hors délais']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bon_commandes');
    }
};
