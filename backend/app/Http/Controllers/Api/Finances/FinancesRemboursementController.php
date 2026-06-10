<?php

namespace App\Http\Controllers\Api\Finances;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FinancesRemboursementController extends FinancesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 10 — GET /api/finances/remboursements
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée des remboursements de l'entreprise.
     *
     * Query params : page, per_page, recherche, date_debut, date_fin
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $recherche = trim((string) $request->query('recherche', ''));
            $dateDebut = $request->query('date_debut');
            $dateFin   = $request->query('date_fin');

            [$from, $to] = $this->daterange($dateDebut, $dateFin);

            $query = DB::table('remboursements as r')
                ->join('commandes as c', 'c.id', '=', 'r.commande')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'r.utilisateur_engage')
                ->where('r.entreprise', $entrepriseId)
                ->where('r.actif', true);

            if ($recherche !== '') {
                $query->where(function ($q) use ($recherche) {
                    $q->where(DB::raw("CONCAT(cl.nom, ' ', cl.prenom)"), 'ilike', '%' . $recherche . '%')
                        ->orWhere('r.cause', 'ilike', '%' . $recherche . '%');
                });
            }

            if ($from) {
                $query->where('r.date_remboursement', '>=', $from);
            }
            if ($to) {
                $query->where('r.date_remboursement', '<=', $to);
            }

            $total = $query->count();

            $data = $query
                ->orderBy('r.date_remboursement', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'r.id',
                    'r.montant',
                    'r.cause',
                    'r.date_remboursement',
                    DB::raw("CONCAT(cl.nom, ' ', cl.prenom) as client"),
                    'c.id as commande_id',
                    'c.montant_commande as totalFacture',
                    DB::raw("(SELECT COALESCE(SUM(p.montant), 0) FROM payements p WHERE p.commande = c.id AND p.actif = true) as total_paye"),
                    DB::raw("CONCAT(u.name, ' ', u.prename) as enregistre_par"),
                    $this->numeroCommandeRaw(),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'                 => $row->id,
                    'commande_numero'    => $row->numero,
                    'client'             => $row->client,
                    'montant'            => (float) $row->montant,
                    'cause'              => $row->cause,
                    'date_remboursement' => substr($row->date_remboursement, 0, 10),
                    'enregistre_par'     => $row->enregistre_par,
                    'commandeAssociee' => [
                        'id_commande' => $row->commande_id,
                        'totalFacture' => (float) $row->totalFacture,
                        'totalPaye' => (float) $row->total_paye,
                    ],
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
    // ROUTE 11 — GET /api/finances/commandes-remboursables
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste des commandes ayant un montant remboursable disponible (total_paye - deja_rembourse > 0).
     */
    public function commandesRemboursables(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $commandes = DB::table('commandes as c')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.entreprise', $entrepriseId)
                ->whereIn('c.etat_payement', ['paye', 'partiellement_paye'])
                ->where('c.actif', true)
                ->select([
                    'c.id',
                    'c.montant_commande',
                    'c.date_commande',
                    DB::raw("CONCAT(cl.nom, ' ', cl.prenom) as client"),
                    $this->numeroCommandeRaw(),
                    DB::raw("(SELECT COALESCE(SUM(p.montant), 0) FROM payements p WHERE p.commande = c.id AND p.actif = true) as total_paye"),
                    DB::raw("(SELECT COALESCE(SUM(rb.montant), 0) FROM remboursements rb WHERE rb.commande = c.id AND rb.actif = true) as deja_rembourse"),
                ])
                ->get()
                ->filter(fn($row) => ((float) $row->total_paye - (float) $row->deja_rembourse) > 0)
                ->map(fn($row) => [
                    'id'                  => $row->id,
                    'numero'              => $row->numero,
                    'client'              => $row->client,
                    'montant_commande'    => (float) $row->montant_commande,
                    'total_paye'          => (float) $row->total_paye,
                    'montant_remboursable'=> round((float) $row->total_paye - (float) $row->deja_rembourse, 2),
                ])
                ->values();

            return response()->json(['data' => $commandes], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 12 — POST /api/finances/remboursements
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Enregistre un remboursement lié à une commande.
     *
     * Body JSON : commande_id, montant, cause
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'commande_id' => 'required|uuid',
                'montant'     => 'required|numeric|min:0.01',
                'cause'       => 'required|string|max:1000',
            ], [
                'commande_id.required' => 'La commande est requise.',
                'commande_id.uuid'     => 'Identifiant de commande invalide.',
                'montant.required'     => 'Le montant est requis.',
                'montant.min'          => 'Le montant doit être supérieur à 0.',
                'cause.required'       => 'La cause du remboursement est requise.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

            $entreprise   = $this->currentEntreprise($request);
            $user         = $this->currentUser($request);
            $entrepriseId = $entreprise->id;
            $commandeId   = $request->input('commande_id');
            $montant      = (float) $request->input('montant');
            $cause        = $request->input('cause');

            $commande = DB::table('commandes as c')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.id', $commandeId)
                ->where('c.entreprise', $entrepriseId)
                ->select([
                    'c.id', 'c.statut', 'c.etat_payement', 'c.montant_commande',
                    $this->numeroCommandeRaw(),
                ])
                ->first();

            if (!$commande) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Commande introuvable.',
                ], 404);
            }

            if ($commande->etat_payement === 'non_paye') {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INVALID_STATUS',
                    'message' => 'Aucun paiement enregistré pour cette commande.',
                ], 422);
            }

            $totalPaye      = (float) DB::table('payements')->where('commande', $commandeId)->where('actif', true)->sum('montant');
            $dejaRembourse  = (float) DB::table('remboursements')->where('commande', $commandeId)->where('actif', true)->sum('montant');
            $disponible     = $totalPaye - $dejaRembourse;

            if ($montant > $disponible) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'MONTANT_EXCESSIF',
                    'message' => 'Le montant du remboursement dépasse le total payé disponible.',
                ], 422);
            }

            $remboursementId = (string) Str::uuid();

            DB::table('remboursements')->insert([
                'id'                 => $remboursementId,
                'commande'           => $commandeId,
                'cause'              => $cause,
                'montant'            => $montant,
                'utilisateur_engage' => $user->id,
                'entreprise'         => $entrepriseId,
                'date_remboursement' => now(),
                'actif'              => true,
            ]);

            // Réduire l'argent virtuel
            DB::table('entreprises')
                ->where('id', $entrepriseId)
                ->decrement('argent_virtuel', $montant);

            // Recalcul de l'état de paiement
            $nouveauTotalRembourse = $dejaRembourse + $montant;
            $montantReelEncaisse   = $totalPaye - $nouveauTotalRembourse;
            $montantCommande       = (float) $commande->montant_commande;

            if ($montantReelEncaisse <= 0) {
                $nouvelEtat = 'non_paye';
            } elseif ($montantReelEncaisse < $montantCommande) {
                $nouvelEtat = 'partiellement_paye';
            } else {
                $nouvelEtat = 'paye';
            }

            DB::table('commandes')->where('id', $commandeId)->update(['etat_payement' => $nouvelEtat]);

            // Mouvement financier
            $this->creerMouvementFinancier(
                'remboursement_commande',
                'sortie',
                $montant,
                $entrepriseId,
                $user->id,
                $remboursementId,
                "Remboursement commande {$commande->numero} : {$cause}"
            );

            $this->history(
                'finances', 'remboursements', $remboursementId,
                'remboursement enregistré',
                $request, $user->id, $entrepriseId
            );

            return response()->json([
                'remboursement' => [
                    'id'                 => $remboursementId,
                    'montant'            => $montant,
                    'cause'              => $cause,
                    'date_remboursement' => now()->toISOString(),
                ],
            ], 201);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 13 — GET /api/finances/remboursements/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export des remboursements filtrés en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), + mêmes filtres que route 10
     */
    public function export(Request $request): JsonResponse
    {
        // TODO: Implémenter la génération de fichier PDF / CSV / DOCX.
        // Même logique que index() sans pagination.
        // Inclure en plus : détails de la commande associée (montant, produits).
        return response()->json([
            'ok'      => false,
            'code'    => 'NOT_IMPLEMENTED',
            'message' => 'Export non encore implémenté.',
        ], 501);
    }
}
