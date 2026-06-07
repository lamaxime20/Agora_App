<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MiddlewareStockAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $role = $request->attributes->get('currentRole');
        $roleName = is_object($role) && property_exists($role, 'role') ? (string) $role->role : '';

        $allowedRoles = [
            'directeur',
            'manager_gestion_stock',
            'employe_gestion_stock',
        ];

        if (!in_array(mb_strtolower(trim($roleName)), $allowedRoles, true)) {
            return response()->json([
                'ok'      => false,
                'code'    => 'FORBIDDEN',
                'message' => 'Vous n\'êtes pas autorisé à accéder au module gestion de stock.',
            ], 403);
        }

        return $next($request);
    }
}
