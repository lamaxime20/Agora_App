<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produits', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->string('nom', 255);

            $table->timestamp('date_creation')->default(DB::raw('NOW()'));
            $table->timestamp('date_modification')->nullable();

            $table->text('image')->nullable();

            $table->decimal('prix_unitaire', 15, 2);

            $table->enum('type_produit', ['physique', 'service']);

            $table->decimal('stock_actuel', 15, 2)->default(0);

            $table->string('unite_mesure', 50)->nullable();

            $table->text('description')->nullable();

            $table->enum('statut', ['actif', 'archive'])->default('actif');

            $table->uuid('utilisateur');
            $table->uuid('entreprise');
            $table->uuid('categorie');

            $table->foreign('utilisateur')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('categorie')
                ->references('id')->on('categories_produit')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->index('entreprise', 'produits_entreprise_index');
            $table->index('categorie', 'produits_categorie_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produits');
    }
};
