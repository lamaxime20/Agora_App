<?php

namespace App\Http\Controllers\Api\Stock;

use App\Models\CategorieProduit;
use App\Models\Commande;
use App\Models\PerteProduit;
use App\Models\Produit;
use App\Models\Ravitaillement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockHistoriqueController extends StockBaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise    = $this->currentEntreprise($request);
            $page          = max(1, (int) $request->query('page', 1));
            $limit         = min(100, max(1, (int) $request->query('limit', 25)));
            $module        = $request->query('module', 'stock');
            $type          = $request->query('type');
            $utilisateurId = $request->query('utilisateur_id');
            $search        = trim((string) $request->query('search', ''));
            $sortCol       = $request->query('sortCol', 'date_action');
            $sortDir       = strtolower((string) $request->query('sortDir', 'desc')) === 'asc' ? 'asc' : 'desc';
            [$dateDebut, $dateFin] = $this->daterange($request->query('dateDebut'), $request->query('dateFin'));

            $query = DB::table('historiques as h')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'h.utilisateur')
                ->where('h.entreprise', $entreprise->id)
                ->where('h.module', $module);

            if ($type) {
                $query->where('h.action', $type);
            }

            if ($utilisateurId) {
                $query->where('h.utilisateur', $utilisateurId);
            }

            if ($dateDebut) {
                $query->where('h.date_action', '>=', $dateDebut);
            }

            if ($dateFin) {
                $query->where('h.date_action', '<=', $dateFin);
            }

            if ($search !== '') {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('h.action', 'ilike', '%' . $search . '%')
                        ->orWhere('h.details_action', 'ilike', '%' . $search . '%')
                        ->orWhere('h.ancienne_valeur', 'ilike', '%' . $search . '%')
                        ->orWhere('h.nouvelle_valeur', 'ilike', '%' . $search . '%');
                });
            }

            $total = $query->count();

            $transactions = $query->orderBy('h.' . $sortCol, $sortDir)
                ->forPage($page, $limit)
                ->select([
                    'h.id', 'h.module', 'h.table_concernee', 'h.id_element',
                    'h.action', 'h.details_action', 'h.ancienne_valeur', 'h.nouvelle_valeur',
                    'h.ip', 'h.user_agent', 'h.date_action',
                    'u.id as utilisateur_id', 'u.name as utilisateur_nom', 'u.prename as utilisateur_prenom',
                ])
                ->get()
                ->map(fn($row) => $this->historiquePayload($row))
                ->values();

            return response()->json([
                'data' => [
                    'transactions' => $transactions,
                    'total'        => $total,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'index']);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);

            $historique = DB::table('historiques as h')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'h.utilisateur')
                ->where('h.id', $id)
                ->where('h.entreprise', $entreprise->id)
                ->select([
                    'h.id', 'h.module', 'h.table_concernee', 'h.id_element',
                    'h.action', 'h.details_action', 'h.ancienne_valeur', 'h.nouvelle_valeur',
                    'h.ip', 'h.user_agent', 'h.date_action',
                    'u.id as utilisateur_id', 'u.name as utilisateur_nom', 'u.prename as utilisateur_prenom',
                ])
                ->first();

            if (!$historique) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Entrée d\'historique introuvable.',
                ], 404);
            }

            return response()->json([
                'data' => [
                    'transaction' => [
                        'historique' => $this->historiquePayload($historique),
                        'element'    => $this->resolveLinkedEntity($historique),
                    ],
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'show', 'id' => $id]);
        }
    }

    private function historiquePayload(object $historique): array
    {
        return [
            'id'              => $historique->id,
            'module'          => $historique->module,
            'table_concernee' => $historique->table_concernee,
            'id_element'      => $historique->id_element,
            'action'          => $historique->action,
            'details_action'  => $historique->details_action,
            'ancienne_valeur' => $historique->ancienne_valeur,
            'nouvelle_valeur' => $historique->nouvelle_valeur,
            'ip'              => $historique->ip,
            'user_agent'      => $historique->user_agent,
            'date_action'     => $historique->date_action,
            'utilisateur'     => $historique->utilisateur_id ? [
                'id'    => $historique->utilisateur_id,
                'nom'   => $historique->utilisateur_nom,
                'prenom'=> $historique->utilisateur_prenom,
            ] : null,
        ];
    }

    private function resolveLinkedEntity(object $historique): mixed
    {
        return match ($historique->table_concernee) {
            'produits'          => Produit::with('categorie')->find($historique->id_element),
            'categories_produit'=> CategorieProduit::find($historique->id_element),
            'ravitaillements'   => Ravitaillement::with('produit')->find($historique->id_element),
            'pertes_produits'   => PerteProduit::with('produit')->find($historique->id_element),
            'commandes'         => Commande::with(['client', 'lignes.produit', 'livraisons'])->find($historique->id_element),
            default             => null,
        };
    }
}
