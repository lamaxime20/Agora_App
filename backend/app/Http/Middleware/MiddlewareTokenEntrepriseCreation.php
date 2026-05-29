<?php

namespace App\Http\Middleware;

use App\Models\SessionApp;
use App\Models\TokenChoixRole;
use App\Models\Utilisateur;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MiddlewareTokenEntrepriseCreation
{
    public function handle(Request $request, Closure $next): Response
    {
        $authorizationToken = $request->cookie('tokenAuthorization');

        if ($authorizationToken) {
            $session = SessionApp::where('token', $authorizationToken)
                ->where('validite', true)
                ->where('date_expiration', '>', now())
                ->first();

            if ($session) {
                $user = Utilisateur::where('id', $session->utilisateur)
                    ->where('statut', 'actif')
                    ->first();

                if ($user) {
                    $request->attributes->set('authUser', $user);
                    $request->attributes->set('authToken', $session);
                    $request->attributes->set('authCookieName', 'tokenAuthorization');

                    return $next($request);
                }
            }
        }

        $authToken = $request->cookie('tokenAuth');

        if ($authToken) {
            $tokenRecord = TokenChoixRole::where('token', $authToken)
                ->where('validite', true)
                ->where('date_expiration', '>', now())
                ->first();

            if ($tokenRecord) {
                $user = Utilisateur::where('id', $tokenRecord->utilisateur)
                    ->where('statut', 'actif')
                    ->first();

                if ($user) {
                    $request->attributes->set('authUser', $user);
                    $request->attributes->set('authToken', $tokenRecord);
                    $request->attributes->set('authCookieName', 'tokenAuth');

                    return $next($request);
                }
            }
        }

        return $this->unauthorized();
    }

    private function unauthorized(): Response
    {
        return response()->json([
            'success' => false,
            'code'    => 'UNAUTHORIZED',
            'message' => 'Session expirée. Veuillez vous reconnecter.',
        ], 401);
    }
}
