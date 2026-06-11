<?php

namespace App\Http\Controllers\Api\RH;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RhDashboardController extends RhBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 1 — GET /api/rh/dashboard
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Tableau de bord RH : KPIs, évolution salariale, répartition des rôles.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;
            $directeurId  = $entreprise->directeur;
            $roleMeta     = $this->roleMeta();

            // ── Nombre total d'employés (hors directeur, une ligne par user) ──
            $totalEmployees = (int) DB::selectOne("
                SELECT COUNT(DISTINCT ae.utilisateur_id) AS cnt
                FROM   appartenir_entreprise ae
                JOIN   roles_utilisateur r ON r.id = ae.role_utilisateur_id
                WHERE  ae.entreprise_id  = ?
                AND    ae.statut         = 'actif'
                AND    ae.utilisateur_id != ?
                AND    r.role           != 'directeur'
            ", [$entrepriseId, $directeurId])->cnt;

            // ── Masse salariale totale (salaires actifs) ──────────────────────
            $salaryMass = (float) DB::table('salaires')
                ->where('entreprise', $entrepriseId)
                ->where('statut', 'actif')
                ->where('actif', true)
                ->sum('montant');

            // ── Rôles actifs distincts ────────────────────────────────────────
            $activeRoles = (int) DB::selectOne("
                SELECT COUNT(DISTINCT ae.role_utilisateur_id) AS cnt
                FROM   appartenir_entreprise ae
                JOIN   roles_utilisateur r ON r.id = ae.role_utilisateur_id
                WHERE  ae.entreprise_id  = ?
                AND    ae.statut         = 'actif'
                AND    ae.utilisateur_id != ?
                AND    r.role           != 'directeur'
            ", [$entrepriseId, $directeurId])->cnt;

            // ── Employés sans salaire actif ───────────────────────────────────
            $usersWithSalary = (int) DB::selectOne("
                SELECT COUNT(DISTINCT utilisateur) AS cnt
                FROM   salaires
                WHERE  entreprise = ?
                AND    statut     = 'actif'
                AND    actif      = true
            ", [$entrepriseId])->cnt;

            $employeesWithoutSalary = max(0, $totalEmployees - $usersWithSalary);

            // ── Évolution salariale — 12 derniers mois via paiements_salaires ─
            $salaryEvolution = DB::select("
                SELECT
                    TO_CHAR(DATE_TRUNC('month', ps.date_paiement), 'Mon YY') AS mois,
                    DATE_TRUNC('month', ps.date_paiement)                    AS mois_sort,
                    SUM(ps.montant)                                           AS montant
                FROM   paiements_salaires ps
                WHERE  ps.entreprise    = ?
                AND    ps.date_paiement >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
                GROUP  BY DATE_TRUNC('month', ps.date_paiement)
                ORDER  BY DATE_TRUNC('month', ps.date_paiement) ASC
            ", [$entrepriseId]);

            $salaryEvolutionFormatted = collect($salaryEvolution)->map(fn($r) => [
                'mois'    => $r->mois,
                'montant' => (float) $r->montant,
            ])->values();

            // ── Répartition des rôles ─────────────────────────────────────────
            $rolesRaw = DB::select("
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

            $rolesDistribution = collect($rolesRaw)->map(fn($r) => [
                'role'    => $r->role,
                'label'   => $roleMeta[$r->role]['label']   ?? $r->role,
                'count'   => (int) $r->count,
                'couleur' => $roleMeta[$r->role]['couleur'] ?? '#999999',
            ])->values();

            // ── Prévisualisation : 5 derniers employés ajoutés ────────────────
            $previewRaw = DB::select("
                SELECT DISTINCT ON (u.id)
                    u.id,
                    u.name                 AS nom,
                    u.prename              AS prenom,
                    u.email,
                    r.role,
                    ae.date_enregistrement,
                    ae.statut              AS ae_statut,
                    sal.montant            AS salaire
                FROM   utilisateurs u
                JOIN   appartenir_entreprise ae ON ae.utilisateur_id = u.id
                JOIN   roles_utilisateur r      ON r.id = ae.role_utilisateur_id
                LEFT JOIN LATERAL (
                    SELECT montant
                    FROM   salaires s
                    WHERE  s.utilisateur = u.id
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
                ORDER  BY u.id, ae.date_enregistrement DESC
                LIMIT  5
            ", [$entrepriseId, $entrepriseId, $directeurId]);

            $preview = collect($previewRaw)->map(fn($r) => [
                'id'        => $r->id,
                'nom'       => $r->nom,
                'prenom'    => $r->prenom,
                'email'     => $r->email,
                'role'      => $r->role,
                'salaire'   => $r->salaire !== null ? (float) $r->salaire : null,
                'dateAjout' => $r->date_enregistrement ? substr($r->date_enregistrement, 0, 10) : null,
                'statut'    => $r->ae_statut,
            ])->values();

            return response()->json([
                'totalEmployees'         => $totalEmployees,
                'salaryMass'             => $salaryMass,
                'activeRoles'            => $activeRoles,
                'employeesWithoutSalary' => $employeesWithoutSalary,
                'salaryEvolution'        => $salaryEvolutionFormatted,
                'rolesDistribution'      => $rolesDistribution,
                'preview'                => $preview,
            ], 200);
        } catch (\Throwable $e) {
            return $this->rhErrorResponse($e, $request, __METHOD__);
        }
    }
}
