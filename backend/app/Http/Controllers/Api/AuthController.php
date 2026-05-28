<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppartenirEntreprise;
use App\Models\Entreprise;
use App\Models\RoleUtilisateur;
use App\Models\SessionApp;
use App\Models\TokenChoixRole;
use App\Models\Utilisateur;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    // POST /api/auth/login
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string',
        ], [
            'email.required'    => 'L\'adresse e-mail est requise.',
            'email.email'       => 'Adresse e-mail invalide.',
            'password.required' => 'Le mot de passe est requis.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'      => false,
                'code'    => 'INVALID_CREDENTIALS',
                'message' => 'Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.',
            ], 422);
        }

        $user = Utilisateur::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'ok'      => false,
                'code'    => 'INVALID_CREDENTIALS',
                'message' => 'Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.',
            ], 422);
        }

        if ($user->statut === 'archive') {
            return response()->json([
                'ok'      => false,
                'code'    => 'ACCOUNT_ARCHIVED',
                'message' => 'Ce compte est désactivé. Contactez votre administrateur.',
            ], 403);
        }

        if (!Hash::check($request->password, $user->password_hash)) {
            return response()->json([
                'ok'      => false,
                'code'    => 'INVALID_CREDENTIALS',
                'message' => 'Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.',
            ], 422);
        }

        try {
            $ttlMinutes = (int) env('TOKEN_AUTH_TTL_HOURS', 24) * 60;
            $tokenValue = bin2hex(random_bytes(40));
            $expiration = now()->addMinutes($ttlMinutes);

            TokenChoixRole::where('utilisateur', $user->id)
                ->where('validite', true)
                ->update(['validite' => false]);

            TokenChoixRole::create([
                'token'           => $tokenValue,
                'utilisateur'     => $user->id,
                'validite'        => true,
                'date_creation'   => now(),
                'date_expiration' => $expiration,
            ]);

            $cookie = cookie(
                'tokenAuth',
                $tokenValue,
                $ttlMinutes,
                '/',
                null,
                $request->secure(),
                true,
                false,
                'lax'
            );

            return response()->json([
                'ok'      => true,
                'message' => 'Connexion réussie.',
                'user'    => [
                    'email'      => $user->email,
                    'nom'        => $user->name,
                    'prenom'     => $user->prename,
                    'expires_at' => $expiration->toIso8601String(),
                ],
            ], 200)->withCookie($cookie);
        } catch (\Throwable $e) {
            Log::error('AuthController@login error', ['message' => $e->getMessage()]);
            return response()->json([
                'ok'      => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Une erreur est survenue. Réessayez.',
            ], 500);
        }
    }

    // GET /api/auth/me — protégé MiddlewareTokenAuth
    public function me(Request $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user  = $request->attributes->get('authUser');
        /** @var TokenChoixRole $token */
        $token = $request->attributes->get('authToken');

        return response()->json([
            'ok'   => true,
            'user' => [
                'email'      => $user->email,
                'nom'        => $user->name,
                'prenom'     => $user->prename,
                'expires_at' => Carbon::parse($token->date_expiration)->toIso8601String(),
            ],
        ], 200);
    }

    // POST /api/auth/logout — protégé MiddlewareTokenAuth
    public function logout(Request $request): JsonResponse
    {
        /** @var TokenChoixRole $token */
        $token = $request->attributes->get('authToken');

        $updated = TokenChoixRole::where('id', $token->id)
            ->update(['validite' => false]);

        if (!$updated) {
            return response()->json([
                'ok'      => false,
                'code'    => 'LOGOUT_FAILED',
                'message' => 'Déconnexion impossible, vérifiez votre connexion.',
            ], 500);
        }

        $expiredCookie = cookie('tokenAuth', '', -1, '/', null, $request->secure(), true, false, 'lax');

        return response()->json([
            'ok'      => true,
            'message' => 'Déconnecté.',
        ], 200)->withCookie($expiredCookie);
    }

    // POST /api/auth/select-role — protégé MiddlewareTokenAuth
    public function selectRole(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'entreprise_id' => 'required|uuid',
            'role_id'       => 'required|uuid',
        ], [
            'entreprise_id.required' => 'L\'entreprise est requise.',
            'role_id.required'       => 'Le rôle est requis.',
            'entreprise_id.uuid'     => 'Identifiant d\'entreprise invalide.',
            'role_id.uuid'           => 'Identifiant de rôle invalide.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'     => false,
                'code'   => 'VALIDATION_ERROR',
                'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        /** @var Utilisateur $user */
        $user      = $request->attributes->get('authUser');
        /** @var TokenChoixRole $authToken */
        $authToken = $request->attributes->get('authToken');

        $appartenance = AppartenirEntreprise::where('utilisateur_id', $user->id)
            ->where('entreprise_id', $request->entreprise_id)
            ->where('role_utilisateur_id', $request->role_id)
            ->where('statut', 'actif')
            ->first();

        if (!$appartenance) {
            return response()->json([
                'ok'      => false,
                'code'    => 'ROLE_NOT_ALLOWED',
                'message' => 'Vous n\'avez pas accès à ce rôle dans cette entreprise.',
            ], 403);
        }

        $entreprise = Entreprise::where('id', $request->entreprise_id)
            ->where('statut', 'actif')
            ->first();

        if (!$entreprise) {
            return response()->json([
                'ok'      => false,
                'code'    => 'ROLE_NOT_ALLOWED',
                'message' => 'Vous n\'avez pas accès à ce rôle dans cette entreprise.',
            ], 403);
        }

        try {
            $ttlMinutes = (int) env('TOKEN_AUTHORIZATION_TTL_HOURS', 8) * 60;
            $tokenValue = bin2hex(random_bytes(40));
            $expiration = now()->addMinutes($ttlMinutes);

            TokenChoixRole::where('id', $authToken->id)
                ->update(['validite' => false]);

            SessionApp::create([
                'token'           => $tokenValue,
                'role'            => $request->role_id,
                'entreprise'      => $request->entreprise_id,
                'utilisateur'     => $user->id,
                'validite'        => true,
                'date_creation'   => now(),
                'date_expiration' => $expiration,
            ]);

            $roleName = RoleUtilisateur::find($request->role_id)?->role ?? '';

            $expiredAuthCookie = cookie('tokenAuth', '', -1, '/', null, $request->secure(), true, false, 'lax');

            $authorizationCookie = cookie(
                'tokenAuthorization',
                $tokenValue,
                $ttlMinutes,
                '/',
                null,
                $request->secure(),
                true,
                false,
                'lax'
            );

            return response()->json([
                'ok'      => true,
                'message' => 'Rôle sélectionné avec succès.',
                'user'    => [
                    'email'      => $user->email,
                    'nom'        => $user->name,
                    'prenom'     => $user->prename,
                    'expires_at' => $expiration->toIso8601String(),
                    'entreprise' => [
                        'id'  => $entreprise->id,
                        'nom' => $entreprise->nom,
                    ],
                    'role' => $roleName,
                ],
            ], 200)
                ->withCookie($expiredAuthCookie)
                ->withCookie($authorizationCookie);
        } catch (\Throwable $e) {
            Log::error('AuthController@selectRole error', ['message' => $e->getMessage()]);
            return response()->json([
                'ok'      => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Impossible de valider la sélection. Réessayez.',
            ], 500);
        }
    }

    // GET /api/auth/me/application — protégé MiddlewareTokenAuthorization
    public function meApplication(Request $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user       = $request->attributes->get('authorizedUser');
        /** @var SessionApp $session */
        $session    = $request->attributes->get('currentSession');
        /** @var Entreprise $entreprise */
        $entreprise = $request->attributes->get('currentEntreprise');
        /** @var RoleUtilisateur $role */
        $role       = $request->attributes->get('currentRole');

        return response()->json([
            'ok'   => true,
            'user' => [
                'email'      => $user->email,
                'nom'        => $user->name,
                'prenom'     => $user->prename,
                'expires_at' => Carbon::parse($session->date_expiration)->toIso8601String(),
                'entreprise' => [
                    'id'  => $entreprise->id,
                    'nom' => $entreprise->nom,
                ],
                'role' => $role->role,
            ],
        ], 200);
    }

    // POST /api/auth/logout/application — protégé MiddlewareTokenAuthorization
    public function logoutApplication(Request $request): JsonResponse
    {
        /** @var SessionApp $session */
        $session = $request->attributes->get('currentSession');

        $updated = SessionApp::where('id', $session->id)
            ->update(['validite' => false]);

        if (!$updated) {
            return response()->json([
                'ok'      => false,
                'code'    => 'LOGOUT_FAILED',
                'message' => 'Déconnexion impossible, vérifiez votre connexion.',
            ], 500);
        }

        $expiredCookie = cookie('tokenAuthorization', '', -1, '/', null, $request->secure(), true, false, 'lax');

        return response()->json([
            'ok'      => true,
            'message' => 'Déconnecté.',
        ], 200)->withCookie($expiredCookie);
    }
}
