<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EntrepriseController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\SignupController;
use App\Http\Middleware\MiddlewareTokenEntrepriseCreation;
use App\Http\Middleware\MiddlewareTokenAuth;
use App\Http\Middleware\MiddlewareTokenAuthorization;
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
