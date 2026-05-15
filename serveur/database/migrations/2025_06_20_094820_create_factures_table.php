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
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bon_commande_id')->constrained('bon_commandes')->onDelete('cascade');
            $table->enum('etat', ['En attente de validation', 'Non payee', 'Payee']);
            $table->text('recu_paiement_pdf')->nullable();
            $table->foreignId('validee_par')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
