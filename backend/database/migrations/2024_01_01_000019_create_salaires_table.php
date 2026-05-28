<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;
    public function up(): void
    {
        Schema::create('salaires', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->decimal('montant', 15, 2);

            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();

            $table->timestamp('date_paiement')->nullable();

            $table->boolean('actif')->default(true);

            $table->enum('statut', ['actif', 'archive'])->default('actif');

            $table->uuid('utilisateur');
            $table->uuid('entreprise');

            $table->foreign('utilisateur')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salaires');
    }
};

