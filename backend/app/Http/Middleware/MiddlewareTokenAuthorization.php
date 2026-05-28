<?php

namespace App\Http\Middleware;

use App\Models\Entreprise;
use App\Models\RoleUtilisateur;
use App\Models\SessionApp;
use App\Models\Utilisateur;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MiddlewareTokenAuthorization
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('tokenAuthorization');

        if (!$token) {
            return $this->unauthorized();
        }

        $session = SessionApp::where('token', $token)
            ->where('validite', true)
            ->where('date_expiration', '>', now())
            ->first();

        if (!$session) {
            return $this->unauthorized();
        }

        $user = Utilisateur::where('id', $session->utilisateur)
            ->where('statut', 'actif')
            ->first();

        $entreprise = Entreprise::where('id', $session->entreprise)
            ->where('statut', 'actif')
            ->first();

        $role = RoleUtilisateur::find($session->role);

        if (!$user || !$entreprise || !$role) {
            return $this->unauthorized();
        }

        $request->attributes->set('authorizedUser', $user);
        $request->attributes->set('currentSession', $session);
        $request->attributes->set('currentEntreprise', $entreprise);
        $request->attributes->set('currentRole', $role);

        return $next($request);
    }

    private function unauthorized(): Response
    {
        return response()->json([
            'ok'      => false,
            'code'    => 'UNAUTHORIZED',
            'message' => 'Session invalide ou expirée.',
        ], 401);
    }
}
