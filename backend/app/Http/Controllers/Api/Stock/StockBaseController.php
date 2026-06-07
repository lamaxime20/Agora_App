<?php

namespace App\Http\Controllers\Api\Stock;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use App\Models\Historique;
use App\Models\Utilisateur;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

abstract class StockBaseController extends Controller
{
    protected function stockErrorResponse(\Throwable $e, Request $request, string $method, array $context = []): JsonResponse
    {
        $payload = array_merge([
            'method' => $method,
            'url' => $request->fullUrl(),
            'user_id' => $request->attributes->get('authorizedUser')?->id
                ?? $request->attributes->get('authUser')?->id
                ?? null,
            'entreprise_id' => $request->attributes->get('currentEntreprise')?->id ?? null,
        ], $context);

        Log::error('Erreur module stock', [
            'message' => $e->getMessage(),
            'exception' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => collect($e->getTrace())->take(10)->toArray(),
            'context' => $payload,
        ]);

        report($e);

        return response()->json([
            'ok' => false,
            'code' => 'STOCK_INTERNAL_ERROR',
            'message' => 'Une erreur est survenue côté serveur.',
        ], 500);
    }

    protected function currentUser(Request $request): Utilisateur
    {
        /** @var Utilisateur $user */
        $user = $request->attributes->get('authorizedUser') ?? $request->attributes->get('authUser');

        return $user;
    }

    protected function currentEntreprise(Request $request): Entreprise
    {
        /** @var Entreprise $entreprise */
        $entreprise = $request->attributes->get('currentEntreprise');

        return $entreprise;
    }

    protected function currentRoleName(Request $request): string
    {
        $role = $request->attributes->get('currentRole');

        return is_object($role) && property_exists($role, 'role')
            ? (string) $role->role
            : '';
    }

    protected function reservedQuantitiesByProduct(string $entrepriseId): array
    {
        $rows = DB::table('commandes as c')
            ->join('contenir_produit as cp', 'cp.commande_id', '=', 'c.id')
            ->leftJoin('livraisons as l', function ($join) {
                $join->on('l.commande', '=', 'c.id')
                    ->where('l.statut', '=', 'livree');
            })
            ->where('c.entreprise', $entrepriseId)
            ->where('c.statut', 'validee')
            ->whereNull('l.id')
            ->groupBy('cp.produit_id')
            ->selectRaw('cp.produit_id, COALESCE(SUM(cp.quantite), 0) as reserved_quantity')
            ->get();

        $map = [];

        foreach ($rows as $row) {
            $map[$row->produit_id] = (float) $row->reserved_quantity;
        }

        return $map;
    }

    protected function stockDisponible(object $produit, array $reservedMap): float
    {
        if ($produit->type_produit === 'service') {
            return 0.0;
        }

        $reserved = (float) Arr::get($reservedMap, $produit->id, 0);

        return max(0, (float) $produit->stock_actuel - $reserved);
    }

    protected function availabilityLabel(object $produit, float $stockDisponible): string
    {
        if ($produit->type_produit === 'service') {
            return 'service';
        }

        if ($stockDisponible <= 0) {
            return 'rupture de stock';
        }

        if ($stockDisponible <= (float) $produit->seuil_alerte) {
            return 'indisponible';
        }

        return 'en stock';
    }

    protected function history(array $attributes): void
    {
        Historique::create($attributes);
    }

    protected function productHistoryPayload(
        string $action,
        string $tableConcernee,
        string $elementId,
        ?string $details = null,
        ?string $ancienneValeur = null,
        ?string $nouvelleValeur = null,
        ?Request $request = null,
        ?Utilisateur $user = null,
        ?string $entrepriseId = null
    ): array {
        $request ??= request();
        $user ??= $this->currentUser($request);
        $entrepriseId ??= $this->currentEntreprise($request)->id;

        return [
            'module'          => 'stock',
            'table_concernee' => $tableConcernee,
            'id_element'      => $elementId,
            'action'          => $action,
            'details_action'  => $details,
            'ancienne_valeur' => $ancienneValeur,
            'nouvelle_valeur' => $nouvelleValeur,
            'ip'              => $request?->ip(),
            'user_agent'      => $request?->userAgent(),
            'date_action'     => now(),
            'utilisateur'     => $user->id,
            'entreprise'      => $entrepriseId,
        ];
    }

    protected function daterange(?string $start, ?string $end): array
    {
        $from = $start ? Carbon::parse($start)->startOfDay() : null;
        $to = $end ? Carbon::parse($end)->endOfDay() : null;

        return [$from, $to];
    }
}
