<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contenir_produit', function (Blueprint $table) {
            $table->uuid('commande_id');
            $table->uuid('produit_id');

            $table->decimal('quantite', 15, 2);
            $table->decimal('prix_unitaire', 15, 2);
            $table->decimal('reduction', 15, 2)->default(0);
            $table->decimal('montant', 15, 2);

            $table->primary(['commande_id', 'produit_id']);

            $table->foreign('commande_id')
                ->references('id')->on('commandes')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('produit_id')
                ->references('id')->on('produits')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contenir_produit');
    }
};
