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
        // 1. Drop statut (enum w/ check) and actif boolean
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['statut', 'actif']);
        });

        // 2. Drop the enum check constraint on type_notification so we can widen it
        DB::statement('ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_notification_check');

        // 3. Widen type_notification to varchar(100) and rename to type
        DB::statement('ALTER TABLE notifications ALTER COLUMN type_notification TYPE VARCHAR(100) USING type_notification::text');
        DB::statement('ALTER TABLE notifications RENAME COLUMN type_notification TO type');

        // 4. Rename titre -> title
        DB::statement('ALTER TABLE notifications RENAME COLUMN titre TO title');

        // 5. Drop old FK constraints and indexes before renaming their columns
        DB::statement('ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_utilisateur_foreign');
        DB::statement('ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_entreprise_foreign');
        DB::statement('ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_role_foreign');
        DB::statement('DROP INDEX IF EXISTS notifications_utilisateur_index');
        DB::statement('DROP INDEX IF EXISTS notifications_entreprise_index');

        // 6. Rename FK columns to snake_case
        DB::statement('ALTER TABLE notifications RENAME COLUMN utilisateur TO user_id');
        DB::statement('ALTER TABLE notifications RENAME COLUMN entreprise TO company_id');
        DB::statement('ALTER TABLE notifications RENAME COLUMN role TO role_id');

        // 7. Rename date_arrivee to created_at (keep NOW() default)
        DB::statement('ALTER TABLE notifications RENAME COLUMN date_arrivee TO created_at');

        // 8. Add new columns
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('priority', 20)->default('medium');
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        // 9. Re-add FK constraints with new column names
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreign('user_id')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('company_id')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('role_id')
                ->references('id')->on('roles_utilisateur')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->index('user_id', 'notifications_user_id_index');
            $table->index('company_id', 'notifications_company_id_index');
            $table->index('read_at', 'notifications_read_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['company_id']);
            $table->dropForeign(['role_id']);
            $table->dropIndex('notifications_user_id_index');
            $table->dropIndex('notifications_company_id_index');
            $table->dropIndex('notifications_read_at_index');
            $table->dropColumn(['priority', 'data', 'read_at', 'archived_at', 'updated_at']);
        });

        DB::statement('ALTER TABLE notifications RENAME COLUMN user_id TO utilisateur');
        DB::statement('ALTER TABLE notifications RENAME COLUMN company_id TO entreprise');
        DB::statement('ALTER TABLE notifications RENAME COLUMN role_id TO role');
        DB::statement('ALTER TABLE notifications RENAME COLUMN title TO titre');
        DB::statement('ALTER TABLE notifications RENAME COLUMN created_at TO date_arrivee');
        DB::statement('ALTER TABLE notifications RENAME COLUMN type TO type_notification');

        Schema::table('notifications', function (Blueprint $table) {
            $table->enum('statut', ['non_lue', 'lue', 'archivee'])->default('non_lue');
            $table->boolean('actif')->default(true);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->foreign('utilisateur')
                ->references('id')->on('utilisateurs')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('entreprise')
                ->references('id')->on('entreprises')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('role')
                ->references('id')->on('roles_utilisateur')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->index('utilisateur', 'notifications_utilisateur_index');
            $table->index('entreprise', 'notifications_entreprise_index');
        });
    }
};
