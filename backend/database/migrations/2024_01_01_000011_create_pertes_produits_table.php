<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pertes_produits', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->decimal('quantite_perdu', 15, 2);

            $table->text('motif_perte');

            $table->timestamp('date_perte')->default(DB::raw('NOW()'));

            $table->uuid('user_signale');
            $table->uuid('produit');

            $table->foreign('user_signale')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('produit')
                ->references('id')->on('produits')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pertes_produits');
    }
};
