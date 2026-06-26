<?php

namespace App\Http\Controllers\Api\Finances;

use App\Services\ExportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinancesDepenseController extends FinancesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 14 — GET /api/finances/depenses
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée des dépenses de l'entreprise.
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

            $query = DB::table('depenses as d')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'd.utilisateur_marque')
                ->where('d.entreprise', $entrepriseId)
                ->where('d.actif', true);

            if ($recherche !== '') {
                $query->where('d.raison', 'ilike', '%' . $recherche . '%');
            }

            if ($from) {
                $query->where('d.date_depense', '>=', $from);
            }
            if ($to) {
                $query->where('d.date_depense', '<=', $to);
            }

            $total = $query->count();

            $data = $query
                ->orderBy('d.date_depense', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'd.id',
                    'd.montant',
                    'd.raison',
                    'd.date_depense',
                    DB::raw("CONCAT(u.name, ' ', u.prename) as enregistre_par"),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'            => $row->id,
                    'montant'       => (float) $row->montant,
                    'raison'        => $row->raison,
                    'date_depense'  => substr($row->date_depense, 0, 10),
                    'enregistre_par'=> $row->enregistre_par,
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
    // ROUTE 15 — POST /api/finances/depenses
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Enregistre une nouvelle dépense.
     *
     * Body JSON : montant, date_depense, raison
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'montant'      => 'required|numeric|min:0.01',
                'date_depense' => 'required|date',
                'raison'       => 'required|string|max:1000',
            ], [
                'montant.required'      => 'Le montant est requis.',
                'montant.min'           => 'Le montant doit être supérieur à 0.',
                'date_depense.required' => 'La date de la dépense est requise.',
                'date_depense.date'     => 'La date de la dépense est invalide.',
                'raison.required'       => 'La raison est requise.',
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
            $montant      = (float) $request->input('montant');
            $raison       = $request->input('raison');
            $dateDepense  = $request->input('date_depense');

            $depenseId = (string) Str::uuid();

            DB::table('depenses')->insert([
                'id'                => $depenseId,
                'montant'           => $montant,
                'date_depense'      => $dateDepense,
                'raison'            => $raison,
                'entreprise'        => $entrepriseId,
                'utilisateur_marque'=> $user->id,
                'actif'             => true,
            ]);

            // Réduire l'argent virtuel de l'entreprise
            DB::table('entreprises')
                ->where('id', $entrepriseId)
                ->decrement('argent_virtuel', $montant);

            // Mouvement financier
            $this->creerMouvementFinancier(
                'depense_generale',
                'sortie',
                $montant,
                $entrepriseId,
                $user->id,
                $depenseId,
                $raison
            );

            $this->history(
                'finances', 'depenses', $depenseId,
                'dépense enregistrée',
                $request, $user->id, $entrepriseId
            );

            return response()->json([
                'depense' => [
                    'id'           => $depenseId,
                    'montant'      => $montant,
                    'raison'       => $raison,
                    'date_depense' => substr($dateDepense, 0, 10),
                ],
            ], 201);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 16 — GET /api/finances/depenses/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export des dépenses filtrées en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), + mêmes filtres que route 14
     */
    /**
     * Fonction 1 — Point d'entrée export dépenses.
     */
    public function export(Request $request): Response|StreamedResponse
    {
        $entreprise   = $this->currentEntreprise($request);
        $entrepriseId = $entreprise->id;
        $format       = strtolower($request->query('format', 'pdf'));
        $dateDebut    = $request->query('date_debut');
        $dateFin      = $request->query('date_fin');
        $recherche    = trim((string) $request->query('recherche', ''));

        [$from, $to] = $this->daterange($dateDebut, $dateFin);

        $rows    = $this->buildDepensesRows($entrepriseId, $from, $to, $recherche);
        $columns = [
            'raison'     => 'Raison',
            'montant'    => 'Montant',
            'date'       => 'Date dépense',
            'enregistre' => 'Enregistré par',
        ];
        $subtitle = ($dateDebut && $dateFin) ? "Du $dateDebut au $dateFin"
                  : ($dateDebut ? "Depuis le $dateDebut" : ($dateFin ? "Jusqu'au $dateFin" : 'Toutes les périodes'));
        $filename = 'agora-depenses-' . now()->format('Ymd-His');

        return match ($format) {
            'csv', 'xlsx' => $this->generateCsv($rows, $columns, $filename),
            'docx'        => $this->generateDocx($rows, $columns, 'Historique des Dépenses', $subtitle, $filename),
            default       => $this->generatePdf($rows, $columns, 'Historique des Dépenses', $subtitle, $filename),
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

    private function buildDepensesRows(string $entrepriseId, ?Carbon $from, ?Carbon $to, string $recherche): array
    {
        $query = DB::table('depenses as d')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'd.utilisateur_marque')
            ->where('d.entreprise', $entrepriseId)
            ->where('d.actif', true);

        if ($from) $query->where('d.date_depense', '>=', $from);
        if ($to)   $query->where('d.date_depense', '<=', $to);
        if ($recherche !== '') $query->where('d.raison', 'ilike', "%$recherche%");

        return $query
            ->orderBy('d.date_depense', 'desc')
            ->select([
                'd.montant', 'd.raison', 'd.date_depense',
                DB::raw("CONCAT(u.name, ' ', u.prename) as enregistre_par"),
            ])
            ->get()
            ->map(fn($r) => [
                'raison'     => $r->raison,
                'montant'    => ExportService::fmtMontant($r->montant),
                'date'       => ExportService::fmtDate($r->date_depense),
                'enregistre' => $r->enregistre_par,
            ])
            ->toArray();
    }
}
