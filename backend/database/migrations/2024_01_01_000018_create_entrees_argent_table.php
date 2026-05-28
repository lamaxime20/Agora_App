<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;
    public function up(): void
    {
        Schema::create('entrees_argent', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->decimal('montant', 15, 2);

            $table->text('raison');

            $table->timestamp('date_entree')->default(DB::raw('NOW()'));

            $table->boolean('actif')->default(true);

            $table->uuid('entreprise');
            $table->uuid('utilisateur_marque');

            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('utilisateur_marque')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entrees_argent');
    }
};

