<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\BonCommandeController;
use App\Http\Controllers\BonLivraisonController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\ProformaController;
use App\Http\Controllers\LigneProformaController;
use App\Http\Controllers\DossierController;
use App\Http\Controllers\DocumentFournisseurController;
use App\Http\Controllers\FournisseurController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VisiteClientController;
use App\Http\Controllers\ChiffreAffairesController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [UserController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('users', UserController::class); 
    Route::apiResource('proformas', ProformaController::class);
    Route::apiResource('ligne_proformas', LigneProformaController::class);
    Route::apiResource('clients', ClientController::class);
    Route::apiResource('bon_commandes', BonCommandeController::class);

    Route::get('/turnover/client/{clientId}', [ChiffreAffairesController::class, 'turnoverByClient']);
    Route::get('/turnover/commercial/{commercialId}', [ChiffreAffairesController::class, 'turnoverByCommercial']);
    Route::get('/turnover/dossier/{dossierId}', [ChiffreAffairesController::class, 'turnoverByDossier']);
    Route::get('/dossiers/count/client/{clientId}', [DossierController::class, 'countByClient']);
    Route::get('/clients/commercial/{commercialId}', [ClientController::class, 'listByCommercial']);
    Route::get('/dossiers/commercial/{commercialId}', [DossierController::class, 'listByCommercial']);

    // Routes personnalisées pour Proforma
    Route::get('/proformas/dossier/{dossierId}', [ProformaController::class, 'checkProformaByDossier']);
    Route::get('/proformas/{id}/generatePdf', [ProformaController::class, 'generatePdf']);
    Route::get('/proformas/{id}/exportExcel', [ProformaController::class, 'exportExcel']);

    Route::get('/bon_commandes/{id}/generatePdf', [BonCommandeController::class, 'generatePdf']);
    Route::get('/bon_commandes/{id}/download', [BonCommandeController::class, 'download']);
    Route::get('/bon_commandes/dossier/{dossierId}', [BonCommandeController::class, 'getByDossier']);
});




Route::apiResource('bon_livraisons', BonLivraisonController::class);
Route::apiResource('factures', FactureController::class);
Route::apiResource('dossiers', DossierController::class);
Route::apiResource('document_fournisseurs', DocumentFournisseurController::class);
Route::apiResource('fournisseurs', FournisseurController::class);
//Route::apiResource('users', UserController::class);
Route::apiResource('visite_clients', VisiteClientController::class);
