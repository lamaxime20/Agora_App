<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appartenir_entreprise', function (Blueprint $table) {
            $table->uuid('utilisateur_id');
            $table->uuid('entreprise_id');
            $table->uuid('role_utilisateur_id');

            $table->timestamp('date_enregistrement')->default(DB::raw('NOW()'));

            $table->enum('statut', ['actif', 'archive'])->default('actif');

            $table->primary(['utilisateur_id', 'entreprise_id', 'role_utilisateur_id']);

            $table->foreign('utilisateur_id')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('entreprise_id')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('role_utilisateur_id')
                ->references('id')->on('roles_utilisateur')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appartenir_entreprise');
    }
};
