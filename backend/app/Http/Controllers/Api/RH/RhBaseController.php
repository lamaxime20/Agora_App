<?php

namespace App\Http\Controllers\Api\RH;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use App\Models\Historique;
use App\Models\Utilisateur;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

abstract class RhBaseController extends Controller
{
    // ─── Couleurs et labels des rôles ────────────────────────────────────────────

    protected function roleMeta(): array
    {
        return [
            'manager_rh'            => ['label' => 'Manager RH',         'couleur' => '#9B59B6'],
            'employe_rh'            => ['label' => 'Employé RH',          'couleur' => '#D7BDE2'],
            'manager_finances'      => ['label' => 'Manager Finances',    'couleur' => '#27AE60'],
            'employe_finances'      => ['label' => 'Employé Finances',    'couleur' => '#A9DFBF'],
            'manager_vente'         => ['label' => 'Manager Vente',       'couleur' => '#F39C12'],
            'employe_vente'         => ['label' => 'Employé Vente',       'couleur' => '#FAD7A0'],
            'manager_gestion_stock' => ['label' => 'Manager Stock',       'couleur' => '#2C3E50'],
            'employe_gestion_stock' => ['label' => 'Employé Stock',       'couleur' => '#85929E'],
        ];
    }

    // ─── Helpers contexte ────────────────────────────────────────────────────────

    protected function currentUser(Request $request): Utilisateur
    {
        /** @var Utilisateur $user */
        return $request->attributes->get('authorizedUser');
    }

    protected function currentEntreprise(Request $request): Entreprise
    {
        /** @var Entreprise $entreprise */
        return $request->attributes->get('currentEntreprise');
    }

    protected function currentRoleId(Request $request): string
    {
        return (string) $request->attributes->get('currentRole')?->id;
    }

    // ─── Historique ──────────────────────────────────────────────────────────────

    protected function history(
        string $idElement,
        string $action,
        Request $request,
        string $utilisateurId,
        string $entrepriseId,
        ?string $details = null,
        ?string $ancienneValeur = null,
        ?string $nouvelleValeur = null
    ): void {
        Historique::create([
            'module'          => 'rh',
            'table_concernee' => 'appartenir_entreprise',
            'id_element'      => $idElement,
            'action'          => $action,
            'details_action'  => $details,
            'ancienne_valeur' => $ancienneValeur,
            'nouvelle_valeur' => $nouvelleValeur,
            'ip'              => $request->ip(),
            'user_agent'      => $request->userAgent(),
            'date_action'     => now(),
            'utilisateur'     => $utilisateurId,
            'entreprise'      => $entrepriseId,
        ]);
    }

    // ─── Plage de dates ──────────────────────────────────────────────────────────

    protected function daterange(?string $start, ?string $end): array
    {
        $from = $start ? Carbon::parse($start)->startOfDay() : null;
        $to   = $end   ? Carbon::parse($end)->endOfDay()     : null;
        return [$from, $to];
    }

    // ─── Gestion d'erreur ────────────────────────────────────────────────────────

    protected function rhErrorResponse(\Throwable $e, Request $request, string $method, array $context = []): JsonResponse
    {
        $payload = array_merge([
            'method'        => $method,
            'url'           => $request->fullUrl(),
            'user_id'       => $request->attributes->get('authorizedUser')?->id ?? null,
            'entreprise_id' => $request->attributes->get('currentEntreprise')?->id ?? null,
        ], $context);

        Log::error('Erreur module RH', [
            'message'   => $e->getMessage(),
            'exception' => get_class($e),
            'file'      => $e->getFile(),
            'line'      => $e->getLine(),
            'trace'     => collect($e->getTrace())->take(10)->toArray(),
            'context'   => $payload,
        ]);

        report($e);

        return response()->json([
            'ok'      => false,
            'code'    => 'RH_INTERNAL_ERROR',
            'message' => 'Une erreur est survenue côté serveur.',
        ], 500);
    }
}
