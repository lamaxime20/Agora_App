<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payements', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->decimal('montant', 15, 2);

            $table->timestamp('date_payement')->default(DB::raw('NOW()'));

            $table->enum('mode_payement', ['cash', 'mobile_money', 'carte_bancaire', 'virement', 'cheque', 'autre'])->nullable();

            $table->string('reference_transaction', 255)->nullable();

            $table->boolean('actif')->default(true);

            $table->uuid('commande');
            $table->uuid('user_enregistre');
            $table->uuid('entreprise');

            $table->foreign('commande')
                ->references('id')->on('commandes')
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

            $table->index('commande', 'payements_commande_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payements');
    }
};
