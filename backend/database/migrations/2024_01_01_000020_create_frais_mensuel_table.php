<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('frais_mensuel', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->string('service_paye', 255);

            $table->string('fournisseur', 255)->nullable();

            $table->decimal('montant_mensuel', 15, 2);

            $table->boolean('depense_active')->default(true);

            $table->date('date_abonnement')->nullable();

            $table->boolean('actif')->default(true);

            $table->uuid('entreprise');

            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('frais_mensuel');
    }
};
