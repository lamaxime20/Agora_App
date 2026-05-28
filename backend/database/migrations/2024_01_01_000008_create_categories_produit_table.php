<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;
    public function up(): void
    {
        Schema::create('categories_produit', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('categorie', 150);
            $table->text('description')->nullable();

            $table->uuid('entreprise');
            $table->uuid('utilisateur');

            $table->unique(['categorie', 'entreprise']);

            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('utilisateur')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories_produit');
    }
};

