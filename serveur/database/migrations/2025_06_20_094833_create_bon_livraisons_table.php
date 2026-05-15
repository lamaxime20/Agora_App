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
        Schema::create('bon_livraisons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bon_commande_id')->constrained('bon_commandes')->onDelete('cascade');
            $table->enum('etat', ['En attente', 'Livre']);
            $table->enum('delai_livraison', ['Dans les délais', 'Hors délai'])->nullable();
            $table->text('bon_livraison_scan_pdf');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bon_livraisons');
    }
};
