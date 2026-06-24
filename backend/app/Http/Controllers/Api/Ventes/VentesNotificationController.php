<?php

namespace App\Http\Controllers\Api\Ventes;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentesNotificationController extends VentesBaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $user         = $this->currentUser($request);
            $entreprise   = $this->currentEntreprise($request);
            $roleId       = $this->currentRoleId($request);
            $entrepriseId = $entreprise->id;

            $nonLues = DB::table('notifications')
                ->where('user_id', $user->id)
                ->where('company_id', $entrepriseId)
                ->where('role_id', $roleId)
                ->whereNull('archived_at')
                ->whereNull('read_at')
                ->count();

            $notifications = DB::table('notifications')
                ->where('user_id', $user->id)
                ->where('company_id', $entrepriseId)
                ->where('role_id', $roleId)
                ->whereNull('archived_at')
                ->orderByDesc('created_at')
                ->limit(50)
                ->select(['id', 'title', 'message', 'type', 'priority', 'read_at', 'created_at', 'data'])
                ->get()
                ->map(fn($row) => [
                    'id'         => $row->id,
                    'title'      => $row->title,
                    'message'    => $row->message,
                    'type'       => $row->type,
                    'priority'   => $row->priority,
                    'is_read'    => $row->read_at !== null,
                    'created_at' => $row->created_at,
                    'data'       => json_decode($row->data, true),
                ]);

            return response()->json([
                'non_lues'      => $nonLues,
                'notifications' => $notifications,
            ], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__);
        }
    }
}
