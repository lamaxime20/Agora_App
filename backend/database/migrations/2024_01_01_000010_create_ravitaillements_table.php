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
        Schema::create('ravitaillements', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->timestamp('date_creation')->default(DB::raw('NOW()'));

            $table->enum('statut', ['en_attente', 'valide', 'refuse', 'en_cours', 'annule', 'termine'])->default('en_attente');

            $table->decimal('quantite', 15, 2);
            $table->decimal('montant_a_depenser', 15, 2);

            $table->timestamp('date_validation')->nullable();
            $table->timestamp('date_execution')->nullable();
            $table->timestamp('date_refus')->nullable();
            $table->text('raison_refus')->nullable();

            $table->boolean('actif')->default(true);

            $table->uuid('utilisateur_demande');
            $table->uuid('user_confirmation')->nullable();
            $table->uuid('produit');

            $table->foreign('utilisateur_demande')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('user_confirmation')
                ->references('id')->on('utilisateurs')
                ->onDelete('set null')
                ->onUpdate('cascade');

            $table->foreign('produit')
                ->references('id')->on('produits')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ravitaillements');
    }
};

