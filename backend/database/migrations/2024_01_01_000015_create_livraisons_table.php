<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('livraisons', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->timestamp('date_creation')->default(DB::raw('NOW()'));
            $table->timestamp('date_livraison_effective')->nullable();

            $table->enum('statut', ['en_cours', 'livree', 'echec', 'retour'])->default('en_cours');

            $table->text('motif_echec')->nullable();
            $table->text('motif_retour')->nullable();

            $table->timestamp('date_lancement')->nullable();

            $table->boolean('actif')->default(true);

            $table->uuid('commande');
            $table->uuid('livreur');

            $table->foreign('commande')
                ->references('id')->on('commandes')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('livreur')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->index('commande', 'livraisons_commande_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('livraisons');
    }
};
