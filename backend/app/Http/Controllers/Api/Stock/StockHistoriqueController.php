<?php

namespace App\Http\Controllers\Api\Stock;

use App\Models\CategorieProduit;
use App\Models\Commande;
use App\Models\PerteProduit;
use App\Models\Produit;
use App\Models\Ravitaillement;
use App\Services\ExportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

    public function export(Request $request): Response|StreamedResponse
    {
        $entreprise = $this->currentEntreprise($request);
        $format     = strtolower($request->query('format', 'pdf'));
        $module     = $request->query('module', 'stock');
        $type       = $request->query('type');
        $search     = trim((string) $request->query('search', ''));
        [$dateDebut, $dateFin] = $this->daterange($request->query('dateDebut'), $request->query('dateFin'));

        $rows    = $this->buildHistoriqueExportRows($entreprise->id, $module, $type, $search, $dateDebut, $dateFin);
        $columns = [
            'action'  => 'Action',
            'table'   => 'Élément',
            'details' => 'Détails',
            'date'    => 'Date',
            'user'    => 'Utilisateur',
        ];
        $subtitle = ($dateDebut && $dateFin)
            ? 'Du ' . $dateDebut->toDateString() . ' au ' . $dateFin->toDateString()
            : 'Toutes les périodes';
        $filename = 'agora-historique-transactions-' . now()->format('Ymd-His');

        return match ($format) {
            'csv', 'xlsx' => ExportService::csv($rows, $columns, $filename),
            'docx'        => ExportService::docx($rows, $columns, 'Historique des Transactions', $subtitle, $filename),
            default       => ExportService::pdf($rows, $columns, 'Historique des Transactions', $subtitle, $filename),
        };
    }

    private function buildHistoriqueExportRows(
        string $entrepriseId,
        string $module,
        ?string $type,
        string $search,
        ?Carbon $from,
        ?Carbon $to
    ): array {
        $query = DB::table('historiques as h')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'h.utilisateur')
            ->where('h.entreprise', $entrepriseId)
            ->where('h.module', $module);

        if ($type) {
            $query->where('h.action', $type);
        }
        if ($from) {
            $query->where('h.date_action', '>=', $from);
        }
        if ($to) {
            $query->where('h.date_action', '<=', $to);
        }
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('h.action', 'ilike', "%$search%")
                  ->orWhere('h.details_action', 'ilike', "%$search%");
            });
        }

        return $query
            ->orderByDesc('h.date_action')
            ->select([
                'h.action', 'h.table_concernee', 'h.details_action', 'h.date_action',
                DB::raw("CONCAT(u.name, ' ', u.prename) as utilisateur"),
            ])
            ->get()
            ->map(fn($r) => [
                'action'  => str_replace('_', ' ', $r->action),
                'table'   => $r->table_concernee,
                'details' => $r->details_action ?? '—',
                'date'    => ExportService::fmtDatetime($r->date_action),
                'user'    => $r->utilisateur,
            ])
            ->toArray();
    }
}
