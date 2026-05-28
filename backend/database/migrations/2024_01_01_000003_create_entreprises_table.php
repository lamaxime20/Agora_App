<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entreprises', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->string('nom', 255);
            $table->text('logo')->nullable();
            $table->string('code_couleur', 20)->nullable();

            $table->decimal('argent_virtuel', 15, 2)->default(0);

            $table->enum('statut', ['actif', 'archive'])->default('actif');

            $table->uuid('directeur');
            $table->foreign('directeur')
                ->references('id')->on('utilisateurs')
                ->onDelete('restrict')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entreprises');
    }
};
