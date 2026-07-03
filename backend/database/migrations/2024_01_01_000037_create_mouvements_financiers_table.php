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
        Schema::create('mouvements_financiers', function (Blueprint $table) {
            $table->uuid('id');

            $table->timestamp('date_operation')->default(DB::raw('NOW()'));

            $table->enum('type_operation', [
                'paiement_commande',
                'remboursement_commande',
                'depense_generale',
                'entree_generale',
                'paiement_salaire',
                'paiement_abonnement',
                'paiement_ravitaillement',
                'perte_argent',
            ]);

            $table->decimal('montant', 15, 2);

            $table->enum('sens', ['entree', 'sortie']);

            $table->uuid('reference_id')->nullable();
            $table->text('description')->nullable();

            $table->uuid('entreprise_id');
            $table->uuid('utilisateur_id')->nullable();

            $table->foreign('entreprise_id')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('utilisateur_id')
                ->references('id')->on('utilisateurs')
                ->onDelete('set null')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mouvements_financiers');
    }
};
