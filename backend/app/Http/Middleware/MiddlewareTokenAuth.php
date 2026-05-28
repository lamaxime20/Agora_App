<?php

namespace App\Http\Middleware;

use App\Models\TokenChoixRole;
use App\Models\Utilisateur;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MiddlewareTokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('tokenAuth');

        if (!$token) {
            return $this->unauthorized();
        }

        $record = TokenChoixRole::where('token', $token)
            ->where('validite', true)
            ->where('date_expiration', '>', now())
            ->first();

        if (!$record) {
            return $this->unauthorized();
        }

        $user = Utilisateur::where('id', $record->utilisateur)
            ->where('statut', 'actif')
            ->first();

        if (!$user) {
            return $this->unauthorized();
        }

        $request->attributes->set('authUser', $user);
        $request->attributes->set('authToken', $record);

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
