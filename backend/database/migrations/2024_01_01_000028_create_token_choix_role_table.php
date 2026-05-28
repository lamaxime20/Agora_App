<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;
    public function up(): void
    {
        Schema::create('token_choix_role', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->text('token')->unique();

            $table->timestamp('date_creation');
            $table->timestamp('date_expiration');

            $table->boolean('validite')->default(false);

            $table->uuid('utilisateur');

            $table->foreign('utilisateur')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->index('token', 'token_choix_role_token_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('token_choix_role');
    }
};

