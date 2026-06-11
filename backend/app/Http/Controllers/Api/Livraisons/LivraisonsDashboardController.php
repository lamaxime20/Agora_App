<?php

namespace App\Http\Controllers\Api\Livraisons;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LivraisonsDashboardController extends LivraisonsBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 1 — GET /api/livraisons/dashboard
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * KPIs, activité récente, répartition des statuts et graphique par jour.
     *
     * Query params : periode (aujourd_hui|cette_semaine|ce_mois), date_debut, date_fin
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            [$from, $to] = $this->resolvePeriode($request);

            // ── KPIs ─────────────────────────────────────────────────────────

            $baseQuery = fn() => DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('c.entreprise', $entrepriseId);

            $enCours = (clone $baseQuery())
                ->where('l.statut', 'en_cours')
                ->where('l.actif', true)
                ->count();

            $livrees = (clone $baseQuery())
                ->where('l.statut', 'livree')
                ->whereBetween('l.date_livraison_effective', [$from, $to])
                ->count();

            $echecs = (clone $baseQuery())
                ->where('l.statut', 'echec')
                ->whereBetween('l.date_creation', [$from, $to])
                ->count();

            $retours = (clone $baseQuery())
                ->where('l.statut', 'retour')
                ->whereBetween('l.date_creation', [$from, $to])
                ->count();

            $denominateur = $livrees + $echecs + $retours;
            $tauxReussite = $denominateur > 0
                ? round($livrees / $denominateur * 100, 1)
                : 0.0;

            $livreursActifs = (clone $baseQuery())
                ->where('l.statut', 'en_cours')
                ->where('l.actif', true)
                ->distinct('l.livreur')
                ->count('l.livreur');

            // ── Activité récente ──────────────────────────────────────────────

            $activiteRecente = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->join('utilisateurs as u', 'u.id', '=', 'l.livreur')
                ->where('c.entreprise', $entrepriseId)
                ->orderBy('l.date_creation', 'desc')
                ->limit(10)
                ->select([
                    'l.id',
                    'l.statut',
                    'l.date_creation',
                    DB::raw("CONCAT(u.name, ' ', u.prename) as livreur_nom"),
                    $this->numeroCommandeRaw(),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'      => $row->id,
                    'commande'=> $row->numero_cmd,
                    'livreur' => $row->livreur_nom,
                    'statut'  => $row->statut,
                    'heure'   => Carbon::parse($row->date_creation)->format('H:i'),
                ]);

            // ── Répartition statuts (sur la période) ─────────────────────────

            $repartition = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('c.entreprise', $entrepriseId)
                ->selectRaw("
                    COUNT(CASE WHEN l.statut = 'livree' AND l.date_livraison_effective BETWEEN ? AND ? THEN 1 END) as livrees,
                    COUNT(CASE WHEN l.statut = 'echec'  AND l.date_creation BETWEEN ? AND ? THEN 1 END) as echecs,
                    COUNT(CASE WHEN l.statut = 'retour' AND l.date_creation BETWEEN ? AND ? THEN 1 END) as retours
                ", [$from, $to, $from, $to, $from, $to])
                ->first();

            // ── Graphique 7 derniers jours (sur date_creation) ───────────────

            $sevenDaysAgo = Carbon::today()->subDays(6)->startOfDay();
            $today        = Carbon::today()->endOfDay();

            $dailyRaw = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('c.entreprise', $entrepriseId)
                ->whereBetween('l.date_creation', [$sevenDaysAgo, $today])
                ->whereIn('l.statut', ['livree', 'echec', 'retour'])
                ->selectRaw("
                    DATE_TRUNC('day', l.date_creation) as jour_date,
                    COUNT(CASE WHEN l.statut = 'livree' THEN 1 END) as livrees,
                    COUNT(CASE WHEN l.statut = 'echec'  THEN 1 END) as echecs,
                    COUNT(CASE WHEN l.statut = 'retour' THEN 1 END) as retours
                ")
                ->groupByRaw("DATE_TRUNC('day', l.date_creation)")
                ->get()
                ->keyBy(fn($row) => Carbon::parse($row->jour_date)->format('Y-m-d'));

            $graphiqueJours = [];
            for ($i = 6; $i >= 0; $i--) {
                $day = Carbon::today()->subDays($i);
                $key = $day->format('Y-m-d');
                $row = $dailyRaw[$key] ?? null;
                $graphiqueJours[] = [
                    'jour'    => $day->format('d/m'),
                    'livrees' => (int) ($row?->livrees ?? 0),
                    'echecs'  => (int) ($row?->echecs ?? 0),
                    'retours' => (int) ($row?->retours ?? 0),
                ];
            }

            return response()->json([
                'kpis' => [
                    'enCours'        => $enCours,
                    'livrees'        => $livrees,
                    'echecs'         => $echecs,
                    'retours'        => $retours,
                    'tauxReussite'   => $tauxReussite,
                    'livreursActifs' => $livreursActifs,
                ],
                'activiteRecente'    => $activiteRecente,
                'repartitionStatuts' => [
                    'livrees' => (int) ($repartition->livrees ?? 0),
                    'echecs'  => (int) ($repartition->echecs  ?? 0),
                    'retours' => (int) ($repartition->retours ?? 0),
                ],
                'graphiqueJours' => $graphiqueJours,
            ], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__);
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function resolvePeriode(Request $request): array
    {
        $periode   = $request->query('periode', 'aujourd_hui');
        $dateDebut = $request->query('date_debut');
        $dateFin   = $request->query('date_fin');

        if ($periode === 'cette_semaine') {
            return [
                Carbon::now()->startOfWeek(Carbon::MONDAY),
                Carbon::now()->endOfWeek(Carbon::SUNDAY),
            ];
        }

        if ($periode === 'ce_mois') {
            return [
                Carbon::now()->startOfMonth(),
                Carbon::now()->endOfMonth(),
            ];
        }

        if ($periode === null && $dateDebut && $dateFin) {
            return [
                Carbon::parse($dateDebut)->startOfDay(),
                Carbon::parse($dateFin)->endOfDay(),
            ];
        }

        // défaut : aujourd'hui
        return [
            Carbon::today()->startOfDay(),
            Carbon::today()->endOfDay(),
        ];
    }
}
