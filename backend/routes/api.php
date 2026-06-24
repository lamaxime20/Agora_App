<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EntrepriseController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\Stock\StockCategorieController;
use App\Http\Controllers\Api\Stock\StockHistoriqueController;
use App\Http\Controllers\Api\Stock\StockPerteController;
use App\Http\Controllers\Api\Stock\StockProduitController;
use App\Http\Controllers\Api\Stock\StockRavitaillementController;
use App\Http\Controllers\Api\Stock\StockReservationController;
use App\Http\Controllers\Api\Stock\StockStatistiqueController;
use App\Http\Controllers\Api\Finances\FinancesDashboardController;
use App\Http\Controllers\Api\Finances\FinancesCommandeController;
use App\Http\Controllers\Api\Finances\FinancesRemboursementController;
use App\Http\Controllers\Api\Finances\FinancesDepenseController;
use App\Http\Controllers\Api\Finances\FinancesEntreeController;
use App\Http\Controllers\Api\Finances\FinancesAbonnementController;
use App\Http\Controllers\Api\Finances\FinancesReapprovisionnementController;
use App\Http\Controllers\Api\Finances\FinancesSalaireController;
use App\Http\Controllers\Api\Finances\FinancesJournalController;
use App\Http\Controllers\Api\Finances\FinancesStatistiqueController;
use App\Http\Controllers\Api\Ventes\VentesClientController;
use App\Http\Controllers\Api\Ventes\VentesCommandeController;
use App\Http\Controllers\Api\Ventes\VentesProduitController;
use App\Http\Controllers\Api\Ventes\VentesReservationController;
use App\Http\Controllers\Api\Ventes\VentesStatistiqueController;
use App\Http\Controllers\Api\Ventes\VentesNotificationController;
use App\Http\Controllers\Api\Livraisons\LivraisonsDashboardController;
use App\Http\Controllers\Api\Livraisons\LivraisonsCommandeController;
use App\Http\Controllers\Api\Livraisons\LivraisonsPersonnelController;
use App\Http\Controllers\Api\Livraisons\LivraisonsActionController;
use App\Http\Controllers\Api\Livraisons\LivraisonsStatistiqueController;
use App\Http\Controllers\Api\Livraisons\LivraisonsNotificationController;
use App\Http\Controllers\Api\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Api\Admin\EntrepriseController as AdminEntrepriseController;
use App\Http\Controllers\Api\Admin\ProduitController as AdminProduitController;
use App\Http\Controllers\Api\Admin\CategorieController as AdminCategorieController;
use App\Http\Controllers\Api\Admin\EmployeController as AdminEmployeController;
use App\Http\Controllers\Api\Admin\AdminController as AdminAdminController;
use App\Http\Controllers\Api\Admin\ParametresController as AdminParametresController;
use App\Http\Controllers\Api\SignupController;
use App\Http\Controllers\Api\UserParametresController;
use App\Http\Controllers\Api\EntrepriseParametresController;
use App\Http\Controllers\Api\RH\RhDashboardController;
use App\Http\Controllers\Api\RH\RhEmployeController;
use App\Http\Controllers\Api\RH\RhSalaireController;
use App\Http\Controllers\Api\RH\RhStatistiqueController;
use App\Http\Controllers\Api\RH\RhExportController;
use App\Http\Middleware\MiddlewareTokenEntrepriseCreation;
use App\Http\Middleware\MiddlewareTokenAuth;
use App\Http\Middleware\MiddlewareTokenAuthorization;
use App\Http\Middleware\MiddlewareTokenAdmin;
use App\Http\Middleware\MiddlewareStockAccess;
use Illuminate\Support\Facades\Route;

// ─── Routes publiques ────────────────────────────────────────────────────────

Route::post('auth/signup/check-email',   [SignupController::class,  'checkEmail']);
Route::post('auth/signup/verify-code',   [SignupController::class,  'verifyCode']);
Route::post('auth/signup',               [SignupController::class,  'create']);

Route::post('auth/login',                [AuthController::class,    'login']);

Route::post('auth/password/send-code',   [PasswordController::class, 'sendCode']);
Route::post('auth/password/verify-code', [PasswordController::class, 'verifyCode']);
Route::post('auth/password/reset',       [PasswordController::class, 'reset']);

// â”€â”€â”€ Routes admin â”€â”€â”€

Route::post('admin/auth/login', [AdminAuthController::class, 'login']);
Route::post('admin/auth/password/send-code', [AdminAuthController::class, 'sendCode']);
Route::post('admin/auth/password/verify-code', [AdminAuthController::class, 'verifyCode']);
Route::post('admin/auth/password/reset', [AdminAuthController::class, 'reset']);

Route::middleware(MiddlewareTokenAdmin::class)->prefix('admin')->group(function () {
    // Auth
    Route::get('auth/me',     [AdminAuthController::class, 'me']);
    Route::post('auth/logout', [AdminAuthController::class, 'logout']);

    // Entreprises
    Route::get('entreprises',      [AdminEntrepriseController::class, 'index']);
    Route::post('entreprises',     [AdminEntrepriseController::class, 'store']);
    Route::get('entreprises/{id}', [AdminEntrepriseController::class, 'show']);
    Route::put('entreprises/{id}', [AdminEntrepriseController::class, 'update']);

    // Recherche utilisateur & création directeur (pour le flux création d'entreprise)
    Route::get('utilisateurs/recherche', [AdminEntrepriseController::class, 'searchUser']);
    Route::post('directeurs',            [AdminEntrepriseController::class, 'createDirecteur']);

    // Produits d'une entreprise
    Route::get('entreprises/{id}/produits',                          [AdminProduitController::class, 'index']);
    Route::post('entreprises/{id}/produits',                         [AdminProduitController::class, 'store']);
    Route::delete('entreprises/{id}/produits/{produitId}',           [AdminProduitController::class, 'destroy']);

    // Catégories d'une entreprise
    Route::get('entreprises/{id}/categories',                        [AdminCategorieController::class, 'index']);
    Route::post('entreprises/{id}/categories',                       [AdminCategorieController::class, 'store']);
    Route::delete('entreprises/{id}/categories/{categorieId}',       [AdminCategorieController::class, 'destroy']);

    // Employés d'une entreprise (check-email AVANT la route générique POST)
    Route::post('entreprises/{id}/employes/check-email',             [AdminEmployeController::class, 'checkEmail']);
    Route::get('entreprises/{id}/employes',                          [AdminEmployeController::class, 'index']);
    Route::post('entreprises/{id}/employes',                         [AdminEmployeController::class, 'store']);
    Route::patch('entreprises/{id}/employes/{uid}/role',             [AdminEmployeController::class, 'updateRole']);
    Route::delete('entreprises/{id}/employes/{uid}',                 [AdminEmployeController::class, 'destroy']);

    // Gestion des administrateurs (originel uniquement pour certaines actions)
    Route::get('admins',                                             [AdminAdminController::class, 'index']);
    Route::post('admins',                                            [AdminAdminController::class, 'store']);
    Route::post('admins/{id}/reinitialiser-mot-de-passe',           [AdminAdminController::class, 'resetPassword']);
    Route::patch('admins/{id}/desactiver',                           [AdminAdminController::class, 'disable']);

    // Paramètres du compte admin connecté
    Route::patch('parametres/email',       [AdminParametresController::class, 'changeEmail']);
    Route::patch('parametres/mot-de-passe', [AdminParametresController::class, 'changePassword']);
});

// ─── Routes protégées par tokenAuth (avant sélection du rôle) ────────────────

Route::middleware(MiddlewareTokenAuth::class)->group(function () {
    Route::get('auth/me',          [AuthController::class,    'me']);
    Route::post('auth/logout',     [AuthController::class,    'logout']);
    Route::get('user/entreprises', [EntrepriseController::class, 'userEntreprises']);
    Route::post('auth/select-role', [AuthController::class,   'selectRole']);
});

// ─── Routes protégées par tokenAuthorization (dans l'application) ────────────

Route::middleware(MiddlewareTokenAuthorization::class)->group(function () {
    Route::get('auth/me/application',      [AuthController::class, 'meApplication']);
    Route::post('auth/logout/application', [AuthController::class, 'logoutApplication']);

    Route::patch('user/parametres/email',         [UserParametresController::class, 'changeEmail']);
    Route::patch('user/parametres/mot-de-passe',  [UserParametresController::class, 'changePassword']);

    Route::get('entreprise/parametres',   [EntrepriseParametresController::class, 'show']);
    Route::patch('entreprise/parametres', [EntrepriseParametresController::class, 'update']);

    // ── Notifications (universelles — indépendantes du module) ───────────────
    Route::get('notifications',                              [NotificationController::class, 'index']);
    Route::get('notifications/unread-count',                 [NotificationController::class, 'unreadCount']);
    Route::patch('notifications/read-all',                   [NotificationController::class, 'markAllRead']);
    Route::patch('notifications/archive-all',                [NotificationController::class, 'archiveAll']);
    Route::delete('notifications/bulk',                      [NotificationController::class, 'destroyBulk']);
    Route::delete('notifications/archived',                  [NotificationController::class, 'destroyArchived']);
    Route::patch('notifications/{id}/read',                  [NotificationController::class, 'markRead']);
    Route::patch('notifications/{id}/archive',               [NotificationController::class, 'archive']);
    Route::delete('notifications/{id}',                      [NotificationController::class, 'destroy']);

    // ── Auth canal broadcast (Reverb) ────────────────────────────────────────
    Route::post('broadcasting/auth', function (\Illuminate\Http\Request $request) {
        $user = $request->attributes->get('authorizedUser');
        if (!$user) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }
        \Illuminate\Support\Facades\Auth::setUser($user);
        return \Illuminate\Support\Facades\Broadcast::auth($request);
    });
});

// ─── Route création d'entreprise ────────────────────────────────────────────

Route::post('entreprises', [EntrepriseController::class, 'store'])
    ->middleware(MiddlewareTokenEntrepriseCreation::class);

// ─── Routes protégées module gestion de stock ───────────────────────────────

Route::prefix('stock')
    ->middleware([
        MiddlewareTokenAuthorization::class,
        MiddlewareStockAccess::class,
    ])
    ->group(function () {
        
    });

Route::prefix('stock')
    ->middleware([
        MiddlewareTokenAuthorization::class,
    ])
    ->group(function () {
        Route::get('produits', [StockProduitController::class, 'index']);
        Route::post('produits', [StockProduitController::class, 'store']);
        Route::get('produits/{id}', [StockProduitController::class, 'show']);
        Route::patch('produits/{id}', [StockProduitController::class, 'update']);
        Route::delete('produits/{id}', [StockProduitController::class, 'destroy']);

        Route::get('categories', [StockCategorieController::class, 'index']);
        Route::post('categories', [StockCategorieController::class, 'store']);

        Route::get('ravitaillements', [StockRavitaillementController::class, 'index']);
        Route::post('ravitaillements', [StockRavitaillementController::class, 'store']);
        Route::patch('ravitaillements/{id}/annuler', [StockRavitaillementController::class, 'cancel']);
        Route::patch('ravitaillements/{id}/confirmer', [StockRavitaillementController::class, 'confirm']);

        Route::get('pertes', [StockPerteController::class, 'index']);
        Route::post('pertes', [StockPerteController::class, 'store']);
        Route::delete('pertes/{id}', [StockPerteController::class, 'destroy']);

        Route::get('reservations', [StockReservationController::class, 'index']);
        Route::get('reservations/{id}', [StockReservationController::class, 'show']);

        Route::get('historique', [StockHistoriqueController::class, 'index']);
        Route::get('historique/{id}', [StockHistoriqueController::class, 'show']);

        Route::get('statistiques/vue-generale', [StockStatistiqueController::class, 'vueGenerale']);
        Route::get('statistiques/produits', [StockStatistiqueController::class, 'produits']);
        Route::get('statistiques/stock', [StockStatistiqueController::class, 'stock']);
        Route::get('statistiques/ravitaillements', [StockStatistiqueController::class, 'ravitaillements']);
        Route::get('statistiques/pertes', [StockStatistiqueController::class, 'pertes']);
    });

// ─── Routes protégées module finances ───────────────────────────────────────

Route::prefix('finances')
    ->middleware(MiddlewareTokenAuthorization::class)
    ->group(function () {

        // ── Dashboard ─────────────────────────────────────────────────────────
        // Route 1
        Route::get('dashboard', [FinancesDashboardController::class, 'index']);

        // ── Commandes ─────────────────────────────────────────────────────────
        // Route 2 — liste des commandes en attente de validation Finance
        Route::get('commandes/a-valider', [FinancesCommandeController::class, 'aValider']);

        // Route 8 — liste de tous les paiements
        Route::get('paiements/export', [FinancesCommandeController::class, 'exportPaiements']);
        Route::get('paiements', [FinancesCommandeController::class, 'indexPaiements']);

        // Route 4 — liste des commandes validées non soldées
        Route::get('commandes', [FinancesCommandeController::class, 'index']);

        // Route 5 — détail d'une commande
        Route::get('commandes/{id}', [FinancesCommandeController::class, 'show']);

        // Route 3 — valider une commande brouillon
        Route::post('commandes/{id}/valider', [FinancesCommandeController::class, 'valider']);

        // Route 6 — modifier le montant minimum de validation
        Route::patch('commandes/{id}/montant-minimum', [FinancesCommandeController::class, 'updateMontantMinimum']);

        // Route 7 — enregistrer un paiement sur une commande
        Route::post('commandes/{id}/paiements', [FinancesCommandeController::class, 'storePaiement']);

        // ── Remboursements ───────────────────────────────────────────────────
        // Route 13 — export (avant route générique)
        Route::get('remboursements/export', [FinancesRemboursementController::class, 'export']);

        // Route 10 — liste des remboursements
        Route::get('remboursements', [FinancesRemboursementController::class, 'index']);

        // Route 11 — commandes remboursables
        Route::get('commandes-remboursables', [FinancesRemboursementController::class, 'commandesRemboursables']);

        // Route 12 — enregistrer un remboursement
        Route::post('remboursements', [FinancesRemboursementController::class, 'store']);

        // ── Dépenses ─────────────────────────────────────────────────────────
        // Route 16 — export (avant route générique)
        Route::get('depenses/export', [FinancesDepenseController::class, 'export']);

        // Route 14 — liste des dépenses
        Route::get('depenses', [FinancesDepenseController::class, 'index']);

        // Route 15 — enregistrer une dépense
        Route::post('depenses', [FinancesDepenseController::class, 'store']);

        // ── Entrées ──────────────────────────────────────────────────────────
        // Route 19 — export (avant route générique)
        Route::get('entrees/export', [FinancesEntreeController::class, 'export']);

        // Route 17 — liste des entrées
        Route::get('entrees', [FinancesEntreeController::class, 'index']);

        // Route 18 — enregistrer une entrée
        Route::post('entrees', [FinancesEntreeController::class, 'store']);

        // ── Abonnements ──────────────────────────────────────────────────────
        // Route 25 — export (avant route avec {id})
        Route::get('abonnements/export', [FinancesAbonnementController::class, 'export']);

        // Route 20 — liste des abonnements
        Route::get('abonnements', [FinancesAbonnementController::class, 'index']);

        // Route 22 — créer un abonnement
        Route::post('abonnements', [FinancesAbonnementController::class, 'store']);

        // Route 21 — détail d'un abonnement
        Route::get('abonnements/{id}', [FinancesAbonnementController::class, 'show']);

        // Route 23 — résilier un abonnement
        Route::post('abonnements/{id}/resilier', [FinancesAbonnementController::class, 'resilier']);

        // Route 24 — réactiver un abonnement
        Route::post('abonnements/{id}/reactiver', [FinancesAbonnementController::class, 'reactiver']);

        // ── Réapprovisionnements ─────────────────────────────────────────────
        // Route 30 — export (avant routes avec {id})
        Route::get('reapprovisionnements/export', [FinancesReapprovisionnementController::class, 'export']);

        // Route 26 — liste en attente (avant route générique)
        Route::get('reapprovisionnements/en-attente', [FinancesReapprovisionnementController::class, 'enAttente']);

        // Route 27 — historique des réapprovisionnements
        Route::get('reapprovisionnements', [FinancesReapprovisionnementController::class, 'index']);

        // Route historique des réapprovisionnements (validés ou refusés)
        Route::get('reapprovisionnements/historique', [FinancesReapprovisionnementController::class, 'historique']);

        // Route 28 — valider un réapprovisionnement
        Route::post('reapprovisionnements/{id}/valider', [FinancesReapprovisionnementController::class, 'valider']);

        // Route 29 — refuser un réapprovisionnement
        Route::post('reapprovisionnements/{id}/refuser', [FinancesReapprovisionnementController::class, 'refuser']);

        // ── Salaires ─────────────────────────────────────────────────────────
        // Route 33 — export (avant route avec {id})
        Route::get('salaires/export', [FinancesSalaireController::class, 'export']);

        // Route 31 — liste des salaires
        Route::get('salaires', [FinancesSalaireController::class, 'index']);

        // Route 34 — détail d'un salaire
        Route::get('salaires/{id}', [FinancesSalaireController::class, 'show']);

        // Route 32 — historique des paiements d'un salaire
        Route::get('salaires/{id}/paiements', [FinancesSalaireController::class, 'paiements']);

        // ── Journal financier ─────────────────────────────────────────────────
        // Route 36 — export (avant route avec {id})
        Route::get('journal/export', [FinancesJournalController::class, 'export']);

        // Route 34 — liste du journal
        Route::get('journal', [FinancesJournalController::class, 'index']);

        // Route 35 — détail d'un mouvement financier
        Route::get('journal/{id}', [FinancesJournalController::class, 'show']);

        // ── Statistiques ──────────────────────────────────────────────────────
        // Route 37 — statistiques générales
        Route::get('statistiques/general', [FinancesStatistiqueController::class, 'general']);

        // Route 38 — évolution de la trésorerie
        Route::get('statistiques/tresorerie', [FinancesStatistiqueController::class, 'tresorerie']);

        // Route 39 — statistiques thématiques détaillées
        Route::get('statistiques/autres', [FinancesStatistiqueController::class, 'autres']);
    });

// ─── Routes protégées module ventes ─────────────────────────────────────────

Route::prefix('ventes')
    ->middleware(MiddlewareTokenAuthorization::class)
    ->group(function () {

        // ── Clients ──────────────────────────────────────────────────────────
        // Route 4 — export (avant route avec {id})
        Route::get('clients/export', [VentesClientController::class, 'export']);

        // Route 1 — liste des clients
        Route::get('clients', [VentesClientController::class, 'index']);

        // Route 3 — créer un client
        Route::post('clients', [VentesClientController::class, 'store']);

        // Route 2 — détail d'un client
        Route::get('clients/{id}', [VentesClientController::class, 'show']);

        // ── Commandes ────────────────────────────────────────────────────────
        // Route 9 — export (avant route avec {id})
        Route::get('commandes/export', [VentesCommandeController::class, 'export']);

        // Route 5 — liste des commandes
        Route::get('commandes', [VentesCommandeController::class, 'index']);

        // Route 7 — créer une commande
        Route::post('commandes', [VentesCommandeController::class, 'store']);

        // Route 6 — détail d'une commande
        Route::get('commandes/{id}', [VentesCommandeController::class, 'show']);

        // Route 8 — annuler une commande
        Route::post('commandes/{id}/annuler', [VentesCommandeController::class, 'annuler']);

        // ── Produits ─────────────────────────────────────────────────────────
        // Route 10 — liste des produits actifs avec stock disponible
        Route::get('produits', [VentesProduitController::class, 'index']);

        // ── Réservations ─────────────────────────────────────────────────────
        // Route 13 — export (avant routes avec paramètres)
        Route::get('reservations/export', [VentesReservationController::class, 'export']);

        // Route 11 — liste des réservations
        Route::get('reservations', [VentesReservationController::class, 'index']);

        // Route 12 — détail d'une réservation (commande_id + produit_id)
        Route::get('reservations/{commande_id}/{produit_id}', [VentesReservationController::class, 'show']);

        // ── Statistiques ─────────────────────────────────────────────────────
        // Route 14 — KPIs généraux
        Route::get('statistiques/general', [VentesStatistiqueController::class, 'general']);

        // Route 15 — classement des clients
        Route::get('statistiques/clients', [VentesStatistiqueController::class, 'clients']);

        // Route 16 — statistiques des commandes et produits
        Route::get('statistiques/commandes', [VentesStatistiqueController::class, 'commandes']);

        // ── Notifications ────────────────────────────────────────────────────
        // Route 17 — notifications de l'utilisateur connecté
        Route::get('notifications', [VentesNotificationController::class, 'index']);
    });

// ─── Routes protégées module ressources humaines ────────────────────────────

Route::prefix('rh')
    ->middleware(MiddlewareTokenAuthorization::class)
    ->group(function () {

        // Route 1 — tableau de bord RH (KPIs, évolution, répartition)
        Route::get('dashboard', [RhDashboardController::class, 'index']);

        // Route 7 — export (avant les routes avec {id} pour éviter les conflits)
        Route::get('export', [RhExportController::class, 'export']);

        // Route 6 — statistiques RH
        Route::get('statistiques', [RhStatistiqueController::class, 'index']);

        // Route 2 — liste des employés
        Route::get('employes', [RhEmployeController::class, 'index']);

        // Route 3 — ajouter un employé
        Route::post('employes', [RhEmployeController::class, 'store']);

        // Route 5 — modifier le salaire d'un employé (avant show pour éviter le conflit)
        Route::patch('employes/{id}/salaire', [RhSalaireController::class, 'update']);

        // Route 4 — détail d'un employé
        Route::get('employes/{id}', [RhEmployeController::class, 'show']);
    });

// ─── Routes protégées module livraisons ─────────────────────────────────────

Route::prefix('livraisons')
    ->middleware(MiddlewareTokenAuthorization::class)
    ->group(function () {

        // ── Dashboard ─────────────────────────────────────────────────────────
        // Route 1 — KPIs, activité récente, graphiques
        Route::get('dashboard', [LivraisonsDashboardController::class, 'dashboard']);

        // ── Commandes à livrer ────────────────────────────────────────────────
        // Route 2 — commandes validées éligibles
        Route::get('commandes-a-livrer', [LivraisonsCommandeController::class, 'commandesALivrer']);

        // ── Historique export (avant historique pour éviter le conflit) ───────
        // Route 5 — export historique global
        Route::get('historique/export', [LivraisonsCommandeController::class, 'exportHistorique']);

        // Route 3 — toutes les livraisons de l'entreprise
        Route::get('historique', [LivraisonsCommandeController::class, 'historique']);

        // ── Livreurs ──────────────────────────────────────────────────────────
        // Route 6 — utilisateurs avec rôle employe_livreur
        Route::get('livreurs', [LivraisonsCommandeController::class, 'livreurs']);

        // ── Mes livraisons personnelles ───────────────────────────────────────
        // Route 9 — export historique personnel (avant les routes génériques)
        Route::get('mes-livraisons/historique/export', [LivraisonsPersonnelController::class, 'mesLivraisonsExport']);

        // Route 8 — historique personnel du livreur connecté
        Route::get('mes-livraisons/historique', [LivraisonsPersonnelController::class, 'mesLivraisonsHistorique']);

        // Route 7 — livraisons en cours du livreur connecté
        Route::get('mes-livraisons', [LivraisonsPersonnelController::class, 'mesLivraisons']);

        // ── Statistiques ──────────────────────────────────────────────────────
        // Route 23 — export rapport statistiques (avant routes avec segment variable)
        Route::get('statistiques/export', [LivraisonsStatistiqueController::class, 'export']);

        // Route 16 — vue générale
        Route::get('statistiques/general', [LivraisonsStatistiqueController::class, 'general']);

        // Route 17 — performance par livreur
        Route::get('statistiques/livreurs', [LivraisonsStatistiqueController::class, 'livreurs']);

        // Route 18 — activité par jour / semaine / mois
        Route::get('statistiques/activite', [LivraisonsStatistiqueController::class, 'activite']);

        // Route 19 — analyse des motifs d'échec
        Route::get('statistiques/echecs', [LivraisonsStatistiqueController::class, 'echecs']);

        // Route 20 — analyse des motifs de retour
        Route::get('statistiques/retours', [LivraisonsStatistiqueController::class, 'retours']);

        // Route 21 — volume par zone géographique
        Route::get('statistiques/geographie', [LivraisonsStatistiqueController::class, 'geographie']);

        // Route 22 — top clients par volume livré
        Route::get('statistiques/clients', [LivraisonsStatistiqueController::class, 'clients']);

        // ── Notifications ─────────────────────────────────────────────────────
        // Route 24 — notifications du rôle connecté
        Route::get('notifications', [LivraisonsNotificationController::class, 'index']);

        // ── Détail livraison (après toutes les routes statiques) ─────────────
        // Route 4 — détail complet d'une livraison
        Route::get('{id}', [LivraisonsCommandeController::class, 'show']);

        // ── Mutations ─────────────────────────────────────────────────────────
        // Route 10 — créer une livraison
        Route::post('', [LivraisonsActionController::class, 'store']);

        // Route 11 — lancer une livraison
        Route::post('{id}/lancer', [LivraisonsActionController::class, 'lancer']);

        // Route 12 — valider (confirmer) une livraison
        Route::post('{id}/valider', [LivraisonsActionController::class, 'valider']);

        // Route 13 — déclarer un échec
        Route::post('{id}/echec', [LivraisonsActionController::class, 'echec']);

        // Route 14 — déclarer un retour
        Route::post('{id}/retour', [LivraisonsActionController::class, 'retour']);

        // Route 15 — annuler une livraison non lancée
        Route::post('{id}/annuler', [LivraisonsActionController::class, 'annuler']);
    });
