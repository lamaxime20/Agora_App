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
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('email', 255)->unique();
            $table->text('password_hash');

            $table->string('name', 100);
            $table->string('prename', 100);

            $table->enum('statut', ['actif', 'archive'])->default('actif');

            $table->timestamp('modified_at')->nullable();
            $table->timestamp('created_at')->default(DB::raw('NOW()'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};

