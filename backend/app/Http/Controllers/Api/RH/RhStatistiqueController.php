<?php

namespace App\Http\Controllers\Api\RH;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RhStatistiqueController extends RhBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 6 — GET /api/rh/statistiques
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Statistiques RH complètes de l'entreprise.
     *
     * Query params : periode (7j|30j|12m) — nombre de mois pour l'évolution
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;
            $directeurId  = $entreprise->directeur;
            $roleMeta     = $this->roleMeta();

            $periode = in_array($request->query('periode'), ['7j', '30j', '12m'], true)
                ? $request->query('periode')
                : '12m';

            // Lookback en mois selon la période
            $nbMois = match ($periode) {
                '7j'  => 1,
                '30j' => 2,
                default => 12,
            };

            // ── Masse salariale par rôle ──────────────────────────────────────
            $salaryByRoleRaw = DB::select("
                SELECT
                    r.role,
                    COUNT(DISTINCT ae.utilisateur_id)        AS count,
                    COALESCE(SUM(sal.montant), 0)            AS total
                FROM   appartenir_entreprise ae
                JOIN   roles_utilisateur r ON r.id = ae.role_utilisateur_id
                LEFT JOIN LATERAL (
                    SELECT montant
                    FROM   salaires s
                    WHERE  s.utilisateur = ae.utilisateur_id
                    AND    s.entreprise  = ?
                    AND    s.statut      = 'actif'
                    AND    s.actif       = true
                    ORDER  BY s.date_debut DESC NULLS LAST
                    LIMIT  1
                ) sal ON true
                WHERE  ae.entreprise_id  = ?
                AND    ae.statut         = 'actif'
                AND    ae.utilisateur_id != ?
                AND    r.role           != 'directeur'
                GROUP  BY r.role
                ORDER  BY total DESC
            ", [$entrepriseId, $entrepriseId, $directeurId]);

            $salaryByRole = collect($salaryByRoleRaw)->map(fn($r) => [
                'role'    => $r->role,
                'label'   => $roleMeta[$r->role]['label']   ?? $r->role,
                'couleur' => $roleMeta[$r->role]['couleur'] ?? '#999999',
                'count'   => (int) $r->count,
                'total'   => (float) $r->total,
            ])->values();

            // ── Distribution des employés par rôle (donut) ───────────────────
            $totalRow = DB::selectOne("
                SELECT COUNT(DISTINCT ae.utilisateur_id) AS cnt
                FROM   appartenir_entreprise ae
                JOIN   roles_utilisateur r ON r.id = ae.role_utilisateur_id
                WHERE  ae.entreprise_id  = ?
                AND    ae.statut         = 'actif'
                AND    ae.utilisateur_id != ?
                AND    r.role           != 'directeur'
            ", [$entrepriseId, $directeurId]);

            $totalEmployees = (int) $totalRow->cnt;

            $distributionRaw = DB::select("
                SELECT r.role, COUNT(DISTINCT ae.utilisateur_id) AS count
                FROM   appartenir_entreprise ae
                JOIN   roles_utilisateur r ON r.id = ae.role_utilisateur_id
                WHERE  ae.entreprise_id  = ?
                AND    ae.statut         = 'actif'
                AND    ae.utilisateur_id != ?
                AND    r.role           != 'directeur'
                GROUP  BY r.role
                ORDER  BY count DESC
            ", [$entrepriseId, $directeurId]);

            $employeesDistribution = collect($distributionRaw)->map(fn($r) => [
                'role'       => $r->role,
                'label'      => $roleMeta[$r->role]['label']   ?? $r->role,
                'couleur'    => $roleMeta[$r->role]['couleur'] ?? '#999999',
                'count'      => (int) $r->count,
                'pourcentage'=> $totalEmployees > 0 ? round(($r->count / $totalEmployees) * 100, 1) : 0.0,
            ])->values();

            // ── Évolution des effectifs (cumul mensuel) ───────────────────────
            $employeesEvolutionRaw = DB::select("
                SELECT
                    TO_CHAR(m.mois, 'Mon YY')        AS mois,
                    COUNT(DISTINCT ae.utilisateur_id) AS count
                FROM generate_series(
                    DATE_TRUNC('month', NOW() - INTERVAL '{$nbMois} months'),
                    DATE_TRUNC('month', NOW()),
                    INTERVAL '1 month'
                ) AS m(mois)
                LEFT JOIN appartenir_entreprise ae
                    ON ae.entreprise_id   = ?
                    AND ae.statut         = 'actif'
                    AND ae.utilisateur_id != ?
                    AND ae.date_enregistrement::date <= (m.mois + INTERVAL '1 month - 1 day')::date
                LEFT JOIN roles_utilisateur r
                    ON r.id = ae.role_utilisateur_id AND r.role != 'directeur'
                WHERE ae.utilisateur_id IS NULL OR r.id IS NOT NULL
                GROUP  BY m.mois
                ORDER  BY m.mois ASC
            ", [$entrepriseId, $directeurId]);

            $employeesEvolution = collect($employeesEvolutionRaw)->map(fn($r) => [
                'mois'  => $r->mois,
                'count' => (int) $r->count,
            ])->values();

            // ── Salaire moyen ─────────────────────────────────────────────────
            $avgRow = DB::selectOne("
                SELECT ROUND(AVG(sal.montant)) AS avg
                FROM (
                    SELECT DISTINCT ON (s.utilisateur) s.montant
                    FROM   salaires s
                    JOIN   appartenir_entreprise ae
                        ON ae.utilisateur_id = s.utilisateur
                        AND ae.entreprise_id  = ?
                        AND ae.statut         = 'actif'
                        AND ae.utilisateur_id != ?
                    JOIN   roles_utilisateur r ON r.id = ae.role_utilisateur_id
                    WHERE  s.entreprise = ?
                    AND    s.statut     = 'actif'
                    AND    s.actif      = true
                    AND    r.role      != 'directeur'
                    ORDER  BY s.utilisateur, s.date_debut DESC NULLS LAST
                ) sal
            ", [$entrepriseId, $directeurId, $entrepriseId]);

            $averageSalary = (float) ($avgRow->avg ?? 0);

            // ── Rôle le plus représenté ────────────────────────────────────────
            $topRoleRow = DB::selectOne("
                SELECT r.role
                FROM   appartenir_entreprise ae
                JOIN   roles_utilisateur r ON r.id = ae.role_utilisateur_id
                WHERE  ae.entreprise_id  = ?
                AND    ae.statut         = 'actif'
                AND    ae.utilisateur_id != ?
                AND    r.role           != 'directeur'
                GROUP  BY r.role
                ORDER  BY COUNT(DISTINCT ae.utilisateur_id) DESC
                LIMIT  1
            ", [$entrepriseId, $directeurId]);

            // ── Coût humain total ─────────────────────────────────────────────
            $totalCost = (float) DB::table('salaires')
                ->where('entreprise', $entrepriseId)
                ->where('statut', 'actif')
                ->where('actif', true)
                ->sum('montant');

            return response()->json([
                'salaryByRole'          => $salaryByRole,
                'employeesDistribution' => $employeesDistribution,
                'employeesEvolution'    => $employeesEvolution,
                'averageSalary'         => $averageSalary,
                'mostRepresentedRole'   => $topRoleRow?->role ?? null,
                'totalCost'             => $totalCost,
            ], 200);
        } catch (\Throwable $e) {
            return $this->rhErrorResponse($e, $request, __METHOD__);
        }
    }
}
