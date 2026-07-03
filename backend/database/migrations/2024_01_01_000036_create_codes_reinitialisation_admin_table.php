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
        Schema::create('codes_reinitialisation_admin', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('code', 10);

            $table->timestamp('date_creation')->default(DB::raw('NOW()'));

            $table->timestamp('date_expiration');

            $table->boolean('utilise')->default(false);

            $table->boolean('actif')->default(true);

            $table->uuid('admin');

            $table->foreign('admin')
                ->references('id')->on('admins')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->index('admin', 'codes_reinitialisation_admin_admin_index');
            $table->index('date_expiration', 'codes_reinitialisation_admin_expiration_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('codes_reinitialisation_admin');
    }
};
