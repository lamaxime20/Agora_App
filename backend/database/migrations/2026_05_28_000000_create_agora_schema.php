<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->string('name');
            $table->string('prename');
            $table->string('statut', 20)->default('actif');
            $table->timestamp('modified_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('roles_utilisateur', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('role', 100)->unique();
            $table->text('description')->nullable();
        });

        Schema::create('entreprises', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('nom');
            $table->text('logo')->nullable();
            $table->string('code_couleur', 20)->nullable();
            $table->decimal('argent_virtuel', 15, 2)->default(0);
            $table->string('statut', 20)->default('actif');
            $table->foreignUuid('directeur')->constrained('utilisateurs')->restrictOnDelete()->cascadeOnUpdate();
        });

        Schema::create('codes_couleurs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('couleur_primaire', 20)->default('#FFF');
            $table->string('couleur_secondaire', 20)->default('#000');
            $table->string('couleur_tertiaire', 20)->default('#F0F0F0');
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
        });

        Schema::create('appartenir_entreprise', function (Blueprint $table): void {
            $table->foreignUuid('utilisateur_id')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('entreprise_id')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('role_utilisateur_id')->constrained('roles_utilisateur')->cascadeOnDelete()->cascadeOnUpdate();
            $table->timestamp('date_enregistrement')->useCurrent();
            $table->string('statut', 20)->default('actif');
            $table->primary(['utilisateur_id', 'entreprise_id', 'role_utilisateur_id'], 'appartenir_entreprise_pk');
        });

        Schema::create('invitations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('email_invite');
            $table->timestamp('date_invitation')->useCurrent();
            $table->string('statut', 20)->default('en_attente');
            $table->timestamp('date_expiration')->nullable();
            $table->boolean('actif')->default(true);
            $table->foreignUuid('role')->constrained('roles_utilisateur')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
        });

        Schema::create('notifications', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('titre');
            $table->text('message');
            $table->timestamp('date_arrivee')->useCurrent();
            $table->string('statut', 20)->default('non_lue');
            $table->string('type_notification', 20);
            $table->boolean('actif')->default(true);
            $table->foreignUuid('utilisateur')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('role')->constrained('roles_utilisateur')->cascadeOnDelete()->cascadeOnUpdate();
            $table->index('utilisateur');
            $table->index('entreprise');
        });

        Schema::create('categories_produit', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('categorie', 150);
            $table->text('description')->nullable();
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('utilisateur')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->unique(['categorie', 'entreprise'], 'categories_produit_categorie_entreprise_unique');
        });

        Schema::create('produits', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('nom');
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->nullable();
            $table->text('image')->nullable();
            $table->decimal('prix_unitaire', 15, 2);
            $table->string('type_produit', 20);
            $table->decimal('stock_actuel', 15, 2)->default(0);
            $table->string('unite_mesure', 50)->nullable();
            $table->text('description')->nullable();
            $table->string('statut', 20)->default('actif');
            $table->foreignUuid('utilisateur')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('categorie')->constrained('categories_produit')->cascadeOnDelete()->cascadeOnUpdate();
            $table->index('entreprise');
            $table->index('categorie');
        });

        Schema::create('ravitaillements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->timestamp('date_creation')->useCurrent();
            $table->string('statut', 20)->default('en_attente');
            $table->decimal('quantite', 15, 2);
            $table->decimal('montant_a_depenser', 15, 2);
            $table->timestamp('date_validation')->nullable();
            $table->timestamp('date_execution')->nullable();
            $table->boolean('actif')->default(true);
            $table->foreignUuid('utilisateur_demande')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('user_confirmation')->nullable()->constrained('utilisateurs')->nullOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('produit')->constrained('produits')->cascadeOnDelete()->cascadeOnUpdate();
        });

        Schema::create('pertes_produits', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->decimal('quantite_perdu', 15, 2);
            $table->text('motif_perte');
            $table->timestamp('date_perte')->useCurrent();
            $table->foreignUuid('user_signale')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('produit')->constrained('produits')->cascadeOnDelete()->cascadeOnUpdate();
        });

        Schema::create('clients', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('email')->nullable();
            $table->string('nom');
            $table->string('prenom')->nullable();
            $table->string('telephone', 30)->nullable();
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
        });

        Schema::create('commandes', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->timestamp('date_commande')->useCurrent();
            $table->string('statut', 20)->default('brouillon');
            $table->string('etat_payement', 30)->default('non_paye');
            $table->decimal('montant_commande', 15, 2)->default(0);
            $table->timestamp('date_validation')->nullable();
            $table->timestamp('date_annulation')->nullable();
            $table->text('raison_annulation')->nullable();
            $table->boolean('actif')->default(true);
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('utilisateur_enregistre')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('client')->constrained('clients')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('utilisateur_valide')->nullable()->constrained('utilisateurs')->nullOnDelete()->cascadeOnUpdate();
            $table->index('entreprise');
            $table->index('client');
        });

        Schema::create('contenir_produit', function (Blueprint $table): void {
            $table->foreignUuid('commande_id')->constrained('commandes')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('produit_id')->constrained('produits')->cascadeOnDelete()->cascadeOnUpdate();
            $table->decimal('quantite', 15, 2);
            $table->decimal('prix_unitaire', 15, 2);
            $table->decimal('reduction', 15, 2)->default(0);
            $table->decimal('montant', 15, 2);
            $table->primary(['commande_id', 'produit_id'], 'contenir_produit_pk');
        });

        Schema::create('livraisons', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_livraison_effective')->nullable();
            $table->string('statut', 20)->default('en_cours');
            $table->text('motif_echec')->nullable();
            $table->text('motif_retour')->nullable();
            $table->timestamp('date_lancement')->nullable();
            $table->boolean('actif')->default(true);
            $table->foreignUuid('commande')->constrained('commandes')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('livreur')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->index('commande');
        });

        Schema::create('payements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->decimal('montant', 15, 2);
            $table->timestamp('date_payement')->useCurrent();
            $table->string('mode_payement', 30)->nullable();
            $table->string('reference_transaction')->nullable();
            $table->boolean('actif')->default(true);
            $table->foreignUuid('commande')->constrained('commandes')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('user_enregistre')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
            $table->index('commande');
        });

        Schema::create('depenses', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->decimal('montant', 15, 2);
            $table->timestamp('date_depense')->useCurrent();
            $table->text('raison');
            $table->boolean('actif')->default(true);
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('utilisateur_marque')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
        });

        Schema::create('entrees_argent', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->decimal('montant', 15, 2);
            $table->text('raison');
            $table->timestamp('date_entree')->useCurrent();
            $table->boolean('actif')->default(true);
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('utilisateur_marque')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
        });

        Schema::create('salaires', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->decimal('montant', 15, 2);
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->timestamp('date_paiement')->nullable();
            $table->boolean('actif')->default(true);
            $table->string('statut', 20)->default('actif');
            $table->foreignUuid('utilisateur')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
        });

        Schema::create('frais_mensuel', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('service_paye');
            $table->string('fournisseur')->nullable();
            $table->decimal('montant_mensuel', 15, 2);
            $table->boolean('depense_active')->default(true);
            $table->date('date_abonnement')->nullable();
            $table->boolean('actif')->default(true);
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
        });

        Schema::create('pertes_argent', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->text('cause');
            $table->decimal('montant', 15, 2);
            $table->timestamp('date_constat')->useCurrent();
            $table->boolean('actif')->default(true);
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('utilisateur_signale')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
        });

        Schema::create('remboursements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->text('cause');
            $table->decimal('montant', 15, 2);
            $table->timestamp('date_remboursement')->useCurrent();
            $table->boolean('actif')->default(true);
            $table->foreignUuid('commande')->constrained('commandes')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('utilisateur_engage')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
        });

        Schema::create('taches', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->timestamp('date_demande')->useCurrent();
            $table->timestamp('date_limite')->nullable();
            $table->string('statut', 20)->default('en_attente');
            $table->unsignedTinyInteger('pourcentage_avancement')->default(0);
            $table->text('raison_annulation')->nullable();
            $table->text('raison_report')->nullable();
            $table->timestamp('date_fin')->nullable();
            $table->boolean('actif')->default(true);
            $table->foreignUuid('utilisateur_defini')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('utilisateur_assigne')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('role_associe')->constrained('roles_utilisateur')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
            $table->index('utilisateur_assigne');
        });

        Schema::create('evenements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->timestamp('date_evenement');
            $table->string('lieu')->nullable();
            $table->string('statut', 20)->default('planifie');
            $table->boolean('actif')->default(true);
            $table->foreignUuid('creation')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
        });

        Schema::create('participer_evenement', function (Blueprint $table): void {
            $table->foreignUuid('utilisateur_id')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('evenement_id')->constrained('evenements')->cascadeOnDelete()->cascadeOnUpdate();
            $table->timestamp('date_participation')->useCurrent();
            $table->string('statut_presence', 20)->nullable();
            $table->primary(['utilisateur_id', 'evenement_id'], 'participer_evenement_pk');
        });

        Schema::create('historiques', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('module', 100);
            $table->string('table_concernee', 100);
            $table->uuid('id_element');
            $table->string('action');
            $table->text('details_action')->nullable();
            $table->text('ancienne_valeur')->nullable();
            $table->text('nouvelle_valeur')->nullable();
            $table->string('ip', 100)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('date_action')->useCurrent();
            $table->foreignUuid('utilisateur')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
            $table->index('entreprise');
            $table->index('date_action');
        });

        Schema::create('sessions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('token')->unique();
            $table->timestamp('date_creation');
            $table->timestamp('date_expiration');
            $table->boolean('validite')->default(false);
            $table->foreignUuid('role')->constrained('roles_utilisateur')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('entreprise')->constrained('entreprises')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignUuid('utilisateur')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->index('token');
        });

        Schema::create('token_choix_role', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('token')->unique();
            $table->timestamp('date_creation');
            $table->timestamp('date_expiration');
            $table->boolean('validite')->default(false);
            $table->foreignUuid('utilisateur')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->index('token');
        });

        Schema::create('codes_otp', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('code', 10);
            $table->string('email');
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_expiration');
            $table->boolean('utilise')->default(false);
            $table->boolean('actif')->default(true);
            $table->index('email');
            $table->index('date_expiration');
        });

        Schema::create('codes_reinitialisation', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('code', 10);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_expiration');
            $table->boolean('utilise')->default(false);
            $table->boolean('actif')->default(true);
            $table->foreignUuid('utilisateur')->constrained('utilisateurs')->cascadeOnDelete()->cascadeOnUpdate();
            $table->index('utilisateur');
            $table->index('date_expiration');
        });
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::dropIfExists('codes_reinitialisation');
        Schema::dropIfExists('codes_otp');
        Schema::dropIfExists('token_choix_role');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('historiques');
        Schema::dropIfExists('participer_evenement');
        Schema::dropIfExists('evenements');
        Schema::dropIfExists('taches');
        Schema::dropIfExists('remboursements');
        Schema::dropIfExists('pertes_argent');
        Schema::dropIfExists('frais_mensuel');
        Schema::dropIfExists('salaires');
        Schema::dropIfExists('entrees_argent');
        Schema::dropIfExists('depenses');
        Schema::dropIfExists('payements');
        Schema::dropIfExists('livraisons');
        Schema::dropIfExists('contenir_produit');
        Schema::dropIfExists('commandes');
        Schema::dropIfExists('clients');
        Schema::dropIfExists('pertes_produits');
        Schema::dropIfExists('ravitaillements');
        Schema::dropIfExists('produits');
        Schema::dropIfExists('categories_produit');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('invitations');
        Schema::dropIfExists('appartenir_entreprise');
        Schema::dropIfExists('codes_couleurs');
        Schema::dropIfExists('entreprises');
        Schema::dropIfExists('roles_utilisateur');
        Schema::dropIfExists('utilisateurs');

        Schema::enableForeignKeyConstraints();
    }
};
