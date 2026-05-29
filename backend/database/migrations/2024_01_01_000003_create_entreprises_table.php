<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;
    public function up(): void
    {
        Schema::create('entreprises', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('nom', 255);
            $table->text('logo')->nullable();
            $table->string('code_couleur', 20)->nullable();

            $table->string('email', 255);
            $table->string('telephone', 30);
            $table->text('site_web')->nullable();

            $table->string('pays', 100);
            $table->string('ville', 100);
            $table->text('adresse');

            $table->string('secteur_activite', 150);
            $table->text('description')->nullable();

            $table->text('politique_entreprise');

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

