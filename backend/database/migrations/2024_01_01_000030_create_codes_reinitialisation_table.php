<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('codes_reinitialisation', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->string('code', 10);

            $table->timestamp('date_creation')->default(DB::raw('NOW()'));

            $table->timestamp('date_expiration');

            $table->boolean('utilise')->default(false);

            $table->boolean('actif')->default(true);

            $table->uuid('utilisateur');

            $table->foreign('utilisateur')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->index('utilisateur', 'codes_reinitialisation_utilisateur_index');
            $table->index('date_expiration', 'codes_reinitialisation_expiration_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('codes_reinitialisation');
    }
};
