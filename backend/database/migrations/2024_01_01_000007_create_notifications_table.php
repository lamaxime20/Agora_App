<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->string('titre', 255);
            $table->text('message');

            $table->timestamp('date_arrivee')->default(DB::raw('NOW()'));

            $table->enum('statut', ['non_lue', 'lue', 'archivee'])->default('non_lue');

            $table->enum('type_notification', ['invitation', 'tache', 'perte', 'paiement', 'stock', 'livraison', 'autre']);

            $table->boolean('actif')->default(true);

            $table->uuid('utilisateur');
            $table->uuid('entreprise');
            $table->uuid('role');

            $table->foreign('utilisateur')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('role')
                ->references('id')->on('roles_utilisateur')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->index('utilisateur', 'notifications_utilisateur_index');
            $table->index('entreprise', 'notifications_entreprise_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
