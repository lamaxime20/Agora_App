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
        Schema::create('taches', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('nom', 255);

            $table->text('description')->nullable();

            $table->timestamp('date_demande')->default(DB::raw('NOW()'));

            $table->timestamp('date_limite')->nullable();

            $table->enum('statut', ['en_attente', 'en_cours', 'terminee', 'annulee', 'reportee'])->default('en_attente');

            $table->integer('pourcentage_avancement')->default(0);

            $table->text('raison_annulation')->nullable();
            $table->text('raison_report')->nullable();

            $table->timestamp('date_fin')->nullable();

            $table->boolean('actif')->default(true);

            $table->uuid('utilisateur_defini');
            $table->uuid('utilisateur_assigne');
            $table->uuid('role_associe');
            $table->uuid('entreprise');

            $table->foreign('utilisateur_defini')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('utilisateur_assigne')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('role_associe')
                ->references('id')->on('roles_utilisateur')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->index('utilisateur_assigne', 'taches_utilisateur_assigne_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taches');
    }
};

