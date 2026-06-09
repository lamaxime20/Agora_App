<?php

namespace App\Http\Controllers\Api\Finances;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinancesStatistiqueController extends FinancesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 37 — GET /api/finances/statistiques/general
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Statistiques générales sur la période définie.
     *
     * Query params : date_debut, date_fin
     */
    public function general(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            [$from, $to] = $this->daterange(
                $request->query('date_debut'),
                $request->query('date_fin')
            );

            $argentVirtuelActuel = (float) (DB::table('entreprises')->where('id', $entrepriseId)->value('argent_virtuel') ?? 0);

            $mouvementsQuery = DB::table('mouvements_financiers')
                ->where('entreprise_id', $entrepriseId);

            if ($from) {
                $mouvementsQuery->where('date_operation', '>=', $from);
            }
            if ($to) {
                $mouvementsQuery->where('date_operation', '<=', $to);
            }

            $mouvements = $mouvementsQuery->selectRaw(
                "COALESCE(SUM(CASE WHEN sens = 'entree' THEN montant ELSE 0 END), 0) as total_entrees," .
                "COALESCE(SUM(CASE WHEN sens = 'sortie' THEN montant ELSE 0 END), 0) as total_sorties"
            )->first();

            $totalEntrees = (float) ($mouvements->total_entrees ?? 0);
            $totalSorties = (float) ($mouvements->total_sorties ?? 0);

            $commandesPayeesQuery = DB::table('commandes')
                ->where('entreprise', $entrepriseId)
                ->where('etat_payement', 'paye');

            if ($from) {
                $commandesPayeesQuery->where('date_commande', '>=', $from);
            }
            if ($to) {
                $commandesPayeesQuery->where('date_commande', '<=', $to);
            }

            $nbCommandesPayees = $commandesPayeesQuery->count();

            $totalRemboursements = $this->sumTablePeriode('remboursements', 'montant', 'date_remboursement', $entrepriseId, $from, $to, 'entreprise');
            $totalDepenses       = $this->sumTablePeriode('depenses', 'montant', 'date_depense', $entrepriseId, $from, $to, 'entreprise');
            $totalSalaires       = $this->sumTablePeriodeJoin('paiements_salaires', 'montant', 'date_paiement', $entrepriseId, $from, $to);

            $totalReapproQuery = DB::table('ravitaillements')
                ->where('entreprise', $entrepriseId)
                ->whereIn('statut', ['en_cours', 'termine']);

            if ($from) {
                $totalReapproQuery->where('date_creation', '>=', $from);
            }
            if ($to) {
                $totalReapproQuery->where('date_creation', '<=', $to);
            }

            $totalReappro     = (float) ($totalReapproQuery->sum('montant_a_depenser') ?? 0);
            $totalAbonnements = $this->sumTablePeriodeJoin('paiements_abonnements', 'montant', 'date_paiement', $entrepriseId, $from, $to);

            return response()->json([
                'argent_virtuel_actuel'        => $argentVirtuelActuel,
                'total_entrees'                => $totalEntrees,
                'total_sorties'                => $totalSorties,
                'benefice_net'                 => $totalEntrees - $totalSorties,
                'nb_commandes_payees'          => $nbCommandesPayees,
                'total_remboursements'         => $totalRemboursements,
                'total_depenses'               => $totalDepenses,
                'total_reapprovisionnements'   => $totalReappro,
                'total_salaires'               => $totalSalaires,
                'total_abonnements'            => $totalAbonnements,
            ], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 38 — GET /api/finances/statistiques/tresorerie
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Évolution de la trésorerie sur la période avec granularité journalière, hebdomadaire ou mensuelle.
     *
     * Query params : date_debut, date_fin, granularite (daily|weekly|monthly)
     */
    public function tresorerie(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;
            $granularite  = $request->query('granularite', 'daily');

            [$from, $to] = $this->daterange(
                $request->query('date_debut'),
                $request->query('date_fin')
            );

            $from = $from ?? Carbon::now()->subDays(29)->startOfDay();
            $to   = $to   ?? Carbon::now()->endOfDay();

            $mouvements = DB::table('mouvements_financiers')
                ->where('entreprise_id', $entrepriseId)
                ->whereBetween('date_operation', [$from, $to])
                ->orderBy('date_operation', 'asc')
                ->select(['date_operation', 'montant', 'sens'])
                ->get();

            $argentActuel    = (float) (DB::table('entreprises')->where('id', $entrepriseId)->value('argent_virtuel') ?? 0);
            $sommeEntrees    = $mouvements->where('sens', 'entree')->sum('montant');
            $sommeSorties    = $mouvements->where('sens', 'sortie')->sum('montant');
            $valeurDepart    = $argentActuel - $sommeEntrees + $sommeSorties;

            $groupFormat = match ($granularite) {
                'weekly'  => 'W-Y',
                'monthly' => 'Y-m',
                default   => 'Y-m-d',
            };

            $series   = [];
            $courante = $valeurDepart;
            $current  = $from->copy();

            while ($current->lte($to)) {
                $key = $current->format($groupFormat);

                $debutPeriode = match ($granularite) {
                    'weekly'  => $current->copy()->startOfWeek(),
                    'monthly' => $current->copy()->startOfMonth(),
                    default   => $current->copy()->startOfDay(),
                };

                $finPeriode = match ($granularite) {
                    'weekly'  => $current->copy()->endOfWeek(),
                    'monthly' => $current->copy()->endOfMonth(),
                    default   => $current->copy()->endOfDay(),
                };

                foreach ($mouvements as $m) {
                    $ts = Carbon::parse($m->date_operation);
                    if ($ts->between($debutPeriode, $finPeriode)) {
                        $courante += $m->sens === 'entree' ? (float) $m->montant : -(float) $m->montant;
                    }
                }

                $series[$key] = round($courante, 2);

                $current = match ($granularite) {
                    'weekly'  => $current->addWeek(),
                    'monthly' => $current->addMonth()->startOfMonth(),
                    default   => $current->addDay(),
                };
            }

            $evolution = collect($series)->map(fn($valeur, $date) => ['date' => $date, 'valeur' => $valeur])->values();

            return response()->json(['evolution' => $evolution], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 39 — GET /api/finances/statistiques/autres
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Statistiques thématiques détaillées (commandes/paiements, dépenses, remboursements,
     * salaires, abonnements, réapprovisionnements, flux financiers, rapports mensuels).
     *
     * Query params : date_debut, date_fin
     */
    public function autres(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            [$from, $to] = $this->daterange(
                $request->query('date_debut'),
                $request->query('date_fin')
            );

            // ── 1. Commandes & paiements ─────────────────────────────────────

            $modesQuery = DB::table('payements as p')
                ->join('commandes as c', 'c.id', '=', 'p.commande')
                ->where('c.entreprise', $entrepriseId)
                ->where('p.actif', true);

            if ($from) {
                $modesQuery->where('p.date_payement', '>=', $from);
            }
            if ($to) {
                $modesQuery->where('p.date_payement', '<=', $to);
            }

            $modes = $modesQuery
                ->groupBy('p.mode_payement')
                ->selectRaw('p.mode_payement as mode, COALESCE(SUM(p.montant), 0) as montant, COUNT(*) as count')
                ->get()
                ->map(fn($r) => ['mode' => $r->mode, 'montant' => (float) $r->montant, 'count' => (int) $r->count]);

            $evolutionPaiements = $this->evolutionMensuelle('payements', 'montant', 'date_payement', $entrepriseId, $from, $to, 'p.commande IS NOT NULL', 'entreprise');

            // ── 2. Dépenses ─────────────────────────────────────────────────

            $evolutionDepenses = $this->evolutionMensuelleSimple('depenses', 'montant', 'date_depense', $entrepriseId, $from, $to, 'entreprise');

            // ── 3. Remboursements ────────────────────────────────────────────

            $evolutionRemboursements = $this->evolutionMensuelleSimple('remboursements', 'montant', 'date_remboursement', $entrepriseId, $from, $to, 'entreprise');

            // ── 4. Salaires ──────────────────────────────────────────────────

            $salaireBaseQuery = DB::table('paiements_salaires')
                ->where('entreprise', $entrepriseId);

            if ($from) {
                $salaireBaseQuery->where('date_paiement', '>=', $from);
            }
            if ($to) {
                $salaireBaseQuery->where('date_paiement', '<=', $to);
            }

            $evolutionSalaires = $salaireBaseQuery
                ->selectRaw("TO_CHAR(date_paiement, 'YYYY-MM') as mois, COALESCE(SUM(montant), 0) as montant")
                ->groupByRaw("TO_CHAR(date_paiement, 'YYYY-MM')")
                ->orderByRaw("TO_CHAR(date_paiement, 'YYYY-MM') ASC")
                ->get()
                ->map(fn($r) => ['mois' => $r->mois, 'montant' => (float) $r->montant]);

            // ── 5. Abonnements ──────────────────────────────────────────────

            $aboPayQuery = DB::table('paiements_abonnements')
                ->where('entreprise', $entrepriseId);

            if ($from) {
                $aboPayQuery->where('date_paiement', '>=', $from);
            }
            if ($to) {
                $aboPayQuery->where('date_paiement', '<=', $to);
            }

            $evolutionAbonnements = $aboPayQuery
                ->selectRaw("TO_CHAR(date_paiement, 'YYYY-MM') as mois, COALESCE(SUM(montant), 0) as montant")
                ->groupByRaw("TO_CHAR(date_paiement, 'YYYY-MM')")
                ->orderByRaw("TO_CHAR(date_paiement, 'YYYY-MM') ASC")
                ->get()
                ->map(fn($r) => ['mois' => $r->mois, 'montant' => (float) $r->montant]);

            $abonnementsActifs = DB::table('frais_mensuel')
                ->where('entreprise', $entrepriseId)
                ->where('depense_active', true)
                ->where('actif', true)
                ->select(['id', 'service_paye', 'montant_mensuel', 'fournisseur'])
                ->get()
                ->map(fn($r) => [
                    'id'              => $r->id,
                    'service_paye'    => $r->service_paye,
                    'montant_mensuel' => (float) $r->montant_mensuel,
                    'fournisseur'     => $r->fournisseur,
                ]);

            // ── 6. Réapprovisionnements ──────────────────────────────────────

            $reapproBaseQuery = DB::table('ravitaillements')
                ->where('entreprise', $entrepriseId)
                ->whereIn('statut', ['en_cours', 'termine']);

            if ($from) {
                $reapproBaseQuery->where('date_creation', '>=', $from);
            }
            if ($to) {
                $reapproBaseQuery->where('date_creation', '<=', $to);
            }

            $evolutionReappro = (clone $reapproBaseQuery)
                ->selectRaw("TO_CHAR(date_creation, 'YYYY-MM') as mois, COALESCE(SUM(montant_a_depenser), 0) as montant")
                ->groupByRaw("TO_CHAR(date_creation, 'YYYY-MM')")
                ->orderByRaw("TO_CHAR(date_creation, 'YYYY-MM') ASC")
                ->get()
                ->map(fn($r) => ['mois' => $r->mois, 'montant' => (float) $r->montant]);

            $totalReapproAll = DB::table('ravitaillements')
                ->where('entreprise', $entrepriseId)
                ->count();

            $totalRefuses = DB::table('ravitaillements')
                ->where('entreprise', $entrepriseId)
                ->where('statut', 'refuse')
                ->count();

            $tauxRefus = $totalReapproAll > 0 ? round($totalRefuses / $totalReapproAll * 100, 2) : 0;

            // ── 7. Flux financiers ───────────────────────────────────────────

            $fluxQuery = DB::table('mouvements_financiers')
                ->where('entreprise_id', $entrepriseId);

            if ($from) {
                $fluxQuery->where('date_operation', '>=', $from);
            }
            if ($to) {
                $fluxQuery->where('date_operation', '<=', $to);
            }

            $fluxFinanciers = $fluxQuery
                ->groupBy('type_operation', 'sens')
                ->selectRaw('type_operation, sens, COALESCE(SUM(montant), 0) as total')
                ->get()
                ->map(fn($r) => [
                    'type_operation' => $r->type_operation,
                    'sens'           => $r->sens,
                    'total'          => (float) $r->total,
                ]);

            // ── 8. Rapports mensuels ─────────────────────────────────────────

            $rapportsMensuels = $this->calculerRapportsMensuels($entrepriseId, $from, $to);

            return response()->json([
                'commandes_paiements' => [
                    'modes'     => $modes,
                    'evolution' => $evolutionPaiements,
                ],
                'depenses' => [
                    'evolution' => $evolutionDepenses,
                ],
                'remboursements' => [
                    'evolution' => $evolutionRemboursements,
                ],
                'salaires' => [
                    'evolution' => $evolutionSalaires,
                ],
                'abonnements' => [
                    'evolution' => $evolutionAbonnements,
                    'actifs'    => $abonnementsActifs,
                ],
                'reapprovisionnements' => [
                    'evolution' => $evolutionReappro,
                    'taux_refus'=> $tauxRefus,
                ],
                'flux_financiers'  => $fluxFinanciers,
                'rapports_mensuels'=> $rapportsMensuels,
            ], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function sumTablePeriode(
        string $table,
        string $colMontant,
        string $colDate,
        string $entrepriseId,
        ?Carbon $from,
        ?Carbon $to,
        string $colEntreprise = 'entreprise'
    ): float {
        $query = DB::table($table)->where($colEntreprise, $entrepriseId);

        if ($from) {
            $query->where($colDate, '>=', $from);
        }
        if ($to) {
            $query->where($colDate, '<=', $to);
        }

        return (float) ($query->sum($colMontant) ?? 0);
    }

    private function sumTablePeriodeJoin(
        string $table,
        string $colMontant,
        string $colDate,
        string $entrepriseId,
        ?Carbon $from,
        ?Carbon $to
    ): float {
        $query = DB::table($table)->where('entreprise', $entrepriseId);

        if ($from) {
            $query->where($colDate, '>=', $from);
        }
        if ($to) {
            $query->where($colDate, '<=', $to);
        }

        return (float) ($query->sum($colMontant) ?? 0);
    }

    private function evolutionMensuelleSimple(
        string $table,
        string $colMontant,
        string $colDate,
        string $entrepriseId,
        ?Carbon $from,
        ?Carbon $to,
        string $colEntreprise = 'entreprise'
    ): \Illuminate\Support\Collection {
        $query = DB::table($table)->where($colEntreprise, $entrepriseId);

        if ($from) {
            $query->where($colDate, '>=', $from);
        }
        if ($to) {
            $query->where($colDate, '<=', $to);
        }

        return $query
            ->selectRaw("TO_CHAR({$colDate}, 'YYYY-MM') as mois, COALESCE(SUM({$colMontant}), 0) as montant")
            ->groupByRaw("TO_CHAR({$colDate}, 'YYYY-MM')")
            ->orderByRaw("TO_CHAR({$colDate}, 'YYYY-MM') ASC")
            ->get()
            ->map(fn($r) => ['mois' => $r->mois, 'montant' => (float) $r->montant]);
    }

    private function evolutionMensuelle(
        string $table,
        string $colMontant,
        string $colDate,
        string $entrepriseId,
        ?Carbon $from,
        ?Carbon $to,
        string $extraCondition = '',
        string $colEntreprise = 'entreprise'
    ): \Illuminate\Support\Collection {
        $query = DB::table($table)->where($colEntreprise, $entrepriseId);

        if ($from) {
            $query->where($colDate, '>=', $from);
        }
        if ($to) {
            $query->where($colDate, '<=', $to);
        }

        return $query
            ->selectRaw("TO_CHAR({$colDate}, 'YYYY-MM') as mois, COALESCE(SUM({$colMontant}), 0) as montant")
            ->groupByRaw("TO_CHAR({$colDate}, 'YYYY-MM')")
            ->orderByRaw("TO_CHAR({$colDate}, 'YYYY-MM') ASC")
            ->get()
            ->map(fn($r) => ['mois' => $r->mois, 'montant' => (float) $r->montant]);
    }

    private function calculerRapportsMensuels(string $entrepriseId, ?Carbon $from, ?Carbon $to): \Illuminate\Support\Collection
    {
        $mouvements = DB::table('mouvements_financiers')
            ->where('entreprise_id', $entrepriseId)
            ->when($from, fn($q) => $q->where('date_operation', '>=', $from))
            ->when($to, fn($q) => $q->where('date_operation', '<=', $to))
            ->selectRaw(
                "TO_CHAR(date_operation, 'YYYY-MM') as mois, " .
                "COALESCE(SUM(CASE WHEN sens = 'entree' THEN montant ELSE 0 END), 0) as total_entrees, " .
                "COALESCE(SUM(CASE WHEN sens = 'sortie' THEN montant ELSE 0 END), 0) as total_sorties"
            )
            ->groupByRaw("TO_CHAR(date_operation, 'YYYY-MM')")
            ->orderByRaw("TO_CHAR(date_operation, 'YYYY-MM') ASC")
            ->get();

        $argentActuel = (float) (DB::table('entreprises')->where('id', $entrepriseId)->value('argent_virtuel') ?? 0);

        // Calcul de la valeur de départ (argent_virtuel actuel retraité depuis la fin de la période)
        $allEntrees = $mouvements->sum('total_entrees');
        $allSorties = $mouvements->sum('total_sorties');
        $valeurDepart = $argentActuel - $allEntrees + $allSorties;

        $cumul = $valeurDepart;

        return $mouvements->map(function ($row) use (&$cumul) {
            $cumul += (float) $row->total_entrees - (float) $row->total_sorties;

            return [
                'mois'                   => $row->mois,
                'total_entrees'          => (float) $row->total_entrees,
                'total_sorties'          => (float) $row->total_sorties,
                'benefice_net'           => (float) $row->total_entrees - (float) $row->total_sorties,
                'argent_virtuel_fin_mois'=> round($cumul, 2),
            ];
        });
    }
}
