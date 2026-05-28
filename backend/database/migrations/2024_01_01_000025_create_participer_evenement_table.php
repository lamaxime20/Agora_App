<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participer_evenement', function (Blueprint $table) {
            $table->uuid('utilisateur_id');
            $table->uuid('evenement_id');

            $table->timestamp('date_participation')->default(DB::raw('NOW()'));

            $table->enum('statut_presence', ['present', 'absent', 'retard'])->nullable();

            $table->primary(['utilisateur_id', 'evenement_id']);

            $table->foreign('utilisateur_id')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('evenement_id')
                ->references('id')->on('evenements')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participer_evenement');
    }
};
