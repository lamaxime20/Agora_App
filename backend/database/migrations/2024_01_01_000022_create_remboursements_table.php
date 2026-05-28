<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('remboursements', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->text('cause');

            $table->decimal('montant', 15, 2);

            $table->timestamp('date_remboursement')->default(DB::raw('NOW()'));

            $table->boolean('actif')->default(true);

            $table->uuid('commande');
            $table->uuid('utilisateur_engage');
            $table->uuid('entreprise');

            $table->foreign('commande')
                ->references('id')->on('commandes')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('utilisateur_engage')
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
        Schema::dropIfExists('remboursements');
    }
};
