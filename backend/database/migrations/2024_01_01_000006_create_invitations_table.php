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
        Schema::create('invitations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('email_invite', 255);

            $table->timestamp('date_invitation')->default(DB::raw('NOW()'));

            $table->enum('statut', ['en_attente', 'acceptee', 'refusee', 'expiree', 'annulee'])->default('en_attente');

            $table->timestamp('date_expiration')->nullable();

            $table->boolean('actif')->default(true);

            $table->uuid('role');
            $table->uuid('entreprise');

            $table->foreign('role')
                ->references('id')->on('roles_utilisateur')
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
        Schema::dropIfExists('invitations');
    }
};

