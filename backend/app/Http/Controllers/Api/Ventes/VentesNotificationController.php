<?php

namespace App\Http\Controllers\Api\Ventes;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentesNotificationController extends VentesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 17 — GET /api/ventes/notifications
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Notifications de l'utilisateur connecté pour son rôle dans l'entreprise.
     * Retourne les 50 plus récentes (non archivées), avec le compte des non-lues.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user         = $this->currentUser($request);
            $entreprise   = $this->currentEntreprise($request);
            $roleId       = $this->currentRoleId($request);
            $entrepriseId = $entreprise->id;

            $nonLues = DB::table('notifications')
                ->where('utilisateur', $user->id)
                ->where('entreprise', $entrepriseId)
                ->where('role', $roleId)
                ->where('actif', true)
                ->where('statut', 'non_lue')
                ->count();

            $notifications = DB::table('notifications')
                ->where('utilisateur', $user->id)
                ->where('entreprise', $entrepriseId)
                ->where('role', $roleId)
                ->where('actif', true)
                ->where('statut', '!=', 'archivee')
                ->orderBy('date_arrivee', 'desc')
                ->limit(50)
                ->select(['id', 'titre', 'message', 'statut', 'type_notification', 'date_arrivee'])
                ->get()
                ->map(fn($row) => [
                    'id'                => $row->id,
                    'titre'             => $row->titre,
                    'message'           => $row->message,
                    'statut'            => $row->statut,
                    'type_notification' => $row->type_notification,
                    'date_arrivee'      => $row->date_arrivee,
                ]);

            return response()->json([
                'non_lues'     => $nonLues,
                'notifications'=> $notifications,
            ], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__);
        }
    }
}
