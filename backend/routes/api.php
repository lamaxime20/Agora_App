<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EntrepriseController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\Stock\StockCategorieController;
use App\Http\Controllers\Api\Stock\StockHistoriqueController;
use App\Http\Controllers\Api\Stock\StockPerteController;
use App\Http\Controllers\Api\Stock\StockProduitController;
use App\Http\Controllers\Api\Stock\StockRavitaillementController;
use App\Http\Controllers\Api\Stock\StockReservationController;
use App\Http\Controllers\Api\Stock\StockStatistiqueController;
use App\Http\Controllers\Api\SignupController;
use App\Http\Middleware\MiddlewareTokenEntrepriseCreation;
use App\Http\Middleware\MiddlewareTokenAuth;
use App\Http\Middleware\MiddlewareTokenAuthorization;
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
