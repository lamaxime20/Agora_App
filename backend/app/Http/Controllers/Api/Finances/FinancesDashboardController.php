<?php

namespace App\Http\Controllers\Api\Finances;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinancesDashboardController extends FinancesBaseController
{
    /**
     * GET /api/finances/dashboard
     *
     * Retourne les KPIs principaux, l'évolution de trésorerie sur 30 jours
     * et les 10 derniers mouvements financiers.
     *
     * Query params :
     *   - periode : string optionnel (today|week|month|year), défaut "month"
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;
            $periode      = $request->query('periode', 'month');

            [$dateDebut, $dateFin] = $this->periodeBornes($periode);

            // ── Section main ─────────────────────────────────────────────────

            $argentVirtuel = DB::table('entreprises')
                ->where('id', $entrepriseId)
                ->value('argent_virtuel') ?? 0;

            $mouvementsKpi = DB::table('mouvements_financiers')
                ->where('entreprise_id', $entrepriseId)
                ->whereBetween('date_operation', [$dateDebut, $dateFin])
                ->selectRaw(
                    "COALESCE(SUM(CASE WHEN sens = 'entree' THEN montant ELSE 0 END), 0) as total_entrees," .
                    "COALESCE(SUM(CASE WHEN sens = 'sortie' THEN montant ELSE 0 END), 0) as total_sorties"
                )
                ->first();

            $totalEntrees = (float) ($mouvementsKpi->total_entrees ?? 0);
            $totalSorties = (float) ($mouvementsKpi->total_sorties ?? 0);
            $beneficeNet  = $totalEntrees - $totalSorties;

            $commandesEnAttenteValidation = DB::table('commandes')
                ->where('entreprise', $entrepriseId)
                ->where('statut', 'brouillon')
                ->where('actif', true)
                ->count();

            $commandesEnAttentePaiement = DB::table('commandes')
                ->where('entreprise', $entrepriseId)
                ->where('statut', 'validee')
                ->where('etat_payement', '!=', 'paye')
                ->where('actif', true)
                ->count();

            // ── Section trésorerie (30 derniers jours) ────────────────────────

            $debut30j = Carbon::now()->subDays(29)->startOfDay();
            $fin30j   = Carbon::now()->endOfDay();

            $mouvements30j = DB::table('mouvements_financiers')
                ->where('entreprise_id', $entrepriseId)
                ->whereBetween('date_operation', [$debut30j, $fin30j])
                ->orderBy('date_operation', 'asc')
                ->select(['date_operation', 'montant', 'sens'])
                ->get();

            // Calcul de la valeur de départ (argent_virtuel actuel – entrées depuis J-29 + sorties depuis J-29)
            $sommeEntrees30j = $mouvements30j->where('sens', 'entree')->sum('montant');
            $sommeSorties30j = $mouvements30j->where('sens', 'sortie')->sum('montant');
            $valeurDepart    = (float) $argentVirtuel - $sommeEntrees30j + $sommeSorties30j;

            $tresorerie = [];
            $courante   = $valeurDepart;

            for ($i = 29; $i >= 0; $i--) {
                $jour       = Carbon::now()->subDays($i)->toDateString();
                $jourDebut  = Carbon::parse($jour)->startOfDay();
                $jourFin    = Carbon::parse($jour)->endOfDay();

                foreach ($mouvements30j as $m) {
                    $ts = Carbon::parse($m->date_operation);
                    if ($ts->between($jourDebut, $jourFin)) {
                        $courante += $m->sens === 'entree' ? (float) $m->montant : -(float) $m->montant;
                    }
                }

                $tresorerie[] = ['date' => $jour, 'valeur' => round($courante, 2)];
            }

            // ── Section activités (10 derniers mouvements) ────────────────────

            $activites = DB::table('mouvements_financiers as mf')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'mf.utilisateur_id')
                ->where('mf.entreprise_id', $entrepriseId)
                ->orderBy('mf.date_operation', 'desc')
                ->limit(10)
                ->select([
                    'mf.id',
                    'mf.date_operation',
                    'mf.type_operation',
                    'mf.montant',
                    'mf.sens',
                    'mf.description',
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
                    'utilisateur'    => $row->utilisateur,
                ]);

            return response()->json([
                'main' => [
                    'argent_virtuel'                   => (float) $argentVirtuel,
                    'total_entrees'                    => $totalEntrees,
                    'total_sorties'                    => $totalSorties,
                    'benefice_net'                     => $beneficeNet,
                    'commandes_en_attente_validation'  => $commandesEnAttenteValidation,
                    'commandes_en_attente_paiement'    => $commandesEnAttentePaiement,
                ],
                'tresorerie' => $tresorerie,
                'activites'  => $activites,
            ], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function periodeBornes(string $periode): array
    {
        return match ($periode) {
            'today' => [Carbon::today()->startOfDay(), Carbon::today()->endOfDay()],
            'week'  => [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()],
            'year'  => [Carbon::now()->startOfYear(), Carbon::now()->endOfYear()],
            default => [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()],
        };
    }
}
