<?php

namespace App\Http\Controllers\Api\Finances;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinancesJournalController extends FinancesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 34 — GET /api/finances/journal
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Journal financier paginé avec KPIs sur les données filtrées.
     *
     * Query params : page, per_page, recherche, type, sens, date_debut, date_fin
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $recherche = trim((string) $request->query('recherche', ''));
            $type      = $request->query('type', 'tous');
            $sens      = $request->query('sens', 'tous');
            $dateDebut = $request->query('date_debut');
            $dateFin   = $request->query('date_fin');

            [$from, $to] = $this->daterange($dateDebut, $dateFin);

            $query = DB::table('mouvements_financiers as mf')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'mf.utilisateur_id')
                ->where('mf.entreprise_id', $entrepriseId);

            if ($type !== 'tous') {
                $query->where('mf.type_operation', $type);
            }

            if ($sens !== 'tous') {
                $query->where('mf.sens', $sens);
            }

            if ($recherche !== '') {
                $query->where(function ($q) use ($recherche) {
                    $q->where('mf.description', 'ilike', '%' . $recherche . '%')
                        ->orWhere(DB::raw("mf.reference_id::text"), 'ilike', '%' . $recherche . '%')
                        ->orWhere(DB::raw("CONCAT(u.name, ' ', u.prename)"), 'ilike', '%' . $recherche . '%');
                });
            }

            if ($from) {
                $query->where('mf.date_operation', '>=', $from);
            }
            if ($to) {
                $query->where('mf.date_operation', '<=', $to);
            }

            // KPIs calculés sur l'ensemble des données filtrées (avant pagination)
            $kpisQuery = clone $query;
            $kpis = $kpisQuery->selectRaw(
                "COALESCE(SUM(CASE WHEN mf.sens = 'entree' THEN mf.montant ELSE 0 END), 0) as total_entrees," .
                "COALESCE(SUM(CASE WHEN mf.sens = 'sortie' THEN mf.montant ELSE 0 END), 0) as total_sorties"
            )->first();

            $total = $query->count();

            $data = $query
                ->orderBy('mf.date_operation', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'mf.id',
                    'mf.date_operation',
                    'mf.type_operation',
                    'mf.montant',
                    'mf.sens',
                    'mf.description',
                    'mf.reference_id',
                    DB::raw("CONCAT(u.name, ' ', u.prename) as utilisateur"),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'             => $row->id,
                    'date_operation' => $row->date_operation,
                    'type_operation' => $row->type_operation,
                    'montant'        => (float) $row->montant,
                    'sens'           => $row->sens,
                    'description'    => $row->description,
                    'reference_id'   => $row->reference_id,
                    'utilisateur'    => $row->utilisateur,
                ]);

            return response()->json([
                'data' => $data,
                'meta' => ['page' => $page, 'per_page' => $perPage, 'total' => $total],
                'kpis' => [
                    'total_entrees' => (float) ($kpis->total_entrees ?? 0),
                    'total_sorties' => (float) ($kpis->total_sorties ?? 0),
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 35 — GET /api/finances/journal/{id}
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Détail d'un mouvement financier avec les informations de l'élément référencé.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $mouvement = DB::table('mouvements_financiers as mf')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'mf.utilisateur_id')
                ->where('mf.id', $id)
                ->where('mf.entreprise_id', $entrepriseId)
                ->select([
                    'mf.id',
                    'mf.date_operation',
                    'mf.type_operation',
                    'mf.montant',
                    'mf.sens',
                    'mf.description',
                    'mf.reference_id',
                    DB::raw("CONCAT(u.name, ' ', u.prename) as utilisateur"),
                ])
                ->first();

            if (!$mouvement) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Mouvement financier introuvable.',
                ], 404);
            }

            $reference = $this->chargerReference($mouvement->type_operation, $mouvement->reference_id);

            return response()->json([
                'mouvement' => [
                    'id'             => $mouvement->id,
                    'date_operation' => $mouvement->date_operation,
                    'type_operation' => $mouvement->type_operation,
                    'montant'        => (float) $mouvement->montant,
                    'sens'           => $mouvement->sens,
                    'description'    => $mouvement->description,
                    'utilisateur'    => $mouvement->utilisateur,
                    'reference'      => $reference,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__, ['mouvement_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 36 — GET /api/finances/journal/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export du journal financier filtré en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), + mêmes filtres que route 34
     */
    public function export(Request $request): JsonResponse
    {
        // TODO: Implémenter la génération de fichier PDF / CSV / DOCX.
        // Même logique que index() sans pagination.
        // Inclure en plus les détails de l'élément référencé pour chaque mouvement.
        return response()->json([
            'ok'      => false,
            'code'    => 'NOT_IMPLEMENTED',
            'message' => 'Export non encore implémenté.',
        ], 501);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Charge les détails de l'élément référencé selon le type d'opération.
     * Retourne null si reference_id est absent.
     */
    private function chargerReference(string $typeOperation, ?string $referenceId): ?array
    {
        if (!$referenceId) {
            return null;
        }

        return match ($typeOperation) {
            'paiement_commande' => $this->referencePayement($referenceId),
            'remboursement_commande' => $this->referenceRemboursement($referenceId),
            'depense_generale' => $this->referenceDepense($referenceId),
            'entree_generale' => $this->referenceEntree($referenceId),
            'paiement_salaire' => $this->referencePaiementSalaire($referenceId),
            'paiement_abonnement' => $this->referencePaiementAbonnement($referenceId),
            'paiement_ravitaillement' => $this->referenceRavitaillement($referenceId),
            default => ['type' => $typeOperation, 'id' => $referenceId, 'details' => null],
        };
    }

    private function referencePayement(string $referenceId): array
    {
        $row = DB::table('payements as p')
            ->join('commandes as c', 'c.id', '=', 'p.commande')
            ->join('clients as cl', 'cl.id', '=', 'c.client')
            ->where('p.id', $referenceId)
            ->select([
                'p.id', 'p.mode_payement',
                DB::raw("CONCAT(cl.nom, ' ', cl.prenom) as client"),
                DB::raw(
                    "CONCAT('CMD-', EXTRACT(YEAR FROM c.date_commande)::int, '-', " .
                    "LPAD((SELECT COUNT(c2.id) FROM commandes c2 WHERE c2.entreprise = c.entreprise " .
                    "AND EXTRACT(YEAR FROM c2.date_commande) = EXTRACT(YEAR FROM c.date_commande) " .
                    "AND (c2.date_commande < c.date_commande OR (c2.date_commande = c.date_commande AND c2.id::text <= c.id::text)))::text, 5, '0')) as commande_numero"
                ),
            ])
            ->first();

        return [
            'type' => 'payement',
            'id'   => $referenceId,
            'details' => $row ? [
                'commande_numero' => $row->commande_numero,
                'mode_payement'   => $row->mode_payement,
                'client'          => $row->client,
            ] : null,
        ];
    }

    private function referenceRemboursement(string $referenceId): array
    {
        $row = DB::table('remboursements as r')
            ->join('commandes as c', 'c.id', '=', 'r.commande')
            ->join('clients as cl', 'cl.id', '=', 'c.client')
            ->where('r.id', $referenceId)
            ->select([
                'r.id', 'r.cause', 'r.montant',
                DB::raw("CONCAT(cl.nom, ' ', cl.prenom) as client"),
                DB::raw(
                    "CONCAT('CMD-', EXTRACT(YEAR FROM c.date_commande)::int, '-', " .
                    "LPAD((SELECT COUNT(c2.id) FROM commandes c2 WHERE c2.entreprise = c.entreprise " .
                    "AND EXTRACT(YEAR FROM c2.date_commande) = EXTRACT(YEAR FROM c.date_commande) " .
                    "AND (c2.date_commande < c.date_commande OR (c2.date_commande = c.date_commande AND c2.id::text <= c.id::text)))::text, 5, '0')) as commande_numero"
                ),
            ])
            ->first();

        return [
            'type'    => 'remboursement',
            'id'      => $referenceId,
            'details' => $row ? [
                'commande_numero' => $row->commande_numero,
                'client'          => $row->client,
                'cause'           => $row->cause,
                'montant'         => (float) $row->montant,
            ] : null,
        ];
    }

    private function referenceDepense(string $referenceId): array
    {
        $row = DB::table('depenses')->where('id', $referenceId)->select(['id', 'montant', 'raison', 'date_depense'])->first();

        return [
            'type'    => 'depense',
            'id'      => $referenceId,
            'details' => $row ? [
                'montant'      => (float) $row->montant,
                'raison'       => $row->raison,
                'date_depense' => $row->date_depense,
            ] : null,
        ];
    }

    private function referenceEntree(string $referenceId): array
    {
        $row = DB::table('entrees_argent')->where('id', $referenceId)->select(['id', 'montant', 'raison', 'date_entree'])->first();

        return [
            'type'    => 'entree',
            'id'      => $referenceId,
            'details' => $row ? [
                'montant'     => (float) $row->montant,
                'raison'      => $row->raison,
                'date_entree' => $row->date_entree,
            ] : null,
        ];
    }

    private function referencePaiementSalaire(string $referenceId): array
    {
        $row = DB::table('paiements_salaires as ps')
            ->join('salaires as s', 's.id', '=', 'ps.salaire')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 's.utilisateur')
            ->where('ps.id', $referenceId)
            ->select([
                'ps.id', 'ps.montant', 'ps.date_paiement',
                DB::raw("CONCAT(u.name, ' ', u.prename) as salarie"),
            ])
            ->first();

        return [
            'type'    => 'paiement_salaire',
            'id'      => $referenceId,
            'details' => $row ? [
                'salarie'        => $row->salarie,
                'montant'        => (float) $row->montant,
                'date_paiement'  => $row->date_paiement,
            ] : null,
        ];
    }

    private function referencePaiementAbonnement(string $referenceId): array
    {
        $row = DB::table('paiements_abonnements as pa')
            ->join('frais_mensuel as fm', 'fm.id', '=', 'pa.abonnement')
            ->where('pa.id', $referenceId)
            ->select([
                'pa.id', 'pa.montant', 'pa.date_paiement',
                'fm.service_paye', 'fm.fournisseur',
            ])
            ->first();

        return [
            'type'    => 'paiement_abonnement',
            'id'      => $referenceId,
            'details' => $row ? [
                'service_paye'  => $row->service_paye,
                'fournisseur'   => $row->fournisseur,
                'montant'       => (float) $row->montant,
                'date_paiement' => $row->date_paiement,
            ] : null,
        ];
    }

    private function referenceRavitaillement(string $referenceId): array
    {
        $row = DB::table('ravitaillements as r')
            ->join('produits as p', 'p.id', '=', 'r.produit')
            ->where('r.id', $referenceId)
            ->select([
                'r.id', 'r.quantite', 'r.montant_a_depenser', 'r.statut',
                'p.nom as produit',
            ])
            ->first();

        return [
            'type'    => 'ravitaillement',
            'id'      => $referenceId,
            'details' => $row ? [
                'produit'           => $row->produit,
                'quantite'          => (float) $row->quantite,
                'montant_a_depenser'=> (float) $row->montant_a_depenser,
                'statut'            => $row->statut,
            ] : null,
        ];
    }
}
