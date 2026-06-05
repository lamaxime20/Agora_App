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
        Schema::create('paiements_abonnements', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('abonnement');
            $table->decimal('montant', 15, 2);
            $table->timestamp('date_paiement')->default(DB::raw('NOW()'));
            $table->string('reference_transaction', 255)->nullable();
            $table->uuid('user_enregistre');
            $table->uuid('entreprise');

            $table->foreign('abonnement')
                ->references('id')->on('frais_mensuel')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('user_enregistre')
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
        Schema::dropIfExists('paiements_abonnements');
    }
};
