<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EntrepriseController extends Controller
{
    // GET /api/user/entreprises — protégé MiddlewareTokenAuth
    public function userEntreprises(Request $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $request->attributes->get('authUser');

        $rows = DB::table('appartenir_entreprise as ae')
            ->join('entreprises as e', 'ae.entreprise_id', '=', 'e.id')
            ->leftJoin('codes_couleurs as cc', 'cc.entreprise', '=', 'e.id')
            ->join('roles_utilisateur as ru', 'ae.role_utilisateur_id', '=', 'ru.id')
            ->where('ae.utilisateur_id', $user->id)
            ->where('ae.statut', 'actif')
            ->where('e.statut', 'actif')
            ->orderBy('e.nom')
            ->orderBy('ru.role')
            ->select([
                'e.id',
                'e.nom',
                'e.logo',
                'e.statut',
                'cc.couleur_primaire',
                'cc.couleur_secondaire',
                'cc.couleur_tertiaire',
                'ru.id as role_id',
                'ru.role as role_nom',
                'ru.description as role_description',
            ])
            ->get();

        $entreprisesMap = [];

        foreach ($rows as $row) {
            if (!isset($entreprisesMap[$row->id])) {
                $entreprisesMap[$row->id] = [
                    'id'                 => $row->id,
                    'nom'                => $row->nom,
                    'logo'               => $row->logo,
                    'couleur_primaire'   => $row->couleur_primaire   ?? '#FFF',
                    'couleur_secondaire' => $row->couleur_secondaire ?? '#000',
                    'couleur_tertiaire'  => $row->couleur_tertiaire  ?? '#F0F0F0',
                    'statut'             => $row->statut,
                    'roles'              => [],
                ];
            }

            $entreprisesMap[$row->id]['roles'][] = [
                'id'          => $row->role_id,
                'nom'         => $row->role_nom,
                'description' => $row->role_description,
                'icone'       => $this->getRoleIcon($row->role_nom),
            ];
        }

        return response()->json([
            'ok'          => true,
            'entreprises' => array_values($entreprisesMap),
        ], 200);
    }

    private function getRoleIcon(string $roleName): string
    {
        $map = [
            'directeur'                => 'Crown',
            'manager_gestion_stock'    => 'Package',
            'employe_gestion_stock'    => 'Package',
            'manager_vente'            => 'LayoutDashboard',
            'employe_vente'            => 'ShoppingCart',
            'manager_finances'         => 'Wallet',
            'employe_finances'         => 'Calculator',
        ];

        return $map[mb_strtolower(trim($roleName))] ?? 'CircleUserRound';
    }
}
