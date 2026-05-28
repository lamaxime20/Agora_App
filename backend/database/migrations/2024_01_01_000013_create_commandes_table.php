<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commandes', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->timestamp('date_commande')->default(DB::raw('NOW()'));

            $table->enum('statut', ['brouillon', 'validee', 'annulee'])->default('brouillon');

            $table->enum('etat_payement', ['non_paye', 'partiellement_paye', 'paye'])->default('non_paye');

            $table->decimal('montant_commande', 15, 2)->default(0);

            $table->timestamp('date_validation')->nullable();
            $table->timestamp('date_annulation')->nullable();

            $table->text('raison_annulation')->nullable();

            $table->boolean('actif')->default(true);

            $table->uuid('entreprise');
            $table->uuid('utilisateur_enregistre');
            $table->uuid('client');
            $table->uuid('utilisateur_valide')->nullable();

            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('utilisateur_enregistre')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('client')
                ->references('id')->on('clients')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('utilisateur_valide')
                ->references('id')->on('utilisateurs')
                ->onDelete('set null')
                ->onUpdate('cascade');

            $table->index('entreprise', 'commandes_entreprise_index');
            $table->index('client', 'commandes_client_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commandes');
    }
};
