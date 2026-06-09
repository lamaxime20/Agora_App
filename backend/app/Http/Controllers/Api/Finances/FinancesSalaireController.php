<?php

namespace App\Http\Controllers\Api\Finances;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinancesSalaireController extends FinancesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 31 — GET /api/finances/salaires
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée des salaires de l'entreprise.
     *
     * Query params : page, per_page, recherche, statut (tous|actif|archive)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $recherche = trim((string) $request->query('recherche', ''));
            $statut    = $request->query('statut', 'actif');

            $query = DB::table('salaires as s')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 's.utilisateur')
                ->where('s.entreprise', $entrepriseId)
                ->where('s.actif', true);

            if ($statut !== 'tous') {
                $query->where('s.statut', $statut);
            }

            if ($recherche !== '') {
                $query->where(function ($q) use ($recherche) {
                    $q->where('u.name', 'ilike', '%' . $recherche . '%')
                        ->orWhere('u.prename', 'ilike', '%' . $recherche . '%');
                });
            }

            $total = $query->count();

            $data = $query
                ->orderBy('u.name', 'asc')
                ->forPage($page, $perPage)
                ->select([
                    's.id',
                    's.montant',
                    's.date_debut',
                    's.date_fin',
                    's.statut',
                    'u.id as utilisateur_id',
                    'u.name as utilisateur_nom',
                    'u.prename as utilisateur_prenom',
                ])
                ->get()
                ->map(fn($row) => [
                    'id'         => $row->id,
                    'utilisateur'=> [
                        'id'     => $row->utilisateur_id,
                        'nom'    => $row->utilisateur_nom,
                        'prenom' => $row->utilisateur_prenom,
                    ],
                    'montant'    => (float) $row->montant,
                    'date_debut' => $row->date_debut,
                    'date_fin'   => $row->date_fin,
                    'statut'     => $row->statut,
                ]);

            return response()->json([
                'data' => $data,
                'meta' => ['page' => $page, 'per_page' => $perPage, 'total' => $total],
            ], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 32 — GET /api/finances/salaires/{id}/paiements
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Historique paginé des paiements d'un salaire donné.
     *
     * Path param : id (UUID du salaire)
     * Query params : page, per_page, date_debut, date_fin
     */
    public function paiements(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $dateDebut = $request->query('date_debut');
            $dateFin   = $request->query('date_fin');

            [$from, $to] = $this->daterange($dateDebut, $dateFin);

            $salaire = DB::table('salaires as s')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 's.utilisateur')
                ->where('s.id', $id)
                ->where('s.entreprise', $entrepriseId)
                ->select([
                    's.id', 's.montant',
                    'u.name as nom', 'u.prename as prenom',
                ])
                ->first();

            if (!$salaire) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Salaire introuvable.',
                ], 404);
            }

            $query = DB::table('paiements_salaires as ps')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'ps.user_enregistre')
                ->where('ps.salaire', $id)
                ->where('ps.entreprise', $entrepriseId);

            if ($from) {
                $query->where('ps.date_paiement', '>=', $from);
            }
            if ($to) {
                $query->where('ps.date_paiement', '<=', $to);
            }

            $total = $query->count();

            $paiements = $query
                ->orderBy('ps.date_paiement', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'ps.id',
                    'ps.montant',
                    'ps.date_paiement',
                    'ps.mode_payement',
                    'ps.reference_transaction',
                    DB::raw("CONCAT(u.name, ' ', u.prename) as enregistre_par"),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'                    => $row->id,
                    'montant'               => (float) $row->montant,
                    'date_paiement'         => substr($row->date_paiement, 0, 10),
                    'mode_payement'         => $row->mode_payement,
                    'reference_transaction' => $row->reference_transaction,
                    'enregistre_par'        => $row->enregistre_par,
                ]);

            return response()->json([
                'salaire' => [
                    'id'          => $salaire->id,
                    'utilisateur' => ['nom' => $salaire->nom, 'prenom' => $salaire->prenom],
                    'montant'     => (float) $salaire->montant,
                ],
                'paiements' => $paiements,
                'meta'      => ['page' => $page, 'per_page' => $perPage, 'total' => $total],
            ], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__, ['salaire_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 33 — GET /api/finances/salaires/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export des salaires filtrés en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), + mêmes filtres que route 31
     */
    public function export(Request $request): JsonResponse
    {
        // TODO: Implémenter la génération de fichier PDF / CSV / DOCX.
        // Même logique que index() sans pagination.
        // Pour chaque salarié, inclure l'historique de ses paiements de salaire.
        return response()->json([
            'ok'      => false,
            'code'    => 'NOT_IMPLEMENTED',
            'message' => 'Export non encore implémenté.',
        ], 501);
    }
}
