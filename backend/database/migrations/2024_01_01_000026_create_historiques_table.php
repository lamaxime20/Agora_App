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
        Schema::create('historiques', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('module', 100);

            $table->string('table_concernee', 100);

            $table->uuid('id_element');

            $table->string('action', 255);

            $table->text('details_action')->nullable();

            $table->text('ancienne_valeur')->nullable();
            $table->text('nouvelle_valeur')->nullable();

            $table->string('ip', 100)->nullable();

            $table->text('user_agent')->nullable();

            $table->timestamp('date_action')->default(DB::raw('NOW()'));

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

            $table->index('entreprise', 'historiques_entreprise_index');
            $table->index('date_action', 'historiques_date_action_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historiques');
    }
};

