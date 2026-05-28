<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->text('token')->unique();

            $table->timestamp('date_creation');
            $table->timestamp('date_expiration');

            $table->boolean('validite')->default(false);

            $table->uuid('role');
            $table->uuid('entreprise');
            $table->uuid('utilisateur');

            $table->foreign('role')
                ->references('id')->on('roles_utilisateur')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('utilisateur')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->index('token', 'sessions_token_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
