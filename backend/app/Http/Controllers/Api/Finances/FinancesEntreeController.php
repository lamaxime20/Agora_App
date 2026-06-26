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

class FinancesEntreeController extends FinancesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 17 — GET /api/finances/entrees
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée des entrées d'argent de l'entreprise.
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

            $query = DB::table('entrees_argent as e')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'e.utilisateur_marque')
                ->where('e.entreprise', $entrepriseId)
                ->where('e.actif', true);

            if ($recherche !== '') {
                $query->where('e.raison', 'ilike', '%' . $recherche . '%');
            }

            if ($from) {
                $query->where('e.date_entree', '>=', $from);
            }
            if ($to) {
                $query->where('e.date_entree', '<=', $to);
            }

            $total = $query->count();

            $data = $query
                ->orderBy('e.date_entree', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'e.id',
                    'e.montant',
                    'e.raison',
                    'e.date_entree',
                    DB::raw("CONCAT(u.name, ' ', u.prename) as enregistre_par"),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'            => $row->id,
                    'montant'       => (float) $row->montant,
                    'raison'        => $row->raison,
                    'date_entree'   => substr($row->date_entree, 0, 10),
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
    // ROUTE 18 — POST /api/finances/entrees
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Enregistre une nouvelle entrée d'argent.
     *
     * Body JSON : montant, date_entree, raison
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'montant'     => 'required|numeric|min:0.01',
                'date_entree' => 'required|date',
                'raison'      => 'required|string|max:1000',
            ], [
                'montant.required'     => 'Le montant est requis.',
                'montant.min'          => 'Le montant doit être supérieur à 0.',
                'date_entree.required' => "La date de l'entrée est requise.",
                'date_entree.date'     => "La date de l'entrée est invalide.",
                'raison.required'      => 'La raison est requise.',
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
            $dateEntree   = $request->input('date_entree');

            $entreeId = (string) Str::uuid();

            DB::table('entrees_argent')->insert([
                'id'                => $entreeId,
                'montant'           => $montant,
                'raison'            => $raison,
                'date_entree'       => $dateEntree,
                'entreprise'        => $entrepriseId,
                'utilisateur_marque'=> $user->id,
                'actif'             => true,
            ]);

            // Augmenter l'argent virtuel de l'entreprise
            DB::table('entreprises')
                ->where('id', $entrepriseId)
                ->increment('argent_virtuel', $montant);

            // Mouvement financier
            $this->creerMouvementFinancier(
                'entree_generale',
                'entree',
                $montant,
                $entrepriseId,
                $user->id,
                $entreeId,
                $raison
            );

            $this->history(
                'finances', 'entrees_argent', $entreeId,
                'entrée enregistrée',
                $request, $user->id, $entrepriseId
            );

            return response()->json([
                'entree' => [
                    'id'          => $entreeId,
                    'montant'     => $montant,
                    'raison'      => $raison,
                    'date_entree' => substr($dateEntree, 0, 10),
                ],
            ], 201);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 19 — GET /api/finances/entrees/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export des entrées filtrées en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), + mêmes filtres que route 17
     */
    /**
     * Fonction 1 — Point d'entrée export entrées d'argent.
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

        $rows    = $this->buildEntreesRows($entrepriseId, $from, $to, $recherche);
        $columns = [
            'raison'     => 'Raison',
            'montant'    => 'Montant',
            'date'       => "Date d'entrée",
            'enregistre' => 'Enregistré par',
        ];
        $subtitle = ($dateDebut && $dateFin) ? "Du $dateDebut au $dateFin"
                  : ($dateDebut ? "Depuis le $dateDebut" : ($dateFin ? "Jusqu'au $dateFin" : 'Toutes les périodes'));
        $filename = 'agora-entrees-' . now()->format('Ymd-His');

        return match ($format) {
            'csv', 'xlsx' => $this->generateCsv($rows, $columns, $filename),
            'docx'        => $this->generateDocx($rows, $columns, "Historique des Entrées d'Argent", $subtitle, $filename),
            default       => $this->generatePdf($rows, $columns, "Historique des Entrées d'Argent", $subtitle, $filename),
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

    private function buildEntreesRows(string $entrepriseId, ?Carbon $from, ?Carbon $to, string $recherche): array
    {
        $query = DB::table('entrees_argent as e')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'e.utilisateur_marque')
            ->where('e.entreprise', $entrepriseId)
            ->where('e.actif', true);

        if ($from) $query->where('e.date_entree', '>=', $from);
        if ($to)   $query->where('e.date_entree', '<=', $to);
        if ($recherche !== '') $query->where('e.raison', 'ilike', "%$recherche%");

        return $query
            ->orderBy('e.date_entree', 'desc')
            ->select([
                'e.montant', 'e.raison', 'e.date_entree',
                DB::raw("CONCAT(u.name, ' ', u.prename) as enregistre_par"),
            ])
            ->get()
            ->map(fn($r) => [
                'raison'     => $r->raison,
                'montant'    => ExportService::fmtMontant($r->montant),
                'date'       => ExportService::fmtDate($r->date_entree),
                'enregistre' => $r->enregistre_par,
            ])
            ->toArray();
    }
}
