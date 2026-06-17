<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\TokenAdmin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MiddlewareTokenAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('tokenAdmin');

        if (!$token) {
            return $this->unauthorized();
        }

        $record = TokenAdmin::where('token', $token)
            ->where('validite', true)
            ->where('date_expiration', '>', now())
            ->first();

        if (!$record) {
            return $this->unauthorized();
        }

        $admin = Admin::where('id', $record->admin)
            ->where('statut', 'actif')
            ->first();

        if (!$admin) {
            return $this->unauthorized();
        }

        $request->attributes->set('authAdmin', $admin);
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
