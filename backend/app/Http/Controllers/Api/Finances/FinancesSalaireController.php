<?php

namespace App\Http\Controllers\Api\Finances;

use App\Services\ExportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
                ->selectRaw("
                    s.id,
                    s.montant,
                    s.date_debut,
                    s.date_fin,
                    s.statut,
                    u.id    AS utilisateur_id,
                    u.name  AS utilisateur_nom,
                    u.prename AS utilisateur_prenom,
                    (
                        SELECT r.role
                        FROM   appartenir_entreprise ae
                        JOIN   roles_utilisateur r ON r.id = ae.role_utilisateur_id
                        WHERE  ae.utilisateur_id  = s.utilisateur
                        AND    ae.entreprise_id   = ?
                        AND    ae.statut          = 'actif'
                        ORDER  BY ae.date_enregistrement DESC
                        LIMIT  1
                    ) AS poste
                ", [$entrepriseId])
                ->get()
                ->map(fn($row) => [
                    'id'          => $row->id,
                    'utilisateur' => [
                        'id'     => $row->utilisateur_id,
                        'nom'    => $row->utilisateur_nom,
                        'prenom' => $row->utilisateur_prenom,
                    ],
                    'poste'       => $row->poste,
                    'montant'     => (float) $row->montant,
                    'date_debut'  => $row->date_debut,
                    'date_fin'    => $row->date_fin,
                    'statut'      => $row->statut,
                ]);

            $masseSalariale = (float) DB::table('salaires')
                ->where('entreprise', $entrepriseId)
                ->where('statut', 'actif')
                ->where('actif', true)
                ->sum('montant');

            $dernierPaiement = DB::table('paiements_salaires')
                ->where('entreprise', $entrepriseId)
                ->max('date_paiement');

            if ($dernierPaiement) {
                $dernierPaiement = substr($dernierPaiement, 0, 10);
            }

            return response()->json([
                'data' => $data,
                'meta' => [
                    'page'            => $page,
                    'per_page'        => $perPage,
                    'total'           => $total,
                    'masseSalariale'  => $masseSalariale,
                    'dernierPaiement' => $dernierPaiement,
                ],
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
                    'id'        => $row->id,
                    'montant'   => (float) $row->montant,
                    'date'      => substr($row->date_paiement, 0, 10),
                    'periode'   => date('M Y', strtotime($row->date_paiement)),
                    'mode'      => $row->mode_payement,
                    'reference' => $row->reference_transaction,
                    'utilisateur' => $row->enregistre_par,
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
    // ROUTE 34 — GET /api/finances/salaires/{id}
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Détail complet d'un salaire : informations de l'employé, résumé financier et derniers paiements.
     *
     * Path param : id (UUID du salaire)
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $salaire = DB::table('salaires as s')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 's.utilisateur')
                ->where('s.id', $id)
                ->where('s.entreprise', $entrepriseId)
                ->selectRaw("
                    s.id,
                    s.montant,
                    s.date_debut,
                    s.date_fin,
                    s.statut,
                    u.id     AS utilisateur_id,
                    u.name   AS utilisateur_nom,
                    u.prename AS utilisateur_prenom,
                    u.email  AS utilisateur_email,
                    (
                        SELECT r.role
                        FROM   appartenir_entreprise ae
                        JOIN   roles_utilisateur r ON r.id = ae.role_utilisateur_id
                        WHERE  ae.utilisateur_id  = s.utilisateur
                        AND    ae.entreprise_id   = ?
                        AND    ae.statut          = 'actif'
                        ORDER  BY ae.date_enregistrement DESC NULLS LAST
                        LIMIT  1
                    ) AS poste
                ", [$entrepriseId])
                ->first();

            if (!$salaire) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Salaire introuvable.',
                ], 404);
            }

            $totalPaye = (float) DB::table('paiements_salaires')
                ->where('salaire', $id)
                ->where('entreprise', $entrepriseId)
                ->sum('montant');

            $nombrePaiements = (int) DB::table('paiements_salaires')
                ->where('salaire', $id)
                ->where('entreprise', $entrepriseId)
                ->count();

            $dernierPaiement = DB::table('paiements_salaires')
                ->where('salaire', $id)
                ->where('entreprise', $entrepriseId)
                ->max('date_paiement');

            $paiementsRecents = DB::table('paiements_salaires as ps')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'ps.user_enregistre')
                ->where('ps.salaire', $id)
                ->where('ps.entreprise', $entrepriseId)
                ->orderBy('ps.date_paiement', 'desc')
                ->limit(5)
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
                    'id'          => $row->id,
                    'montant'     => (float) $row->montant,
                    'date'        => substr($row->date_paiement, 0, 10),
                    'periode'     => date('M Y', strtotime($row->date_paiement)),
                    'mode'        => $row->mode_payement,
                    'reference'   => $row->reference_transaction,
                    'utilisateur' => $row->enregistre_par,
                ]);

            return response()->json([
                'id'         => $salaire->id,
                'utilisateur' => [
                    'id'     => $salaire->utilisateur_id,
                    'prenom' => $salaire->utilisateur_prenom,
                    'nom'    => $salaire->utilisateur_nom,
                    'email'  => $salaire->utilisateur_email,
                ],
                'poste'           => $salaire->poste,
                'date_debut'      => $salaire->date_debut ? substr($salaire->date_debut, 0, 10) : null,
                'date_fin'        => $salaire->date_fin   ? substr($salaire->date_fin,   0, 10) : null,
                'montant'         => (float) $salaire->montant,
                'statut'          => $salaire->statut,
                'totalPaye'       => $totalPaye,
                'nombrePaiements' => $nombrePaiements,
                'dernierPaiement' => $dernierPaiement ? substr($dernierPaiement, 0, 10) : null,
                'paiementsRecents'=> $paiementsRecents,
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
    /**
     * Fonction 1 — Point d'entrée export salaires.
     */
    public function export(Request $request): Response|StreamedResponse
    {
        $entreprise   = $this->currentEntreprise($request);
        $entrepriseId = $entreprise->id;
        $format       = strtolower($request->query('format', 'pdf'));
        $statut       = $request->query('statut', 'actif');
        $recherche    = trim((string) $request->query('recherche', ''));

        $rows    = $this->buildSalairesRows($entrepriseId, $statut, $recherche);
        $columns = [
            'employe'    => 'Employé',
            'poste'      => 'Poste',
            'montant'    => 'Salaire mensuel',
            'date_debut' => 'Date début',
            'date_fin'   => 'Date fin',
            'statut'     => 'Statut',
        ];
        $subtitle = $statut !== 'tous' ? ucfirst($statut) : 'Tous les salaires';
        $filename = 'agora-salaires-' . now()->format('Ymd-His');

        return match ($format) {
            'csv', 'xlsx' => $this->generateCsv($rows, $columns, $filename),
            'docx'        => $this->generateDocx($rows, $columns, 'Grille des Salaires', $subtitle, $filename),
            default       => $this->generatePdf($rows, $columns, 'Grille des Salaires', $subtitle, $filename),
        };
    }

    protected function generatePdf(array $rows, array $columns, string $title, string $subtitle, string $filename): Response
    {
        return ExportService::pdf($rows, $columns, $title, $subtitle, $filename);
    }

    protected function generateDocx(array $rows, array $columns, string $title, string $subtitle, string $filename): Response
    {
        return ExportService::docx($rows, $columns, $title, $subtitle, $filename);
    }

    protected function generateCsv(array $rows, array $columns, string $filename): StreamedResponse
    {
        return ExportService::csv($rows, $columns, $filename);
    }

    private function buildSalairesRows(string $entrepriseId, string $statut, string $recherche): array
    {
        $query = DB::table('salaires as s')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 's.utilisateur')
            ->where('s.entreprise', $entrepriseId)
            ->where('s.actif', true);

        if ($statut !== 'tous') $query->where('s.statut', $statut);

        if ($recherche !== '') {
            $query->where(function ($q) use ($recherche) {
                $q->where('u.name', 'ilike', "%$recherche%")
                  ->orWhere('u.prename', 'ilike', "%$recherche%");
            });
        }

        return $query
            ->orderBy('u.name', 'asc')
            ->selectRaw("
                s.montant, s.date_debut, s.date_fin, s.statut,
                CONCAT(u.name, ' ', u.prename) as employe,
                (
                    SELECT r.role
                    FROM   appartenir_entreprise ae
                    JOIN   roles_utilisateur r ON r.id = ae.role_utilisateur_id
                    WHERE  ae.utilisateur_id  = s.utilisateur
                    AND    ae.entreprise_id   = ?
                    AND    ae.statut          = 'actif'
                    ORDER  BY ae.date_enregistrement DESC
                    LIMIT  1
                ) AS poste
            ", [$entrepriseId])
            ->get()
            ->map(fn($r) => [
                'employe'    => $r->employe,
                'poste'      => $r->poste ?? '—',
                'montant'    => ExportService::fmtMontant($r->montant),
                'date_debut' => ExportService::fmtDate($r->date_debut),
                'date_fin'   => ExportService::fmtDate($r->date_fin),
                'statut'     => ucfirst($r->statut),
            ])
            ->toArray();
    }
}
