<?php

namespace App\Http\Controllers\Api\Stock;

use App\Models\CategorieProduit;
use App\Models\Commande;
use App\Models\Historique;
use App\Models\PerteProduit;
use App\Models\Produit;
use App\Models\Ravitaillement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockHistoriqueController extends StockBaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 25)));
        $module = $request->query('module', 'stock');
        $type = $request->query('type');
        $produitId = $request->query('produit_id');
        $categorieId = $request->query('categorie');
        $utilisateurId = $request->query('utilisateur_id');
        $search = trim((string) $request->query('search', ''));
        $sortCol = $request->query('sortCol', 'date_action');
        $sortDir = strtolower((string) $request->query('sortDir', 'desc')) === 'asc' ? 'asc' : 'desc';
        [$dateDebut, $dateFin] = $this->daterange($request->query('dateDebut'), $request->query('dateFin'));

        $query = Historique::with(['utilisateur', 'entreprise'])
            ->where('entreprise', $entreprise->id)
            ->where('module', $module);

        if ($type) {
            $query->where('action', $type);
        }

        if ($utilisateurId) {
            $query->where('utilisateur', $utilisateurId);
        }

        if ($dateDebut) {
            $query->where('date_action', '>=', $dateDebut);
        }

        if ($dateFin) {
            $query->where('date_action', '<=', $dateFin);
        }

        if ($search !== '') {
            $query->where(function ($subQuery) use ($search) {
                $subQuery->where('action', 'ilike', '%' . $search . '%')
                    ->orWhere('details_action', 'ilike', '%' . $search . '%')
                    ->orWhere('ancienne_valeur', 'ilike', '%' . $search . '%')
                    ->orWhere('nouvelle_valeur', 'ilike', '%' . $search . '%');
            });
        }

        $total = $query->count();
        $transactions = $query->orderBy($sortCol, $sortDir)
            ->forPage($page, $limit)
            ->get()
            ->map(fn(Historique $historique) => $this->historiquePayload($historique))
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

        $historique = Historique::with(['utilisateur', 'entreprise'])
            ->where('id', $id)
            ->where('entreprise', $entreprise->id)
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

    private function historiquePayload(Historique $historique): array
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
            'utilisateur'     => $historique->utilisateur ? [
                'id'     => $historique->utilisateur->id,
                'nom'    => $historique->utilisateur->name,
                'prenom' => $historique->utilisateur->prename,
            ] : null,
        ];
    }

    private function resolveLinkedEntity(Historique $historique): mixed
    {
        return match ($historique->table_concernee) {
            'produits' => Produit::with('categorie')->find($historique->id_element),
            'categories_produit' => CategorieProduit::find($historique->id_element),
            'ravitaillements' => Ravitaillement::with('produit')->find($historique->id_element),
            'pertes_produits' => PerteProduit::with('produit')->find($historique->id_element),
            'commandes' => Commande::with(['client', 'lignes.produit', 'livraisons'])->find($historique->id_element),
            default => null,
        };
    }
}
